/**
 * Generates a random alphanumeric string
 * @param {number} length
 * @returns {string}
 */
function randomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Generate Payment ID
 * Format: pay_ + 12 alphanumeric characters
 * Example: pay_a9F3kLmP0QxZ
 */
function generatePaymentId() {
  return `pay_${randomString(12)}`;
}

/**
 * Generate Refund ID
 * Format: rfnd_ + 16 alphanumeric characters
 * Example: rfnd_A9kLmP0QxZ8N2sD1
 */
function generateRefundId() {
  return `rfnd_${randomString(16)}`;
}

/**
 * Generate Order ID (optional helper)
 * Format: order_ + 14 alphanumeric characters
 */
function generateOrderId() {
  return `order_${randomString(14)}`;
}

module.exports = {
  generatePaymentId,
  generateRefundId,
  generateOrderId,
};
