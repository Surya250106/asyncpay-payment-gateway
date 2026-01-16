const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

app.get("/dashboard/webhooks", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "webhooks.html"));
});

app.get("/dashboard/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "docs.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`📊 Dashboard running on port ${PORT}`);
});
