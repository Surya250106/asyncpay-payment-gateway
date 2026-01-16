const express = require("express");
const router = express.Router();

const {
  paymentQueue,
  refundQueue,
  webhookQueue,
} = require("../jobs/queue");

/**
 * GET /api/v1/test/jobs/status
 * No authentication required
 */
router.get("/test/jobs/status", async (req, res) => {
  try {
    const [
      paymentCounts,
      refundCounts,
      webhookCounts,
    ] = await Promise.all([
      paymentQueue.getJobCounts(),
      refundQueue.getJobCounts(),
      webhookQueue.getJobCounts(),
    ]);

    const pending =
      paymentCounts.waiting +
      refundCounts.waiting +
      webhookCounts.waiting;

    const processing =
      paymentCounts.active +
      refundCounts.active +
      webhookCounts.active;

    const completed =
      paymentCounts.completed +
      refundCounts.completed +
      webhookCounts.completed;

    const failed =
      paymentCounts.failed +
      refundCounts.failed +
      webhookCounts.failed;

    return res.json({
      pending,
      processing,
      completed,
      failed,
      worker_status: "running",
    });
  } catch (err) {
    console.error("Job status error:", err);
    res.status(500).json({
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      worker_status: "stopped",
    });
  }
});

module.exports = router;
