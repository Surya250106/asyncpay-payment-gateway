const {
  paymentQueue,
  refundQueue,
  webhookQueue,
} = require("../jobs/queue");

/**
 * Enqueue async payment processing
 */
async function enqueuePaymentJob(paymentId) {
  await paymentQueue.add(
    { paymentId },
    {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

/**
 * Enqueue async refund processing
 */
async function enqueueRefundJob(refundId) {
  await refundQueue.add(
    { refundId },
    {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

/**
 * Enqueue webhook delivery
 */
async function enqueueWebhookJob(data) {
  await webhookQueue.add(
    data,
    {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

module.exports = {
  enqueuePaymentJob,
  enqueueRefundJob,
  enqueueWebhookJob,
};
