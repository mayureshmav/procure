-- ============================================================
-- V5 – Purchase Order Types
-- Adds order_type and type-specific metadata columns
-- ============================================================

-- order_type: the primary classification of the PO
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD';

-- Blanket PO fields: maximum committed spend and validity window
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS blanket_max_amount DECIMAL(14,2);
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS blanket_expiry_date DATE;
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS blanket_releases_count INT NOT NULL DEFAULT 0;

-- Storeroom PO fields: which inventory location and item this replenishes
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS storeroom_location VARCHAR(100);
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS storeroom_item_id BIGINT;

-- Confirming PO fields: reason for after-the-fact documentation
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS confirming_reason VARCHAR(500);
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS confirming_original_date DATE;

-- Planned PO fields: planned release date (may differ from delivery date)
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS planned_release_date DATE;

-- Emergency PO fields: justification and authorising manager
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS emergency_justification VARCHAR(1000);
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS emergency_authorised_by VARCHAR(200);

-- Service PO fields: acceptance details instead of goods receipt
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS service_description VARCHAR(500);
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS service_acceptance_date DATE;
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS service_accepted_by VARCHAR(200);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_po_order_type ON purchase_orders(order_type);

-- Seed: all existing POs default to STANDARD (already set by DEFAULT above)
-- This comment is intentional — no UPDATE needed.
