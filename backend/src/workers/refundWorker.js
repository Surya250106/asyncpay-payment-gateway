const db = require("../services/db");
const { enqueueWebhookJob } = require("../services/jobProducer");

module.exports = async function processRefundJob(job) {
  try {
    const { refundId } = job.data;

    console.log("🔄 Processing refund:", refundId);

    const refundResult = await db.query(
      "SELECT * FROM refunds WHERE id=$1",
      [refundId]
    );

    if (refundResult.rowCount === 0) {
      console.error("❌ Refund not found:", refundId);
      return;
    }

    const refund = refundResult.rows[0];

    // Simulated delay (3–5s)
    const delayMs =
      process.env.TEST_MODE === "true"
        ? 1000
        : 3000 + Math.random() * 2000;

    await new Promise((res) => setTimeout(res, delayMs));

    // Mark refund processed
    await db.query(
      `
      UPDATE refunds
      SET status='processed',
          processed_at=NOW()
      WHERE id=$1
      `,
      [refundId]
    );

    console.log("✅ Refund processed:", refundId);

    // Enqueue webhook
    await enqueueWebhookJob({
      merchantId: refund.merchant_id,
      event: "refund.processed",
      payload: {
        event: "refund.processed",
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          refund: {
            id: refund.id,
            payment_id: refund.payment_id,
            amount: refund.amount,
            reason: refund.reason,
            status: "processed",
          },
        },
      },
    });
  } catch (err) {
    console.error("🔥 Refund worker error:", err);
  }
};
