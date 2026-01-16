const express = require("express");
const router = express.Router();

const { enqueuePaymentJob } = require("../services/jobProducer");
const { getMerchantFromHeaders } = require("../services/authService");
const { saveIdempotencyKey, getIdempotencyKey } = require("../services/idempotencyService");
const db = require("../services/db");

/**
 * POST /api/v1/payments
 */
router.post("/", async (req, res) => {
  try {
    // 1. Authenticate merchant
    const merchant = await getMerchantFromHeaders(req);
    if (!merchant) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 2. Handle Idempotency-Key
    const idemKey = req.headers["idempotency-key"];
    if (idemKey) {
      const cached = await getIdempotencyKey(idemKey, merchant.id);
      if (cached) {
        return res.status(201).json(cached);
      }
    }

    // 3. Validate request body
    const { order_id, method, amount, currency, vpa } = req.body;
    if (!order_id || !method || !amount || !currency) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Missing required fields",
        },
      });
    }

    // 4. Create payment record
    const paymentId = `pay_${Math.random().toString(36).substring(2, 18)}`;

    const payment = await db.query(
      `
      INSERT INTO payments
      (id, merchant_id, order_id, amount, currency, method, vpa, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
      RETURNING *
      `,
      [paymentId, merchant.id, order_id, amount, currency, method, vpa]
    );

    const response = {
      id: payment.rows[0].id,
      order_id: payment.rows[0].order_id,
      amount: payment.rows[0].amount,
      currency: payment.rows[0].currency,
      method: payment.rows[0].method,
      vpa: payment.rows[0].vpa,
      status: payment.rows[0].status,
      created_at: payment.rows[0].created_at,
    };

    // 5. Enqueue async payment processing
    await enqueuePaymentJob(paymentId);

    // 6. Save idempotency response
    if (idemKey) {
      await saveIdempotencyKey(idemKey, merchant.id, response);
    }

    // 7. Return immediately
    return res.status(201).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
