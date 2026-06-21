-- Migration: add-payment-amount-column
-- Created: 2026-06-21T08:48:42.070Z

-- UP
ALTER TABLE orders ADD COLUMN payment_amount INT NULL AFTER payment_url;


-- DOWN
ALTER TABLE orders DROP COLUMN IF EXISTS payment_amount;


