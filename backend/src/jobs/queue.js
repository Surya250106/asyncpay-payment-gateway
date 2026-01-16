const Queue = require("bull");

const REDIS_URL = process.env.REDIS_URL;

// Payment processing queue
const paymentQueue = new Queue("payment_queue", REDIS_URL);

// Refund processing queue
const refundQueue = new Queue("refund_queue", REDIS_URL);

// Webhook delivery queue
const webhookQueue = new Queue("webhook_queue", REDIS_URL);

module.exports = {
  paymentQueue,
  refundQueue,
  webhookQueue,
};
