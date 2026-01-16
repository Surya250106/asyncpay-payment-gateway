const db = require("./db");

async function getMerchantFromHeaders(req) {
  const apiKey = req.headers["x-api-key"];
  const apiSecret = req.headers["x-api-secret"];

  if (!apiKey || !apiSecret) return null;

  const result = await db.query(
    `SELECT * FROM merchants WHERE api_key=$1 AND api_secret=$2`,
    [apiKey, apiSecret]
  );

  return result.rows[0] || null;
}

module.exports = { getMerchantFromHeaders };
