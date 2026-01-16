const express = require("express");
const router = express.Router();

const db = require("../services/db");
const { getMerchantFromHeaders } = require("../services/authService");
const { enqueueWebhookJob } = require("../services/jobProducer");

/**
 * GET /api/v1/webhooks
 * List webhook logs
 */
router.get("/webhooks", async (req, res) => {
  try {
    const merchant = await getMerchantFromHeaders(req);
    if (!merchant) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const limit = Number(req.query.limit || 10);
    const offset = Number(req.query.offset || 0);

    const logs = await db.query(
      `
      SELECT id, event, status, attempts, created_at,
             last_attempt_at, response_code
      FROM webhook_logs
      WHERE merchant_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [merchant.id, limit, offset]
    );

    const count = await db.query(
      `SELECT COUNT(*) FROM webhook_logs WHERE merchant_id=$1`,
      [merchant.id]
    );

    return res.json({
      data: logs.rows,
      total: Number(count.rows[0].count),
      limit,
      offset,
    });
  } catch (err) {
    console.error("Webhook list error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/v1/webhooks/:id/retry
 * Manual retry webhook
 */
router.post("/webhooks/:id/retry", async (req, res) => {
  try {
    const merchant = await getMerchantFromHeaders(req);
    if (!merchant) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;

    const logResult = await db.query(
      `
      SELECT * FROM webhook_logs
      WHERE id=$1 AND merchant_id=$2
      `,
      [id, merchant.id]
    );

    if (logResult.rowCount === 0) {
      return res.status(404).json({ error: "Webhook log not found" });
    }

    const log = logResult.rows[0];

    // Reset log
    await db.query(
      `
      UPDATE webhook_logs
      SET status='pending',
          attempts=0,
          next_retry_at=NULL
      WHERE id=$1
      `,
      [id]
    );

    // Re-enqueue webhook
    await enqueueWebhookJob({
      merchantId: merchant.id,
      event: log.event,
      payload: log.payload,
    });

    return res.json({
      id: log.id,
      status: "pending",
      message: "Webhook retry scheduled",
    });
  } catch (err) {
    console.error("Webhook retry error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
