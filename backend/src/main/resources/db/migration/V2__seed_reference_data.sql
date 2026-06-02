-- ============================================================
-- V2: Seed UOM master, currency master, system admin user
-- ============================================================

-- UOM master
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'EA', 'Each', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='EA');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'CS', 'Case', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='CS');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'PK', 'Pack', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='PK');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'BX', 'Box', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='BX');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'KG', 'Kilogram', 'WEIGHT', TRUE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='KG');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'G', 'Gram', 'WEIGHT', TRUE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='G');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'LB', 'Pound', 'WEIGHT', TRUE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='LB');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'OZ', 'Ounce', 'WEIGHT', TRUE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='OZ');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'L', 'Litre', 'VOLUME', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='L');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'ML', 'Millilitre', 'VOLUME', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='ML');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'DZ', 'Dozen', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='DZ');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'RM', 'Ream', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='RM');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'BAG', 'Bag', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='BAG');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'BTL', 'Bottle', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='BTL');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'CAN', 'Can', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='CAN');
INSERT INTO uom_master (code, description, uom_type, is_catch_weight_eligible)
  SELECT 'TIN', 'Tin', 'EACH', FALSE WHERE NOT EXISTS (SELECT 1 FROM uom_master WHERE code='TIN');

-- Currency master
INSERT INTO currency_master (code, name, symbol, decimal_places, active)
  SELECT 'INR', 'Indian Rupee', '₹', 2, TRUE WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE code='INR');
INSERT INTO currency_master (code, name, symbol, decimal_places, active)
  SELECT 'USD', 'US Dollar', '$', 2, TRUE WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE code='USD');
INSERT INTO currency_master (code, name, symbol, decimal_places, active)
  SELECT 'EUR', 'Euro', '€', 2, TRUE WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE code='EUR');
INSERT INTO currency_master (code, name, symbol, decimal_places, active)
  SELECT 'GBP', 'British Pound', '£', 2, TRUE WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE code='GBP');
INSERT INTO currency_master (code, name, symbol, decimal_places, active)
  SELECT 'AUD', 'Australian Dollar', 'A$', 2, TRUE WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE code='AUD');
INSERT INTO currency_master (code, name, symbol, decimal_places, active)
  SELECT 'SGD', 'Singapore Dollar', 'S$', 2, TRUE WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE code='SGD');
INSERT INTO currency_master (code, name, symbol, decimal_places, active)
  SELECT 'AED', 'UAE Dirham', 'د.إ', 2, TRUE WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE code='AED');

-- System admin vendor & user (password: Admin@1234 — BCrypt hash)
INSERT INTO vendors (code, name, email, status)
  SELECT 'SYS', 'System Administration', 'admin@p2p.internal', 'ACTIVE'
  WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE code='SYS');

INSERT INTO users (vendor_id, username, email, password_hash, role, active)
  SELECT v.id, 'admin', 'admin@p2p.internal',
         '$2a$12$JubV0bjGQAJ/9cQgRnG.lOqY7QyTkLh.yu4KugLw.qPZoT/GDq0a6',
         'SYSTEM_ADMIN', TRUE
  FROM vendors v WHERE v.code='SYS'
  AND NOT EXISTS (SELECT 1 FROM users WHERE username='admin');
