const express = require("express");
const path = require("path");

const app = express();

// Serve SDK bundle
app.use(express.static(path.join(__dirname, "dist")));

// Serve checkout page
app.use(express.static(path.join(__dirname, "public")));

app.get("/checkout", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "checkout.html"));
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🛒 Checkout service running on port ${PORT}`);
});
