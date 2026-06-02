-- ============================================================
-- V6: Demo seed data — 6 records per entity type
-- Moves vendor/item seeds from data.sql into Flyway so a
-- fresh database also gets all demo data correctly.
-- ============================================================

-- ── Vendors (6) ──────────────────────────────────────────────

INSERT INTO vendors (name, contact_name, email, phone, address, payment_terms, category, status, created_at)
SELECT 'Metro Food Distributors','Raj Patel','raj@metrofood.com','+91-98201-11234',
       'APMC Market, Navi Mumbai 400705','NET30','Food & Beverage','ACTIVE',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name='Metro Food Distributors');

INSERT INTO vendors (name, contact_name, email, phone, address, payment_terms, category, status, created_at)
SELECT 'CleanPro Supplies Ltd','Anita Sharma','anita@cleanpro.in','+91-98765-43210',
       '14 Industrial Estate, Pune 411001','NET60','Cleaning & Hygiene','ACTIVE',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name='CleanPro Supplies Ltd');

INSERT INTO vendors (name, contact_name, email, phone, address, payment_terms, category, status, created_at)
SELECT 'OfficeZone India','Vikram Singh','vikram@officezone.in','+91-99001-55678',
       'Plot 7, Andheri East, Mumbai 400069','COD','Office Supplies','ACTIVE',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name='OfficeZone India');

INSERT INTO vendors (name, contact_name, email, phone, address, payment_terms, category, status, created_at)
SELECT 'Hospitality Linen Co.','Priya Nair','priya@hospitlinen.com','+91-80070-22345',
       '22 Textile Hub, Surat 395003','NET45','Linen & Laundry','ACTIVE',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name='Hospitality Linen Co.');

INSERT INTO vendors (name, contact_name, email, phone, address, payment_terms, category, status, created_at)
SELECT 'TechFix Equipment','Sanjay Kumar','sanjay@techfix.in','+91-77007-88990',
       'DLF Cyber City, Gurugram 122002','NET30','Maintenance & Equipment','ACTIVE',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name='TechFix Equipment');

INSERT INTO vendors (name, contact_name, email, phone, address, payment_terms, category, status, created_at)
SELECT 'Fresh Farm Organics','Meera Joshi','meera@freshfarm.in','+91-88001-66543',
       'Vashi APMC, Navi Mumbai 400703','COD','Food & Beverage','ACTIVE',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name='Fresh Farm Organics');

-- ── Items (16) ───────────────────────────────────────────────

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-001','Basmati Rice 25kg','Long grain premium basmati rice','Grains',1450.00,'BAG',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-001');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-002','Cooking Oil 15L','Refined sunflower cooking oil','Oils & Fats',1800.00,'CAN',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-002');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-003','Tomato Puree 1kg','Concentrated tomato puree','Canned & Packed',85.00,'TIN',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),12,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-003');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-004','Chicken Breast 1kg','Fresh boneless chicken breast','Meat & Poultry',320.00,'KG',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),5,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-004');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'CL-001','Floor Cleaner 5L','Industrial strength floor cleaner','Cleaning',450.00,'CAN',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),4,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='CL-001');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'CL-002','Toilet Cleaner 1L','HCL-based toilet bowl cleaner','Cleaning',95.00,'BTL',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),24,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='CL-002');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'CL-003','Hand Sanitizer 500ml','70% alcohol hand rub sanitizer','Hygiene',180.00,'BTL',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),12,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='CL-003');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'OS-001','A4 Paper 500 sheets','Copier paper 75 GSM','Stationery',350.00,'RM',
       (SELECT id FROM vendors WHERE name='OfficeZone India'),5,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='OS-001');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'OS-002','Ball Point Pens Box','Blue/black mixed pen box of 50','Stationery',250.00,'BOX',
       (SELECT id FROM vendors WHERE name='OfficeZone India'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='OS-002');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'OS-003','Printer Cartridge HP','HP 803 Black ink cartridge','Printing',850.00,'EA',
       (SELECT id FROM vendors WHERE name='OfficeZone India'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='OS-003');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'LL-001','Bed Sheets White King','White 400TC cotton bed sheets king size','Bed Linen',1200.00,'EA',
       (SELECT id FROM vendors WHERE name='Hospitality Linen Co.'),6,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='LL-001');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'LL-002','Bath Towels White','100% cotton 500 GSM bath towels','Bath Linen',350.00,'EA',
       (SELECT id FROM vendors WHERE name='Hospitality Linen Co.'),12,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='LL-002');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'ME-001','Light Bulb LED 9W','LED bulb E27 base 9W warm white','Electrical',120.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),10,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='ME-001');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'ME-002','HVAC Filter','Air conditioning filter G4 grade','Maintenance',450.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),5,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='ME-002');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-005','Fresh Tomatoes 10kg','Farm fresh tomatoes grade A','Vegetables',280.00,'KG',
       (SELECT id FROM vendors WHERE name='Fresh Farm Organics'),10,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-005');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-006','Onions 25kg','Red onions fresh farm grade A','Vegetables',480.00,'BAG',
       (SELECT id FROM vendors WHERE name='Fresh Farm Organics'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-006');

-- ── Order Guides (6 total: 3 original + 3 new) ───────────────

INSERT INTO order_guides (name, description, is_shared, created_by, created_at)
SELECT 'Kitchen Daily Order','Daily ingredients for F&B kitchen',TRUE,'chef.raj',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM order_guides WHERE name='Kitchen Daily Order');

INSERT INTO order_guides (name, description, is_shared, created_by, created_at)
SELECT 'Housekeeping Weekly','Weekly housekeeping supplies replenishment',TRUE,'hk.manager',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM order_guides WHERE name='Housekeeping Weekly');

INSERT INTO order_guides (name, description, is_shared, created_by, created_at)
SELECT 'Office Monthly','Monthly office stationery and supplies',FALSE,'admin.office',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM order_guides WHERE name='Office Monthly');

INSERT INTO order_guides (name, description, is_shared, created_by, created_at)
SELECT 'Maintenance Monthly','Monthly maintenance parts and electrical supplies',FALSE,'eng.manager',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM order_guides WHERE name='Maintenance Monthly');

INSERT INTO order_guides (name, description, is_shared, created_by, created_at)
SELECT 'F&B Dry Store Weekly','Weekly dry goods replenishment for all F&B outlets',TRUE,'fnb.manager',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM order_guides WHERE name='F&B Dry Store Weekly');

INSERT INTO order_guides (name, description, is_shared, created_by, created_at)
SELECT 'Linen Par Stock','Standard par-level replenishment for linen room',TRUE,'hk.manager',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM order_guides WHERE name='Linen Par Stock');

-- ── Order Guide Items ─────────────────────────────────────────

-- Kitchen Daily Order
INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Kitchen Daily Order'),
       (SELECT id FROM items WHERE sku='FB-001'),2,1400.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Kitchen Daily Order')
  AND item_id=(SELECT id FROM items WHERE sku='FB-001'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Kitchen Daily Order'),
       (SELECT id FROM items WHERE sku='FB-002'),3,1750.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Kitchen Daily Order')
  AND item_id=(SELECT id FROM items WHERE sku='FB-002'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Kitchen Daily Order'),
       (SELECT id FROM items WHERE sku='FB-003'),24,80.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Kitchen Daily Order')
  AND item_id=(SELECT id FROM items WHERE sku='FB-003'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Kitchen Daily Order'),
       (SELECT id FROM items WHERE sku='FB-005'),20,270.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Kitchen Daily Order')
  AND item_id=(SELECT id FROM items WHERE sku='FB-005'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Kitchen Daily Order'),
       (SELECT id FROM items WHERE sku='FB-006'),5,460.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Kitchen Daily Order')
  AND item_id=(SELECT id FROM items WHERE sku='FB-006'));

-- Housekeeping Weekly
INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Housekeeping Weekly'),
       (SELECT id FROM items WHERE sku='CL-001'),8,440.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Housekeeping Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='CL-001'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Housekeeping Weekly'),
       (SELECT id FROM items WHERE sku='CL-002'),48,90.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Housekeeping Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='CL-002'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Housekeeping Weekly'),
       (SELECT id FROM items WHERE sku='CL-003'),24,170.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Housekeeping Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='CL-003'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Housekeeping Weekly'),
       (SELECT id FROM items WHERE sku='LL-001'),12,1150.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Housekeeping Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='LL-001'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Housekeeping Weekly'),
       (SELECT id FROM items WHERE sku='LL-002'),24,340.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Housekeeping Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='LL-002'));

-- Office Monthly
INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Office Monthly'),
       (SELECT id FROM items WHERE sku='OS-001'),10,340.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Office Monthly')
  AND item_id=(SELECT id FROM items WHERE sku='OS-001'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Office Monthly'),
       (SELECT id FROM items WHERE sku='OS-002'),4,240.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Office Monthly')
  AND item_id=(SELECT id FROM items WHERE sku='OS-002'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Office Monthly'),
       (SELECT id FROM items WHERE sku='OS-003'),5,820.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Office Monthly')
  AND item_id=(SELECT id FROM items WHERE sku='OS-003'));

-- Maintenance Monthly (new)
INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Maintenance Monthly'),
       (SELECT id FROM items WHERE sku='ME-001'),50,115.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Maintenance Monthly')
  AND item_id=(SELECT id FROM items WHERE sku='ME-001'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Maintenance Monthly'),
       (SELECT id FROM items WHERE sku='ME-002'),10,430.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Maintenance Monthly')
  AND item_id=(SELECT id FROM items WHERE sku='ME-002'));

-- F&B Dry Store Weekly (new)
INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='F&B Dry Store Weekly'),
       (SELECT id FROM items WHERE sku='FB-001'),5,1400.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='F&B Dry Store Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='FB-001'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='F&B Dry Store Weekly'),
       (SELECT id FROM items WHERE sku='FB-002'),5,1750.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='F&B Dry Store Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='FB-002'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='F&B Dry Store Weekly'),
       (SELECT id FROM items WHERE sku='FB-003'),48,80.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='F&B Dry Store Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='FB-003'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='F&B Dry Store Weekly'),
       (SELECT id FROM items WHERE sku='FB-004'),20,310.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='F&B Dry Store Weekly')
  AND item_id=(SELECT id FROM items WHERE sku='FB-004'));

-- Linen Par Stock (new)
INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Linen Par Stock'),
       (SELECT id FROM items WHERE sku='LL-001'),24,1150.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Linen Par Stock')
  AND item_id=(SELECT id FROM items WHERE sku='LL-001'));

INSERT INTO order_guide_items (order_guide_id, item_id, default_qty, target_price)
SELECT (SELECT id FROM order_guides WHERE name='Linen Par Stock'),
       (SELECT id FROM items WHERE sku='LL-002'),48,340.00
WHERE NOT EXISTS (SELECT 1 FROM order_guide_items
  WHERE order_guide_id=(SELECT id FROM order_guides WHERE name='Linen Par Stock')
  AND item_id=(SELECT id FROM items WHERE sku='LL-002'));

-- ── Inventory Items ───────────────────────────────────────────

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-001'),8,10,50,'Storeroom A - Shelf 1',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-001'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-002'),6,8,20,'Storeroom A - Shelf 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-002'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-003'),45,20,100,'Storeroom A - Shelf 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-003'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-004'),15,20,40,'Cold Room - Section 1',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-004'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='CL-001'),12,8,40,'Housekeeping Store - Row 1',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='CL-001'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='CL-002'),3,12,60,'Housekeeping Store - Row 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='CL-002'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='CL-003'),20,10,50,'Housekeeping Store - Row 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='CL-003'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='OS-001'),25,20,100,'Office Store - Shelf 1',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='OS-001'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='OS-002'),8,5,30,'Office Store - Shelf 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='OS-002'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='LL-001'),18,12,48,'Linen Room - Section A',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='LL-001'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='LL-002'),30,24,80,'Linen Room - Section B',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='LL-002'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='ME-001'),5,10,50,'Maintenance Store - Row 1',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='ME-001'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='ME-002'),4,6,20,'Maintenance Store - Row 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='ME-002'));

-- ── Requisitions (6) ─────────────────────────────────────────

INSERT INTO requisitions (req_number, title, requested_by, department, status, notes, total_amount, created_at, submitted_at, approved_at, approved_by)
SELECT 'REQ-2025-001','Kitchen Restocking — Rice & Oil','chef.raj','Kitchen','APPROVED',
  'Urgent restock ahead of weekend banquet season.',86900.00,
  DATEADD('DAY',-15,CURRENT_TIMESTAMP),DATEADD('DAY',-14,CURRENT_TIMESTAMP),
  DATEADD('DAY',-13,CURRENT_TIMESTAMP),'procurement.mgr'
WHERE NOT EXISTS (SELECT 1 FROM requisitions WHERE req_number='REQ-2025-001');

INSERT INTO requisitions (req_number, title, requested_by, department, status, notes, total_amount, created_at, submitted_at, approved_at, approved_by)
SELECT 'REQ-2025-002','Housekeeping Supplies — Cleaning Products','hk.supervisor','Housekeeping','SUBMITTED',
  'Monthly replenishment of all cleaning chemicals.',17880.00,
  DATEADD('DAY',-10,CURRENT_TIMESTAMP),DATEADD('DAY',-9,CURRENT_TIMESTAMP),NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM requisitions WHERE req_number='REQ-2025-002');

INSERT INTO requisitions (req_number, title, requested_by, department, status, notes, total_amount, created_at, submitted_at, approved_at, approved_by)
SELECT 'REQ-2025-003','Office Stationery — Q2 2025','admin.officer','Administration','APPROVED',
  'Quarterly stationery and printer consumables.',13750.00,
  DATEADD('DAY',-20,CURRENT_TIMESTAMP),DATEADD('DAY',-19,CURRENT_TIMESTAMP),
  DATEADD('DAY',-18,CURRENT_TIMESTAMP),'dept.head'
WHERE NOT EXISTS (SELECT 1 FROM requisitions WHERE req_number='REQ-2025-003');

INSERT INTO requisitions (req_number, title, requested_by, department, status, notes, total_amount, created_at, submitted_at, approved_at, approved_by)
SELECT 'REQ-2025-004','Linen Room Par Stock Replenishment','hk.manager','Housekeeping','DRAFT',
  'Annual refresh of guest-room linen par levels.',45600.00,
  DATEADD('DAY',-5,CURRENT_TIMESTAMP),NULL,NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM requisitions WHERE req_number='REQ-2025-004');

INSERT INTO requisitions (req_number, title, requested_by, department, status, notes, total_amount, created_at, submitted_at, approved_at, approved_by)
SELECT 'REQ-2025-005','Maintenance Parts — Electrical & HVAC','eng.supervisor','Engineering','SUBMITTED',
  'Preventive maintenance stock replenishment.',10500.00,
  DATEADD('DAY',-7,CURRENT_TIMESTAMP),DATEADD('DAY',-6,CURRENT_TIMESTAMP),NULL,NULL
WHERE NOT EXISTS (SELECT 1 FROM requisitions WHERE req_number='REQ-2025-005');

INSERT INTO requisitions (req_number, title, requested_by, department, status, notes, total_amount, created_at, submitted_at, approved_at, approved_by)
SELECT 'REQ-2025-006','Fresh Produce — Weekly Kitchen Order','chef.raj','Kitchen','CONVERTED',
  'Weekly fresh vegetable order from local farm supplier.',32800.00,
  DATEADD('DAY',-3,CURRENT_TIMESTAMP),DATEADD('DAY',-3,CURRENT_TIMESTAMP),
  DATEADD('DAY',-2,CURRENT_TIMESTAMP),'procurement.mgr'
WHERE NOT EXISTS (SELECT 1 FROM requisitions WHERE req_number='REQ-2025-006');

-- ── Requisition Lines ─────────────────────────────────────────

-- REQ-001 lines: 50 bags rice (72500) + 8 cans oil (14400) = 86900
INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-001'),
       (SELECT id FROM items WHERE sku='FB-001'),50,1450.00,72500.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-001')
  AND item_id=(SELECT id FROM items WHERE sku='FB-001'));

INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-001'),
       (SELECT id FROM items WHERE sku='FB-002'),8,1800.00,14400.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-001')
  AND item_id=(SELECT id FROM items WHERE sku='FB-002'));

-- REQ-002 lines: 20 cans floor cleaner (9000) + 48 toilet cleaner (4560) + 24 sanitizer (4320) = 17880
INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-002'),
       (SELECT id FROM items WHERE sku='CL-001'),20,450.00,9000.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-002')
  AND item_id=(SELECT id FROM items WHERE sku='CL-001'));

INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-002'),
       (SELECT id FROM items WHERE sku='CL-002'),48,95.00,4560.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-002')
  AND item_id=(SELECT id FROM items WHERE sku='CL-002'));

INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-002'),
       (SELECT id FROM items WHERE sku='CL-003'),24,180.00,4320.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-002')
  AND item_id=(SELECT id FROM items WHERE sku='CL-003'));

-- REQ-003 lines: 20 reams paper (7000) + 10 pen boxes (2500) + 5 cartridges (4250) = 13750
INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-003'),
       (SELECT id FROM items WHERE sku='OS-001'),20,350.00,7000.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-003')
  AND item_id=(SELECT id FROM items WHERE sku='OS-001'));

INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-003'),
       (SELECT id FROM items WHERE sku='OS-002'),10,250.00,2500.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-003')
  AND item_id=(SELECT id FROM items WHERE sku='OS-002'));

INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-003'),
       (SELECT id FROM items WHERE sku='OS-003'),5,850.00,4250.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-003')
  AND item_id=(SELECT id FROM items WHERE sku='OS-003'));

-- REQ-004 lines: 24 bed sheets (28800) + 48 bath towels (16800) = 45600
INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-004'),
       (SELECT id FROM items WHERE sku='LL-001'),24,1200.00,28800.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-004')
  AND item_id=(SELECT id FROM items WHERE sku='LL-001'));

INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-004'),
       (SELECT id FROM items WHERE sku='LL-002'),48,350.00,16800.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-004')
  AND item_id=(SELECT id FROM items WHERE sku='LL-002'));

-- REQ-005 lines: 50 LED bulbs (6000) + 10 HVAC filters (4500) = 10500
INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-005'),
       (SELECT id FROM items WHERE sku='ME-001'),50,120.00,6000.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-005')
  AND item_id=(SELECT id FROM items WHERE sku='ME-001'));

INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-005'),
       (SELECT id FROM items WHERE sku='ME-002'),10,450.00,4500.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-005')
  AND item_id=(SELECT id FROM items WHERE sku='ME-002'));

-- REQ-006 lines: 100 kg tomatoes (28000) + 10 bags onions (4800) = 32800
INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-006'),
       (SELECT id FROM items WHERE sku='FB-005'),100,280.00,28000.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-006')
  AND item_id=(SELECT id FROM items WHERE sku='FB-005'));

INSERT INTO requisition_lines (requisition_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM requisitions WHERE req_number='REQ-2025-006'),
       (SELECT id FROM items WHERE sku='FB-006'),10,480.00,4800.00
WHERE NOT EXISTS (SELECT 1 FROM requisition_lines
  WHERE requisition_id=(SELECT id FROM requisitions WHERE req_number='REQ-2025-006')
  AND item_id=(SELECT id FROM items WHERE sku='FB-006'));

-- ── Purchase Orders (6) ───────────────────────────────────────

INSERT INTO purchase_orders (po_number, vendor_id, requisition_id, status, delivery_date, notes, total_amount, created_at, submitted_at, order_type)
SELECT 'PO-2025-001',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),
       (SELECT id FROM requisitions WHERE req_number='REQ-2025-001'),
       'RECEIVED', DATEADD('DAY',-10,CURRENT_DATE),
       'Delivered in full. Quality checked and accepted.',86900.00,
       DATEADD('DAY',-13,CURRENT_TIMESTAMP),DATEADD('DAY',-13,CURRENT_TIMESTAMP),'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM purchase_orders WHERE po_number='PO-2025-001');

INSERT INTO purchase_orders (po_number, vendor_id, requisition_id, status, delivery_date, notes, total_amount, created_at, submitted_at, order_type)
SELECT 'PO-2025-002',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),
       (SELECT id FROM requisitions WHERE req_number='REQ-2025-002'),
       'ACKNOWLEDGED', DATEADD('DAY',5,CURRENT_DATE),
       'Vendor confirmed order. Delivery expected in 5 days.',17880.00,
       DATEADD('DAY',-9,CURRENT_TIMESTAMP),DATEADD('DAY',-9,CURRENT_TIMESTAMP),'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM purchase_orders WHERE po_number='PO-2025-002');

INSERT INTO purchase_orders (po_number, vendor_id, requisition_id, status, delivery_date, notes, total_amount, created_at, submitted_at, order_type)
SELECT 'PO-2025-003',
       (SELECT id FROM vendors WHERE name='OfficeZone India'),
       (SELECT id FROM requisitions WHERE req_number='REQ-2025-003'),
       'SUBMITTED', DATEADD('DAY',7,CURRENT_DATE),
       'Order sent. Awaiting vendor acknowledgement.',13750.00,
       DATEADD('DAY',-18,CURRENT_TIMESTAMP),DATEADD('DAY',-18,CURRENT_TIMESTAMP),'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM purchase_orders WHERE po_number='PO-2025-003');

INSERT INTO purchase_orders (po_number, vendor_id, requisition_id, status, delivery_date, notes, total_amount, created_at, submitted_at, order_type)
SELECT 'PO-2025-004',
       (SELECT id FROM vendors WHERE name='Hospitality Linen Co.'),
       (SELECT id FROM requisitions WHERE req_number='REQ-2025-004'),
       'DRAFT', DATEADD('DAY',14,CURRENT_DATE),
       'Pending final approval from housekeeping manager.',45600.00,
       DATEADD('DAY',-2,CURRENT_TIMESTAMP),NULL,'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM purchase_orders WHERE po_number='PO-2025-004');

INSERT INTO purchase_orders (po_number, vendor_id, requisition_id, status, delivery_date, notes, total_amount, created_at, submitted_at, order_type)
SELECT 'PO-2025-005',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),
       (SELECT id FROM requisitions WHERE req_number='REQ-2025-005'),
       'PARTIALLY_RECEIVED', DATEADD('DAY',-3,CURRENT_DATE),
       'LED bulbs received. HVAC filters back-ordered, ETA 1 week.',10500.00,
       DATEADD('DAY',-6,CURRENT_TIMESTAMP),DATEADD('DAY',-6,CURRENT_TIMESTAMP),'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM purchase_orders WHERE po_number='PO-2025-005');

INSERT INTO purchase_orders (po_number, vendor_id, requisition_id, status, delivery_date, notes, total_amount, created_at, submitted_at, order_type)
SELECT 'PO-2025-006',
       (SELECT id FROM vendors WHERE name='Fresh Farm Organics'),
       (SELECT id FROM requisitions WHERE req_number='REQ-2025-006'),
       'SUBMITTED', DATEADD('DAY',1,CURRENT_DATE),
       'Recurring weekly fresh produce order.',32800.00,
       DATEADD('DAY',-2,CURRENT_TIMESTAMP),DATEADD('DAY',-2,CURRENT_TIMESTAMP),'STANDARD'
WHERE NOT EXISTS (SELECT 1 FROM purchase_orders WHERE po_number='PO-2025-006');

-- ── Purchase Order Lines ──────────────────────────────────────

-- PO-001 lines (mirrors REQ-001)
INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-001'),
       (SELECT id FROM items WHERE sku='FB-001'),50,1450.00,72500.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-001')
  AND item_id=(SELECT id FROM items WHERE sku='FB-001'));

INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-001'),
       (SELECT id FROM items WHERE sku='FB-002'),8,1800.00,14400.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-001')
  AND item_id=(SELECT id FROM items WHERE sku='FB-002'));

-- PO-002 lines (mirrors REQ-002)
INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-002'),
       (SELECT id FROM items WHERE sku='CL-001'),20,450.00,9000.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-002')
  AND item_id=(SELECT id FROM items WHERE sku='CL-001'));

INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-002'),
       (SELECT id FROM items WHERE sku='CL-002'),48,95.00,4560.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-002')
  AND item_id=(SELECT id FROM items WHERE sku='CL-002'));

INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-002'),
       (SELECT id FROM items WHERE sku='CL-003'),24,180.00,4320.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-002')
  AND item_id=(SELECT id FROM items WHERE sku='CL-003'));

-- PO-003 lines (mirrors REQ-003)
INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-003'),
       (SELECT id FROM items WHERE sku='OS-001'),20,350.00,7000.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-003')
  AND item_id=(SELECT id FROM items WHERE sku='OS-001'));

INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-003'),
       (SELECT id FROM items WHERE sku='OS-002'),10,250.00,2500.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-003')
  AND item_id=(SELECT id FROM items WHERE sku='OS-002'));

INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-003'),
       (SELECT id FROM items WHERE sku='OS-003'),5,850.00,4250.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-003')
  AND item_id=(SELECT id FROM items WHERE sku='OS-003'));

-- PO-004 lines (mirrors REQ-004)
INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-004'),
       (SELECT id FROM items WHERE sku='LL-001'),24,1200.00,28800.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-004')
  AND item_id=(SELECT id FROM items WHERE sku='LL-001'));

INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-004'),
       (SELECT id FROM items WHERE sku='LL-002'),48,350.00,16800.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-004')
  AND item_id=(SELECT id FROM items WHERE sku='LL-002'));

-- PO-005 lines (mirrors REQ-005)
INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-005'),
       (SELECT id FROM items WHERE sku='ME-001'),50,120.00,6000.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-005')
  AND item_id=(SELECT id FROM items WHERE sku='ME-001'));

INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-005'),
       (SELECT id FROM items WHERE sku='ME-002'),10,450.00,4500.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-005')
  AND item_id=(SELECT id FROM items WHERE sku='ME-002'));

-- PO-006 lines (mirrors REQ-006)
INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-006'),
       (SELECT id FROM items WHERE sku='FB-005'),100,280.00,28000.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-006')
  AND item_id=(SELECT id FROM items WHERE sku='FB-005'));

INSERT INTO purchase_order_lines (purchase_order_id, item_id, quantity, unit_price, line_total)
SELECT (SELECT id FROM purchase_orders WHERE po_number='PO-2025-006'),
       (SELECT id FROM items WHERE sku='FB-006'),10,480.00,4800.00
WHERE NOT EXISTS (SELECT 1 FROM purchase_order_lines
  WHERE purchase_order_id=(SELECT id FROM purchase_orders WHERE po_number='PO-2025-006')
  AND item_id=(SELECT id FROM items WHERE sku='FB-006'));

-- ── Customers (5 new demo tenants, total 6 with DEFAULT) ──────

INSERT INTO customers (customer_code, customer_name, status)
SELECT 'GRAND-HOTELS','Grand Hotels Group','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code='GRAND-HOTELS');

INSERT INTO customers (customer_code, customer_name, status)
SELECT 'SPICE-KITCHEN','Spice Kitchen Restaurants','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code='SPICE-KITCHEN');

INSERT INTO customers (customer_code, customer_name, status)
SELECT 'AZURE-RESORTS','Azure Beach Resorts','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code='AZURE-RESORTS');

INSERT INTO customers (customer_code, customer_name, status)
SELECT 'METRO-HEALTH','Metro Healthcare Group','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code='METRO-HEALTH');

INSERT INTO customers (customer_code, customer_name, status)
SELECT 'CITY-SUITES','City Business Suites','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code='CITY-SUITES');

-- ── Companies (1 per new customer, total 6 with DEFAULT) ──────

INSERT INTO companies (company_code, company_name, customer_id, legal_entity, country, currency, address, status)
SELECT 'GRAND-MUM','Grand Hotel Mumbai',
       (SELECT customer_id FROM customers WHERE customer_code='GRAND-HOTELS'),
       'Grand Hotels Mumbai Pvt Ltd','India','INR','Nariman Point, Mumbai 400021','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE company_code='GRAND-MUM'
  AND customer_id=(SELECT customer_id FROM customers WHERE customer_code='GRAND-HOTELS'));

INSERT INTO companies (company_code, company_name, customer_id, legal_entity, country, currency, address, status)
SELECT 'SPICE-PUNE','Spice Kitchen Pune',
       (SELECT customer_id FROM customers WHERE customer_code='SPICE-KITCHEN'),
       'Spice Kitchen Pune Pvt Ltd','India','INR','Koregaon Park, Pune 411001','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE company_code='SPICE-PUNE'
  AND customer_id=(SELECT customer_id FROM customers WHERE customer_code='SPICE-KITCHEN'));

INSERT INTO companies (company_code, company_name, customer_id, legal_entity, country, currency, address, status)
SELECT 'AZURE-GOA','Azure Beach Resort Goa',
       (SELECT customer_id FROM customers WHERE customer_code='AZURE-RESORTS'),
       'Azure Resorts Goa Pvt Ltd','India','INR','Candolim Beach Road, Goa 403515','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE company_code='AZURE-GOA'
  AND customer_id=(SELECT customer_id FROM customers WHERE customer_code='AZURE-RESORTS'));

INSERT INTO companies (company_code, company_name, customer_id, legal_entity, country, currency, address, status)
SELECT 'METRO-DEL','Metro Hospital Delhi',
       (SELECT customer_id FROM customers WHERE customer_code='METRO-HEALTH'),
       'Metro Healthcare Delhi Pvt Ltd','India','INR','Dwarka Sector 12, New Delhi 110075','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE company_code='METRO-DEL'
  AND customer_id=(SELECT customer_id FROM customers WHERE customer_code='METRO-HEALTH'));

INSERT INTO companies (company_code, company_name, customer_id, legal_entity, country, currency, address, status)
SELECT 'CITY-BAN','City Business Suites Bangalore',
       (SELECT customer_id FROM customers WHERE customer_code='CITY-SUITES'),
       'City Suites Bangalore Pvt Ltd','India','INR','MG Road, Bangalore 560001','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE company_code='CITY-BAN'
  AND customer_id=(SELECT customer_id FROM customers WHERE customer_code='CITY-SUITES'));

-- ── Positions (4 new under DEFAULT company, total 6) ─────────

INSERT INTO positions (position_code, position_name, company_id, description, is_system_role, access_matrix, status)
SELECT 'PROCUREMENT_MGR','Procurement Manager',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'Manages purchasing, vendor relations, and approves all procurement activities.',
       FALSE,
       '{"dashboard":{"view":true},"vendors":{"view":true,"create":true,"edit":true,"delete":false},"catalog":{"view":true,"create":true,"edit":true,"delete":false,"import":true},"orderGuides":{"view":true,"create":true,"edit":true,"delete":true},"requisitions":{"view":true,"create":true,"edit":true,"delete":false,"approve":true},"purchaseOrders":{"view":true,"create":true,"edit":true,"delete":false,"approve":true},"inventory":{"view":true,"adjust":true},"integration":{"view":true,"manage":false},"logs":{"view":true},"settings":{"view":true,"edit":false},"orgStructure":{"view":true,"edit":false,"delete":false},"orgDocuments":{"view":true,"upload":true,"approve":false,"delete":false},"orgAnalytics":{"view":true},"persons":{"view":true,"create":false,"edit":false,"delete":false},"positions":{"view":true,"create":false,"edit":false,"delete":false}}',
       'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE position_code='PROCUREMENT_MGR'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO positions (position_code, position_name, company_id, description, is_system_role, access_matrix, status)
SELECT 'STORE_MANAGER','Store Manager',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'Manages inventory, storerooms, and raises requisitions for replenishment.',
       FALSE,
       '{"dashboard":{"view":true},"vendors":{"view":true,"create":false,"edit":false,"delete":false},"catalog":{"view":true,"create":false,"edit":false,"delete":false,"import":false},"orderGuides":{"view":true,"create":true,"edit":true,"delete":false},"requisitions":{"view":true,"create":true,"edit":true,"delete":false,"approve":false},"purchaseOrders":{"view":true,"create":false,"edit":false,"delete":false,"approve":false},"inventory":{"view":true,"adjust":true},"integration":{"view":false,"manage":false},"logs":{"view":false},"settings":{"view":false,"edit":false},"orgStructure":{"view":true,"edit":false,"delete":false},"orgDocuments":{"view":true,"upload":false,"approve":false,"delete":false},"orgAnalytics":{"view":false},"persons":{"view":false,"create":false,"edit":false,"delete":false},"positions":{"view":false,"create":false,"edit":false,"delete":false}}',
       'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE position_code='STORE_MANAGER'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO positions (position_code, position_name, company_id, description, is_system_role, access_matrix, status)
SELECT 'FINANCE_APPROVER','Finance Approver',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'Reviews and approves requisitions and purchase orders on financial grounds.',
       FALSE,
       '{"dashboard":{"view":true},"vendors":{"view":true,"create":false,"edit":false,"delete":false},"catalog":{"view":true,"create":false,"edit":false,"delete":false,"import":false},"orderGuides":{"view":false,"create":false,"edit":false,"delete":false},"requisitions":{"view":true,"create":false,"edit":false,"delete":false,"approve":true},"purchaseOrders":{"view":true,"create":false,"edit":false,"delete":false,"approve":true},"inventory":{"view":true,"adjust":false},"integration":{"view":false,"manage":false},"logs":{"view":true},"settings":{"view":false,"edit":false},"orgStructure":{"view":true,"edit":false,"delete":false},"orgDocuments":{"view":true,"upload":false,"approve":true,"delete":false},"orgAnalytics":{"view":true},"persons":{"view":false,"create":false,"edit":false,"delete":false},"positions":{"view":false,"create":false,"edit":false,"delete":false}}',
       'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE position_code='FINANCE_APPROVER'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO positions (position_code, position_name, company_id, description, is_system_role, access_matrix, status)
SELECT 'DEPT_HEAD','Department Head',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'Oversees a department and raises and tracks requisitions for departmental needs.',
       FALSE,
       '{"dashboard":{"view":true},"vendors":{"view":true,"create":false,"edit":false,"delete":false},"catalog":{"view":true,"create":false,"edit":false,"delete":false,"import":false},"orderGuides":{"view":true,"create":true,"edit":true,"delete":false},"requisitions":{"view":true,"create":true,"edit":true,"delete":false,"approve":false},"purchaseOrders":{"view":true,"create":false,"edit":false,"delete":false,"approve":false},"inventory":{"view":true,"adjust":false},"integration":{"view":false,"manage":false},"logs":{"view":false},"settings":{"view":false,"edit":false},"orgStructure":{"view":true,"edit":false,"delete":false},"orgDocuments":{"view":true,"upload":true,"approve":false,"delete":false},"orgAnalytics":{"view":false},"persons":{"view":true,"create":false,"edit":false,"delete":false},"positions":{"view":false,"create":false,"edit":false,"delete":false}}',
       'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE position_code='DEPT_HEAD'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

-- ── Org Units (6 under DEFAULT company) ──────────────────────

INSERT INTO org_units (unit_code, unit_name, unit_type, company_id, cost_center, description, sort_order, status)
SELECT 'KITCHEN','Kitchen & Food Production','DEPARTMENT',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'CC-101','All food production, kitchen operations and F&B preparation.',1,'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM org_units WHERE unit_code='KITCHEN'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO org_units (unit_code, unit_name, unit_type, company_id, cost_center, description, sort_order, status)
SELECT 'HOUSEKEEPING','Housekeeping & Laundry','DEPARTMENT',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'CC-102','Room cleaning, laundry operations and linen management.',2,'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM org_units WHERE unit_code='HOUSEKEEPING'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO org_units (unit_code, unit_name, unit_type, company_id, cost_center, description, sort_order, status)
SELECT 'FRONT-OFFICE','Front Office & Guest Services','DEPARTMENT',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'CC-103','Reception, concierge and guest experience management.',3,'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM org_units WHERE unit_code='FRONT-OFFICE'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO org_units (unit_code, unit_name, unit_type, company_id, cost_center, description, sort_order, status)
SELECT 'FNB-OPS','Food & Beverage Operations','DEPARTMENT',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'CC-104','Restaurant, bar, banquet and room service operations.',4,'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM org_units WHERE unit_code='FNB-OPS'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO org_units (unit_code, unit_name, unit_type, company_id, cost_center, description, sort_order, status)
SELECT 'ENGINEERING','Engineering & Maintenance','DEPARTMENT',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'CC-105','Facilities management, HVAC, electrical and plumbing maintenance.',5,'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM org_units WHERE unit_code='ENGINEERING'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO org_units (unit_code, unit_name, unit_type, company_id, cost_center, description, sort_order, status)
SELECT 'FINANCE','Finance & Procurement','DEPARTMENT',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       'CC-106','Financial management, accounts payable and procurement oversight.',6,'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM org_units WHERE unit_code='FINANCE'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

-- ── Persons (6 under DEFAULT company) ────────────────────────

INSERT INTO persons (employee_code, first_name, last_name, email, phone, company_id, position_id, org_unit_id, hire_date, status)
SELECT 'EMP-001','Arjun','Mehta','arjun.mehta@demo.procure','+91-98200-10001',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       (SELECT position_id FROM positions WHERE position_code='PROCUREMENT_MGR'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       (SELECT org_unit_id FROM org_units WHERE unit_code='FINANCE'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       DATE '2020-06-15','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM persons WHERE email='arjun.mehta@demo.procure'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO persons (employee_code, first_name, last_name, email, phone, company_id, position_id, org_unit_id, hire_date, status)
SELECT 'EMP-002','Sunita','Rao','sunita.rao@demo.procure','+91-98200-10002',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       (SELECT position_id FROM positions WHERE position_code='STORE_MANAGER'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       (SELECT org_unit_id FROM org_units WHERE unit_code='ENGINEERING'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       DATE '2019-03-01','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM persons WHERE email='sunita.rao@demo.procure'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO persons (employee_code, first_name, last_name, email, phone, company_id, position_id, org_unit_id, hire_date, status)
SELECT 'EMP-003','Kavita','Desai','kavita.desai@demo.procure','+91-98200-10003',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       (SELECT position_id FROM positions WHERE position_code='FINANCE_APPROVER'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       (SELECT org_unit_id FROM org_units WHERE unit_code='FINANCE'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       DATE '2018-11-20','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM persons WHERE email='kavita.desai@demo.procure'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO persons (employee_code, first_name, last_name, email, phone, company_id, position_id, org_unit_id, hire_date, status)
SELECT 'EMP-004','Ravi','Krishnan','ravi.krishnan@demo.procure','+91-98200-10004',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       (SELECT position_id FROM positions WHERE position_code='DEPT_HEAD'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       (SELECT org_unit_id FROM org_units WHERE unit_code='KITCHEN'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       DATE '2021-02-10','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM persons WHERE email='ravi.krishnan@demo.procure'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO persons (employee_code, first_name, last_name, email, phone, company_id, position_id, org_unit_id, hire_date, status)
SELECT 'EMP-005','Pooja','Iyer','pooja.iyer@demo.procure','+91-98200-10005',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       (SELECT position_id FROM positions WHERE position_code='BUYER'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       (SELECT org_unit_id FROM org_units WHERE unit_code='FINANCE'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       DATE '2022-07-05','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM persons WHERE email='pooja.iyer@demo.procure'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));

INSERT INTO persons (employee_code, first_name, last_name, email, phone, company_id, position_id, org_unit_id, hire_date, status)
SELECT 'EMP-006','Deepak','Sharma','deepak.sharma@demo.procure','+91-98200-10006',
       (SELECT company_id FROM companies WHERE company_code='DEFAULT'),
       (SELECT position_id FROM positions WHERE position_code='DEPT_HEAD'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       (SELECT org_unit_id FROM org_units WHERE unit_code='HOUSEKEEPING'
          AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT')),
       DATE '2017-09-12','ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM persons WHERE email='deepak.sharma@demo.procure'
  AND company_id=(SELECT company_id FROM companies WHERE company_code='DEFAULT'));
