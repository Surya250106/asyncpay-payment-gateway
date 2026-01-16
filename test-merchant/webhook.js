const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json());

app.post("/webhook", (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const payload = JSON.stringify(req.body);

  const expected = crypto
    .createHmac("sha256", "whsec_test_abc123")
    .update(payload)
    .digest("hex");

  if (signature !== expected) {
    console.log("❌ Invalid webhook signature");
    return res.status(401).send("Invalid signature");
  }

  console.log("✅ Webhook received:", req.body.event);
  res.send("OK");
});

app.listen(4000, () => {
  console.log("🧪 Test merchant listening on port 4000");
});
