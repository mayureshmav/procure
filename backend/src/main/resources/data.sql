-- Seed data is now managed by Flyway migration V6__demo_seed_data.sql.
-- This file is kept as a placeholder; all inserts below are guarded and will
-- no-op once V6 has populated the tables.

INSERT INTO vendors (name, contact_name, email, phone, address, payment_terms, category, status, created_at)
SELECT * FROM (VALUES
  ('Metro Food Distributors', 'Raj Patel', 'raj@metrofood.com', '+91-98201-11234', 'APMC Market, Navi Mumbai 400705', 'NET30', 'Food & Beverage', 'ACTIVE', CURRENT_TIMESTAMP),
  ('CleanPro Supplies Ltd', 'Anita Sharma', 'anita@cleanpro.in', '+91-98765-43210', '14 Industrial Estate, Pune 411001', 'NET60', 'Cleaning & Hygiene', 'ACTIVE', CURRENT_TIMESTAMP),
  ('OfficeZone India', 'Vikram Singh', 'vikram@officezone.in', '+91-99001-55678', 'Plot 7, Andheri East, Mumbai 400069', 'COD', 'Office Supplies', 'ACTIVE', CURRENT_TIMESTAMP),
  ('Hospitality Linen Co.', 'Priya Nair', 'priya@hospitlinen.com', '+91-80070-22345', '22 Textile Hub, Surat 395003', 'NET45', 'Linen & Laundry', 'ACTIVE', CURRENT_TIMESTAMP),
  ('TechFix Equipment', 'Sanjay Kumar', 'sanjay@techfix.in', '+91-77007-88990', 'DLF Cyber City, Gurugram 122002', 'NET30', 'Maintenance & Equipment', 'ACTIVE', CURRENT_TIMESTAMP),
  ('Fresh Farm Organics', 'Meera Joshi', 'meera@freshfarm.in', '+91-88001-66543', 'Vashi APMC, Navi Mumbai 400703', 'COD', 'Food & Beverage', 'ACTIVE', CURRENT_TIMESTAMP)
) AS tmp(name, contact_name, email, phone, address, payment_terms, category, status, created_at)
WHERE NOT EXISTS (SELECT 1 FROM vendors LIMIT 1);

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT * FROM (VALUES
  ('FB-001', 'Basmati Rice 25kg', 'Long grain premium basmati rice', 'Grains', 1450.00, 'BAG', 1, 1, TRUE),
  ('FB-002', 'Cooking Oil 15L', 'Refined sunflower cooking oil', 'Oils & Fats', 1800.00, 'CAN', 1, 2, TRUE),
  ('FB-003', 'Tomato Puree 1kg', 'Concentrated tomato puree', 'Canned & Packed', 85.00, 'TIN', 1, 12, TRUE),
  ('FB-004', 'Chicken Breast 1kg', 'Fresh boneless chicken breast', 'Meat & Poultry', 320.00, 'KG', 1, 5, TRUE),
  ('CL-001', 'Floor Cleaner 5L', 'Industrial strength floor cleaner', 'Cleaning', 450.00, 'CAN', 2, 4, TRUE),
  ('CL-002', 'Toilet Cleaner 1L', 'HCL-based toilet bowl cleaner', 'Cleaning', 95.00, 'BTL', 2, 24, TRUE),
  ('CL-003', 'Hand Sanitizer 500ml', '70% alcohol hand rub sanitizer', 'Hygiene', 180.00, 'BTL', 2, 12, TRUE),
  ('OS-001', 'A4 Paper 500 sheets', 'Copier paper 75 GSM', 'Stationery', 350.00, 'RM', 3, 5, TRUE),
  ('OS-002', 'Ball Point Pens Box', 'Blue/black mixed pen box of 50', 'Stationery', 250.00, 'BOX', 3, 2, TRUE),
  ('OS-003', 'Printer Cartridge HP', 'HP 803 Black ink cartridge', 'Printing', 850.00, 'EA', 3, 1, TRUE),
  ('LL-001', 'Bed Sheets White King', 'White 400TC cotton bed sheets king size', 'Bed Linen', 1200.00, 'EA', 4, 6, TRUE),
  ('LL-002', 'Bath Towels White', '100% cotton 500 GSM bath towels', 'Bath Linen', 350.00, 'EA', 4, 12, TRUE),
  ('ME-001', 'Light Bulb LED 9W', 'LED bulb E27 base 9W warm white', 'Electrical', 120.00, 'EA', 5, 10, TRUE),
  ('ME-002', 'HVAC Filter', 'Air conditioning filter G4 grade', 'Maintenance', 450.00, 'EA', 5, 5, TRUE),
  ('FB-005', 'Fresh Tomatoes 10kg', 'Farm fresh tomatoes grade A', 'Vegetables', 280.00, 'KG', 6, 10, TRUE),
  ('FB-006', 'Onions 25kg', 'Red onions fresh farm grade A', 'Vegetables', 480.00, 'BAG', 6, 2, TRUE)
) AS tmp(sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
WHERE NOT EXISTS (SELECT 1 FROM items LIMIT 1);

INSERT INTO order_guides (name, description, is_shared, created_by, created_at)
SELECT * FROM (VALUES
  ('Kitchen Daily Order', 'Daily ingredients for F&B kitchen', TRUE, 'chef.raj', CURRENT_TIMESTAMP),
  ('Housekeeping Weekly', 'Weekly housekeeping supplies replenishment', TRUE, 'hk.manager', CURRENT_TIMESTAMP),
  ('Office Monthly', 'Monthly office stationery and supplies', FALSE, 'admin.office', CURRENT_TIMESTAMP)
) AS tmp(name, description, is_shared, created_by, created_at)
WHERE NOT EXISTS (SELECT 1 FROM order_guides LIMIT 1);

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT * FROM (VALUES
  (1, 1, 2, 1400.00),
  (1, 2, 3, 1750.00),
  (1, 3, 24, 80.00),
  (1, 15, 20, 270.00),
  (1, 16, 5, 460.00),
  (2, 5, 8, 440.00),
  (2, 6, 48, 90.00),
  (2, 7, 24, 170.00),
  (2, 11, 12, 1150.00),
  (2, 12, 24, 340.00),
  (3, 8, 10, 340.00),
  (3, 9, 4, 240.00),
  (3, 10, 5, 820.00)
) AS tmp(order_guide_id, item_id, default_qty, target_price)
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items LIMIT 1);

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT * FROM (VALUES
  (1, 8, 10, 50, 'Storeroom A - Shelf 1', CURRENT_TIMESTAMP),
  (2, 6, 8, 20, 'Storeroom A - Shelf 2', CURRENT_TIMESTAMP),
  (3, 45, 20, 100, 'Storeroom A - Shelf 3', CURRENT_TIMESTAMP),
  (4, 15, 20, 40, 'Cold Room - Section 1', CURRENT_TIMESTAMP),
  (5, 12, 8, 40, 'Housekeeping Store - Row 1', CURRENT_TIMESTAMP),
  (6, 3, 12, 60, 'Housekeeping Store - Row 2', CURRENT_TIMESTAMP),
  (7, 20, 10, 50, 'Housekeeping Store - Row 3', CURRENT_TIMESTAMP),
  (8, 25, 20, 100, 'Office Store - Shelf 1', CURRENT_TIMESTAMP),
  (9, 8, 5, 30, 'Office Store - Shelf 2', CURRENT_TIMESTAMP),
  (11, 18, 12, 48, 'Linen Room - Section A', CURRENT_TIMESTAMP),
  (12, 30, 24, 80, 'Linen Room - Section B', CURRENT_TIMESTAMP),
  (13, 5, 10, 50, 'Maintenance Store - Row 1', CURRENT_TIMESTAMP),
  (14, 4, 6, 20, 'Maintenance Store - Row 2', CURRENT_TIMESTAMP)
) AS tmp(item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
WHERE NOT EXISTS (SELECT 1 FROM inventory_items LIMIT 1);
