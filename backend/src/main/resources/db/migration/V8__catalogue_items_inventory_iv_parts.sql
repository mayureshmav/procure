-- ============================================================
-- V8: Additional catalogue items, expanded inventory locations,
--     and IV (Installation & Venue) parts across existing vendors
-- ============================================================

-- ── Extended catalogue items — Metro Food Distributors ────────

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-007','Wheat Flour 50kg','Premium whole wheat flour for bakery and kitchen','Grains & Flour',1200.00,'BAG',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-007');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-008','Sugar 50kg','Refined white sugar granulated','Dry Goods',1950.00,'BAG',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-008');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-009','Yellow Dal (Toor) 25kg','Split pigeon peas premium grade','Pulses',2100.00,'BAG',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-009');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-010','Mixed Spice Blend 1kg','Chef-grade blend — cumin, coriander, turmeric, chilli','Spices',380.00,'PKT',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),6,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-010');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-011','Salt Table 25kg','Iodised table salt food grade','Condiments',220.00,'BAG',
       (SELECT id FROM vendors WHERE name='Metro Food Distributors'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-011');

-- ── Extended catalogue items — Fresh Farm Organics ────────────

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-012','Fresh Spinach 5kg','Tender baby spinach leaves farm-fresh','Vegetables',220.00,'BAG',
       (SELECT id FROM vendors WHERE name='Fresh Farm Organics'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-012');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-013','Green Bell Peppers 10kg','Fresh green capsicum grade A','Vegetables',650.00,'BAG',
       (SELECT id FROM vendors WHERE name='Fresh Farm Organics'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-013');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-014','Lemons 10kg','Fresh yellow lemons juicy variety','Fruits & Citrus',480.00,'BAG',
       (SELECT id FROM vendors WHERE name='Fresh Farm Organics'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-014');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'FB-015','Ginger 2kg','Fresh root ginger organic','Vegetables',260.00,'BAG',
       (SELECT id FROM vendors WHERE name='Fresh Farm Organics'),3,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='FB-015');

-- ── Extended catalogue items — CleanPro Supplies Ltd ─────────

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'CL-004','Microfibre Mop Head','Washable microfibre flat mop refill 40cm','Cleaning Equipment',280.00,'EA',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),6,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='CL-004');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'CL-005','Heavy Duty Garbage Bags 200L','Black HDPE garbage bags pack of 25','Hygiene',320.00,'PKT',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),4,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='CL-005');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'CL-006','Dishwashing Liquid 5L','Concentrated lemon-scented dish soap','Cleaning',390.00,'CAN',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),4,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='CL-006');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'CL-007','Disposable Gloves Box 100','Nitrile disposable gloves medium box','Hygiene',450.00,'BOX',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),4,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='CL-007');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'CL-008','Glass Cleaner 1L','Streak-free glass and mirror cleaner','Cleaning',130.00,'BTL',
       (SELECT id FROM vendors WHERE name='CleanPro Supplies Ltd'),12,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='CL-008');

-- ── Extended catalogue items — OfficeZone India ───────────────

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'OS-004','File Folders Box of 50','Manilla suspension file folders A4','Stationery',750.00,'BOX',
       (SELECT id FROM vendors WHERE name='OfficeZone India'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='OS-004');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'OS-005','Heavy Duty Stapler','30-sheet capacity desktop stapler','Office Equipment',620.00,'EA',
       (SELECT id FROM vendors WHERE name='OfficeZone India'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='OS-005');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'OS-006','Whiteboard Marker Set 12','Assorted colour dry-erase markers','Stationery',290.00,'SET',
       (SELECT id FROM vendors WHERE name='OfficeZone India'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='OS-006');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'OS-007','Scotch Tape 24mm x 66m','Clear adhesive tape value pack of 12','Stationery',480.00,'BOX',
       (SELECT id FROM vendors WHERE name='OfficeZone India'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='OS-007');

-- ── Extended catalogue items — Hospitality Linen Co. ─────────

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'LL-003','Pillow Cases White Pair','Pair of white 300TC cotton pillow cases standard','Bed Linen',320.00,'PR',
       (SELECT id FROM vendors WHERE name='Hospitality Linen Co.'),12,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='LL-003');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'LL-004','Table Cloth Banquet 72x108','White polyester banquet table cloth','Table Linen',850.00,'EA',
       (SELECT id FROM vendors WHERE name='Hospitality Linen Co.'),6,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='LL-004');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'LL-005','Hand Towels Spa White','White waffle-weave spa hand towels','Bath Linen',180.00,'EA',
       (SELECT id FROM vendors WHERE name='Hospitality Linen Co.'),24,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='LL-005');

-- ── Extended catalogue items — TechFix Equipment (ME) ────────

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'ME-003','Circuit Breaker 20A','Single pole 20A MCB DIN rail mount','Electrical',380.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),5,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='ME-003');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'ME-004','PVC Conduit Pipe 25mm 3m','Rigid PVC electrical conduit 3m length','Electrical',85.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),10,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='ME-004');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'ME-005','CPVC Pipe 1 inch 3m','CPVC hot-water plumbing pipe 1" 3m','Plumbing',240.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),6,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='ME-005');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'ME-006','Lubricant Spray 500ml','Multi-purpose penetrating lubricant spray can','Maintenance',290.00,'BTL',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),6,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='ME-006');

-- ── IV Parts — Installation & Venue Fittings (TechFix Equipment) ──

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'IV-001','Soap Dispenser Wall Mount 500ml','Stainless-steel wall-mount soap dispenser','Installation & Venue',1850.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='IV-001');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'IV-002','Toilet Paper Holder Stainless','Surface-mount stainless toilet roll holder','Installation & Venue',1200.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='IV-002');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'IV-003','Air Freshener Dispenser Unit','Automatic timed aerosol air freshener unit','Installation & Venue',2400.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='IV-003');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'IV-004','Hand Dryer Electric 1200W','High-speed electric hand dryer for washrooms','Installation & Venue',12500.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='IV-004');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'IV-005','Emergency Exit Sign LED','Illuminated green LED emergency exit sign','Installation & Venue',1650.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='IV-005');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'IV-006','Fire Extinguisher CO2 2kg','Carbon dioxide fire extinguisher 2kg','Installation & Venue',3200.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='IV-006');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'IV-007','CCTV Camera Dome Indoor','Indoor dome IP camera 2MP night vision','Installation & Venue',4800.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),1,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='IV-007');

INSERT INTO items (sku, name, description, category, unit_price, uom, vendor_id, min_order_qty, is_active)
SELECT 'IV-008','Door Closer Hydraulic','Commercial grade overhead hydraulic door closer','Installation & Venue',1450.00,'EA',
       (SELECT id FROM vendors WHERE name='TechFix Equipment'),2,TRUE
WHERE NOT EXISTS (SELECT 1 FROM items WHERE sku='IV-008');

-- ── Inventory Items — new catalogue items with locations ──────

-- Metro Food Distributors — Storeroom A extensions + Storeroom B
INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-007'),4,5,20,'Storeroom A - Shelf 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-007'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-008'),3,5,15,'Storeroom B - Shelf 1',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-008'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-009'),5,4,20,'Storeroom B - Shelf 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-009'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-010'),18,10,40,'Storeroom B - Shelf 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-010'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-011'),6,4,20,'Storeroom B - Shelf 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-011'));

-- Fresh Farm Organics — Cold Room extensions
INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-012'),8,6,20,'Cold Room - Section 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-012'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-013'),5,4,15,'Cold Room - Section 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-013'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-014'),7,5,20,'Cold Room - Section 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-014'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='FB-015'),12,6,30,'Cold Room - Section 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='FB-015'));

-- CleanPro Supplies Ltd — Housekeeping Store extensions
INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='CL-004'),14,8,40,'Housekeeping Store - Row 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='CL-004'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='CL-005'),20,10,60,'Housekeeping Store - Row 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='CL-005'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='CL-006'),10,6,30,'Housekeeping Store - Row 5',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='CL-006'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='CL-007'),8,4,20,'Housekeeping Store - Row 5',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='CL-007'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='CL-008'),30,12,60,'Housekeeping Store - Row 6',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='CL-008'));

-- OfficeZone India — Office Store extensions
INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='OS-004'),5,3,15,'Office Store - Shelf 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='OS-004'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='OS-005'),4,2,10,'Office Store - Shelf 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='OS-005'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='OS-006'),6,3,15,'Office Store - Shelf 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='OS-006'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='OS-007'),10,4,20,'Office Store - Shelf 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='OS-007'));

-- Hospitality Linen Co. — Linen Room extensions
INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='LL-003'),36,24,72,'Linen Room - Section C',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='LL-003'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='LL-004'),12,8,24,'Linen Room - Section C',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='LL-004'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='LL-005'),60,40,120,'Linen Room - Section D',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='LL-005'));

-- TechFix Equipment — Maintenance Store extensions (ME items)
INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='ME-003'),15,10,40,'Maintenance Store - Row 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='ME-003'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='ME-004'),25,15,60,'Maintenance Store - Row 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='ME-004'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='ME-005'),18,10,40,'Maintenance Store - Row 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='ME-005'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='ME-006'),20,8,30,'Maintenance Store - Row 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='ME-006'));

-- TechFix Equipment — Venue Parts Store (IV items)
INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='IV-001'),8,4,20,'Venue Parts Store - Shelf 1',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='IV-001'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='IV-002'),12,6,24,'Venue Parts Store - Shelf 1',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='IV-002'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='IV-003'),6,3,12,'Venue Parts Store - Shelf 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='IV-003'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='IV-004'),3,2,6,'Venue Parts Store - Shelf 2',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='IV-004'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='IV-005'),10,4,20,'Venue Parts Store - Shelf 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='IV-005'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='IV-006'),4,2,8,'Venue Parts Store - Shelf 3',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='IV-006'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='IV-007'),2,1,4,'Venue Parts Store - Shelf 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='IV-007'));

INSERT INTO inventory_items (item_id, on_hand_qty, reorder_point, reorder_qty, location, last_updated)
SELECT (SELECT id FROM items WHERE sku='IV-008'),7,4,16,'Venue Parts Store - Shelf 4',CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM inventory_items WHERE item_id=(SELECT id FROM items WHERE sku='IV-008'));
