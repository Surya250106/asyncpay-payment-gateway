const db = require("./db");

async function getIdempotencyKey(key, merchantId) {
  const result = await db.query(
    `
    SELECT response FROM idempotency_keys
    WHERE key=$1 AND merchant_id=$2 AND expires_at > NOW()
    `,
    [key, merchantId]
  );

  return result.rows[0]?.response || null;
}

async function saveIdempotencyKey(key, merchantId, response) {
  await db.query(
    `
    INSERT INTO idempotency_keys
    (key, merchant_id, response, expires_at)
    VALUES ($1,$2,$3, NOW() + INTERVAL '24 hours')
    `,
    [key, merchantId, response]
  );
}

module.exports = {
  getIdempotencyKey,
  saveIdempotencyKey,
};
