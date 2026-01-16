require("dotenv").config();

const { paymentQueue, refundQueue, webhookQueue } =
  require("../jobs/queue");

const processPaymentJob = require("./paymentWorker");
const processRefundJob = require("./refundWorker");
const processWebhookJob = require("./webhookWorker");

console.log("🚀 AsyncPay Worker started");

// Attach processors
paymentQueue.process(processPaymentJob);
refundQueue.process(processRefundJob);
webhookQueue.process(processWebhookJob);
