const crypto = require("crypto");
const axios = require("axios");
const db = require("../services/db");

/**
 * Webhook retry schedule (seconds)
 */
const PROD_RETRIES = [0, 60, 300, 1800, 7200];
const TEST_RETRIES = [0, 5, 10, 15, 20];

module.exports = async function deliverWebhookJob(job) {
  try {
    const { merchantId, event, payload } = job.data;

    // 1. Fetch merchant
    const merchantResult = await db.query(
      "SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1",
      [merchantId]
    );

    if (merchantResult.rowCount === 0) {
      console.error("❌ Merchant not found for webhook");
      return;
    }

    const { webhook_url, webhook_secret } = merchantResult.rows[0];
    if (!webhook_url || !webhook_secret) {
      console.log("ℹ️ Webhook not configured, skipping");
      return;
    }

    // 2. Fetch or create webhook log
    const logResult = await db.query(
      `
      INSERT INTO webhook_logs (merchant_id, event, payload)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [merchantId, event, payload]
    );

    let log = logResult.rows[0];

    // 3. Generate HMAC signature
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", webhook_secret)
      .update(payloadString)
      .digest("hex");

    // 4. Send webhook
    let response;
    try {
      response = await axios.post(webhook_url, payloadString, {
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
        },
        timeout: 5000,
      });
    } catch (err) {
      response = err.response;
    }

    const success = response && response.status >= 200 && response.status < 300;

    // 5. Update log
    const nextAttempts = log.attempts + 1;
    const retryIntervals =
      process.env.WEBHOOK_RETRY_INTERVALS_TEST === "true"
        ? TEST_RETRIES
        : PROD_RETRIES;

    if (success) {
      await db.query(
        `
        UPDATE webhook_logs
        SET status='success',
            attempts=$1,
            last_attempt_at=NOW(),
            response_code=$2,
            response_body=$3
        WHERE id=$4
        `,
        [nextAttempts, response.status, response.data, log.id]
      );

      console.log("✅ Webhook delivered:", event);
    } else {
      if (nextAttempts >= 5) {
        await db.query(
          `
          UPDATE webhook_logs
          SET status='failed',
              attempts=$1,
              last_attempt_at=NOW(),
              response_code=$2,
              response_body=$3
          WHERE id=$4
          `,
          [nextAttempts, response?.status, response?.data, log.id]
        );

        console.log("❌ Webhook permanently failed");
      } else {
        const delay = retryIntervals[nextAttempts];
        await db.query(
          `
          UPDATE webhook_logs
          SET attempts=$1,
              status='pending',
              last_attempt_at=NOW(),
              next_retry_at=NOW() + INTERVAL '${delay} seconds',
              response_code=$2,
              response_body=$3
          WHERE id=$4
          `,
          [nextAttempts, response?.status, response?.data, log.id]
        );

        console.log(`🔁 Webhook retry scheduled in ${delay}s`);
      }
    }
  } catch (err) {
    console.error("🔥 Webhook worker error:", err);
  }
};
