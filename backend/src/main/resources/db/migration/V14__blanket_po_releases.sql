-- Track blanket PO release orders
-- Each release order is a STANDARD PO linked back to a BLANKET PO
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS blanket_parent_id BIGINT;

-- released_amount tracks cumulative spend drawn against the blanket
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS blanket_released_amount NUMERIC(14,2) DEFAULT 0;

ALTER TABLE purchase_orders
  ADD CONSTRAINT fk_po_blanket_parent
  FOREIGN KEY (blanket_parent_id) REFERENCES purchase_orders(id);
