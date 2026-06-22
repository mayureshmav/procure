-- V11: Tax Engine integration fields
-- Adds tax calculation results to purchase_orders and purchase_order_lines

ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS tax_amount        DECIMAL(14,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_currency      VARCHAR(3),
    ADD COLUMN IF NOT EXISTS tax_jurisdiction  VARCHAR(10),
    ADD COLUMN IF NOT EXISTS tax_audit_id      VARCHAR(64),
    ADD COLUMN IF NOT EXISTS tax_calculated_at TIMESTAMP;

ALTER TABLE purchase_order_lines
    ADD COLUMN IF NOT EXISTS tax_amount  DECIMAL(12,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_class   VARCHAR(50);
