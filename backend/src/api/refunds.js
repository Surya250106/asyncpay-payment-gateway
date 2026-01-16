const express = require("express");
const router = express.Router();

const db = require("../services/db");
const { getMerchantFromHeaders } = require("../services/authService");
const { enqueueRefundJob } = require("../services/jobProducer");

/**
 * POST /api/v1/payments/:paymentId/refunds
 */
router.post("/payments/:paymentId/refunds", async (req, res) => {
  try {
    const merchant = await getMerchantFromHeaders(req);
    if (!merchant) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Invalid refund amount",
        },
      });
    }

    // 1. Fetch payment
    const paymentResult = await db.query(
      "SELECT * FROM payments WHERE id=$1 AND merchant_id=$2",
      [paymentId, merchant.id]
    );

    if (paymentResult.rowCount === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== "success") {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Payment not refundable",
        },
      });
    }

    // 2. Calculate already refunded amount
    const refundedResult = await db.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS refunded
      FROM refunds
      WHERE payment_id=$1
      `,
      [paymentId]
    );

    const alreadyRefunded = Number(refundedResult.rows[0].refunded);

    if (amount > payment.amount - alreadyRefunded) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST_ERROR",
          description: "Refund amount exceeds available amount",
        },
      });
    }

    // 3. Create refund
    const refundId = `rfnd_${Math.random().toString(36).substring(2, 18)}`;

    const refundResult = await db.query(
      `
      INSERT INTO refunds
      (id, payment_id, merchant_id, amount, reason, status)
      VALUES ($1,$2,$3,$4,$5,'pending')
      RETURNING *
      `,
      [refundId, paymentId, merchant.id, amount, reason]
    );

    // 4. Enqueue async refund processing
    await enqueueRefundJob(refundId);

    return res.status(201).json({
      id: refundResult.rows[0].id,
      payment_id: refundResult.rows[0].payment_id,
      amount: refundResult.rows[0].amount,
      reason: refundResult.rows[0].reason,
      status: refundResult.rows[0].status,
      created_at: refundResult.rows[0].created_at,
    });
  } catch (err) {
    console.error("Refund API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
