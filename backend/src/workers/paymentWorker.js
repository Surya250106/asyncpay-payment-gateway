const db = require("../services/db");
const { enqueueWebhookJob } = require("../services/jobProducer");

module.exports = async function processPaymentJob(job) {
  try {
    const { paymentId } = job.data;

    console.log("🔄 Processing payment:", paymentId);

    // 1. Fetch payment
    const result = await db.query(
      "SELECT * FROM payments WHERE id = $1",
      [paymentId]
    );

    if (result.rowCount === 0) {
      console.error("❌ Payment not found:", paymentId);
      return;
    }

    const payment = result.rows[0];

    // 2. Delay (test mode safe)
    const testMode = process.env.TEST_MODE === "true";
    const delayMs = testMode
      ? Number(process.env.TEST_PROCESSING_DELAY || 1000)
      : 5000 + Math.random() * 5000;

    await new Promise((res) => setTimeout(res, delayMs));

    // 3. Determine success
    let isSuccess;
    if (testMode) {
      isSuccess = process.env.TEST_PAYMENT_SUCCESS !== "false";
    } else {
      isSuccess =
        payment.method === "upi"
          ? Math.random() < 0.9
          : Math.random() < 0.95;
    }

    // 4. Update payment
    if (isSuccess) {
      await db.query(
        `UPDATE payments SET status='success', updated_at=NOW() WHERE id=$1`,
        [paymentId]
      );

      console.log("✅ Payment success:", paymentId);

      await enqueueWebhookJob({
        merchantId: payment.merchant_id,
        event: "payment.success",
        payload: {
          event: "payment.success",
          timestamp: Math.floor(Date.now() / 1000),
          data: { payment },
        },
      });
    } else {
      await db.query(
        `
        UPDATE payments
        SET status='failed',
            error_code='PAYMENT_FAILED',
            error_description='Payment processing failed',
            updated_at=NOW()
        WHERE id=$1
        `,
        [paymentId]
      );

      console.log("❌ Payment failed:", paymentId);

      await enqueueWebhookJob({
        merchantId: payment.merchant_id,
        event: "payment.failed",
        payload: {
          event: "payment.failed",
          timestamp: Math.floor(Date.now() / 1000),
          data: { payment },
        },
      });
    }
  } catch (err) {
    console.error("🔥 Payment worker crashed:", err);
    // IMPORTANT: do NOT throw again — keep worker alive
  }
};
