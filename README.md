# AsyncPay – Production-Ready Async Payment Gateway

AsyncPay is a production-grade payment gateway demonstrating **asynchronous payment processing**, **webhook delivery with retries**, **idempotent APIs**, **refund handling**, and an **embeddable checkout SDK**.  
This project is designed for advanced backend evaluation and mirrors real-world fintech architectures (Stripe/Razorpay style).

---

## 🚀 Features

### Core Payments
- Async payment processing using Redis + workers
- Deterministic test mode support
- Idempotency keys (24-hour expiry)

### Webhooks
- Event-driven webhook delivery
- HMAC-SHA256 signature verification
- Automatic retries with exponential backoff
- Persistent delivery logs
- Manual retry endpoint

### Refunds
- Full and partial refunds
- Async refund processing
- Refund validation & safety checks
- Refund webhooks

### Frontend
- Embeddable JavaScript checkout SDK
- Modal + iframe (no redirect)
- postMessage communication
- Minimal merchant dashboard (optional)

### Evaluation Utilities
- Job queue status endpoint (no auth)
- Dockerized infrastructure
- Single-command startup

---

## 🏗 Architecture Overview

```
Merchant → API → Redis Queue → Worker
                    ↓
               Webhook Worker → Merchant Webhook
```

---

## 🐳 Tech Stack

- **Backend**: Node.js (Express)
- **Queue**: Redis + Bull
- **Database**: PostgreSQL
- **Frontend SDK**: Vanilla JS + Webpack
- **Containers**: Docker & Docker Compose

---

## ⚙️ Setup Instructions

### 1️⃣ Prerequisites
- Docker & Docker Compose
- Node.js (for local testing only)

### 2️⃣ Start the Application
```bash
docker-compose up -d --build
```

Services:
- API: http://localhost:8000
- Dashboard: http://localhost:3000
- Checkout: http://localhost:3001
- Redis: 6379
- Postgres: 5432

---

## 🗄 Database Setup

Apply schema:
```bash
docker exec -i asyncpay_postgres psql -U gateway_user -d payment_gateway < schema.sql
```

Test merchant credentials:
```
API Key: key_test_abc123
API Secret: secret_test_xyz789
```

---

## 🔐 Authentication

All merchant APIs require:
```
X-Api-Key
X-Api-Secret
```

---

## 📌 API Endpoints

### Create Payment
```
POST /api/v1/payments
```

### Create Refund
```
POST /api/v1/payments/:paymentId/refunds
```

### List Webhook Logs
```
GET /api/v1/webhooks
```

### Retry Webhook
```
POST /api/v1/webhooks/:id/retry
```

### Job Queue Status (Evaluator)
```
GET /api/v1/test/jobs/status
```

---

## 🔁 Webhook Events

- payment.created
- payment.pending
- payment.success
- payment.failed
- refund.created
- refund.processed

Signature verification:
```js
crypto.createHmac("sha256", secret)
  .update(JSON.stringify(payload))
  .digest("hex");
```

---

## 🧩 Checkout SDK Usage

```html
<script src="http://localhost:3001/checkout.js"></script>
<script>
const checkout = new PaymentGateway({
  key: "key_test_abc123",
  orderId: "order_123",
  onSuccess: (res) => console.log(res),
  onFailure: (err) => console.error(err)
});
checkout.open();
</script>
```

---

## 🧪 Testing Webhooks Locally

```bash
cd test-merchant
npm install
node webhook.js
```

Webhook URL:
```
http://host.docker.internal:4000/webhook
```

---

## 📁 Project Structure

```
backend/          # API + workers
checkout/         # Checkout service (iframe)
checkout-widget/  # SDK source + bundle
dashboard/        # Minimal dashboard UI
test-merchant/    # Webhook receiver
schema.sql
docker-compose.yml
```

---

## ✅ Evaluation Checklist

- Async workers ✔
- Webhook retries ✔
- Idempotency ✔
- Refunds ✔
- SDK ✔
- Job status endpoint ✔

---

## 📜 License

MIT – for educational and evaluation use.
