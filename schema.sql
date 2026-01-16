-- ================================
-- AsyncPay Payment Gateway Schema
-- ================================

-- Enable UUID generation (required)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- Merchants Table
-- ================================
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(64) NOT NULL,
  api_secret VARCHAR(64) NOT NULL,
  webhook_url TEXT,
  webhook_secret VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test merchant (idempotent)
INSERT INTO merchants (email, api_key, api_secret, webhook_secret)
VALUES (
  'test@example.com',
  'key_test_abc123',
  'secret_test_xyz789',
  'whsec_test_abc123'
)
ON CONFLICT (email) DO NOTHING;

-- ================================
-- Payments Table
-- ================================
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  merchant_id UUID NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL,
  method VARCHAR(20) NOT NULL,
  vpa VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  captured BOOLEAN DEFAULT false,
  error_code VARCHAR(50),
  error_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_payment_merchant
    FOREIGN KEY (merchant_id)
    REFERENCES merchants(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_merchant
ON payments(merchant_id);

-- ================================
-- Refunds Table
-- ================================
CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL,
  merchant_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,

  CONSTRAINT fk_refund_payment
    FOREIGN KEY (payment_id)
    REFERENCES payments(id),

  CONSTRAINT fk_refund_merchant
    FOREIGN KEY (merchant_id)
    REFERENCES merchants(id)
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment
ON refunds(payment_id);

-- ================================
-- Webhook Logs Table
-- ================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  event VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  response_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_webhook_merchant
    FOREIGN KEY (merchant_id)
    REFERENCES merchants(id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_merchant
ON webhook_logs(merchant_id);

CREATE INDEX IF NOT EXISTS idx_webhook_status
ON webhook_logs(status);

CREATE INDEX IF NOT EXISTS idx_webhook_retry
ON webhook_logs(next_retry_at)
WHERE status = 'pending';

-- ================================
-- Idempotency Keys Table
-- ================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key VARCHAR(255) NOT NULL,
  merchant_id UUID NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,

  PRIMARY KEY (key, merchant_id),

  CONSTRAINT fk_idempotency_merchant
    FOREIGN KEY (merchant_id)
    REFERENCES merchants(id)
);

-- ================================
-- END OF SCHEMA
-- ================================
