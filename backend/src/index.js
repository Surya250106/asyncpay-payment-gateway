const express = require("express");

const paymentsRoute = require("./api/payments");
const refundsRoute = require("./api/refunds");
const webhooksRoute = require("./api/webhooks");
const jobStatusRoute = require("./api/jobStatus");



const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/payments", paymentsRoute);

app.use("/api/v1", refundsRoute);
app.use("/api/v1", webhooksRoute);
app.use("/api/v1", jobStatusRoute);




// Health check (optional but helpful)
app.get("/", (req, res) => {
  res.send("AsyncPay API running");
});

// Start server (CRITICAL: bind to 0.0.0.0)
const PORT = 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AsyncPay API running on port ${PORT}`);
});
