-- ============================================================
-- V7: Demo users for buyer (internal) and supplier roles
--
-- Password for ALL demo users: Demo@1234
-- BCrypt hash ($2a$12$, equivalent to htpasswd $2y$12$):
--   $2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve
-- ============================================================

-- ── Buyer / Internal Procurement Users ───────────────────────
-- Linked to DEFAULT company; each has a different position so
-- they get a different access matrix when they log in.

-- 1. Procurement Manager — full procurement + approval rights
INSERT INTO users (username, email, password_hash, role, active,
                   customer_id, company_id, position_id, created_at, updated_at)
SELECT 'buyer.arjun', 'arjun.mehta@demo.procure',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'SYSTEM_ADMIN', TRUE,
       (SELECT customer_id FROM customers WHERE customer_code = 'DEFAULT'),
       (SELECT company_id  FROM companies  WHERE company_code  = 'DEFAULT'),
       (SELECT position_id FROM positions  WHERE position_code = 'PROCUREMENT_MGR'
          AND company_id = (SELECT company_id FROM companies WHERE company_code = 'DEFAULT')),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'buyer.arjun');

-- 2. Buyer — raise and track requisitions and POs
INSERT INTO users (username, email, password_hash, role, active,
                   customer_id, company_id, position_id, created_at, updated_at)
SELECT 'buyer.pooja', 'pooja.iyer@demo.procure',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'SYSTEM_ADMIN', TRUE,
       (SELECT customer_id FROM customers WHERE customer_code = 'DEFAULT'),
       (SELECT company_id  FROM companies  WHERE company_code  = 'DEFAULT'),
       (SELECT position_id FROM positions  WHERE position_code = 'BUYER'
          AND company_id = (SELECT company_id FROM companies WHERE company_code = 'DEFAULT')),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'buyer.pooja');

-- 3. Finance Approver — approve requisitions and POs, view analytics
INSERT INTO users (username, email, password_hash, role, active,
                   customer_id, company_id, position_id, created_at, updated_at)
SELECT 'finance.kavita', 'kavita.desai@demo.procure',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'SYSTEM_ADMIN', TRUE,
       (SELECT customer_id FROM customers WHERE customer_code = 'DEFAULT'),
       (SELECT company_id  FROM companies  WHERE company_code  = 'DEFAULT'),
       (SELECT position_id FROM positions  WHERE position_code = 'FINANCE_APPROVER'
          AND company_id = (SELECT company_id FROM companies WHERE company_code = 'DEFAULT')),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'finance.kavita');

-- 4. Store Manager — manage inventory, raise requisitions
INSERT INTO users (username, email, password_hash, role, active,
                   customer_id, company_id, position_id, created_at, updated_at)
SELECT 'store.sunita', 'sunita.rao@demo.procure',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'SYSTEM_ADMIN', TRUE,
       (SELECT customer_id FROM customers WHERE customer_code = 'DEFAULT'),
       (SELECT company_id  FROM companies  WHERE company_code  = 'DEFAULT'),
       (SELECT position_id FROM positions  WHERE position_code = 'STORE_MANAGER'
          AND company_id = (SELECT company_id FROM companies WHERE company_code = 'DEFAULT')),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'store.sunita');

-- 5. Department Head (Kitchen) — raise and track departmental requisitions
INSERT INTO users (username, email, password_hash, role, active,
                   customer_id, company_id, position_id, created_at, updated_at)
SELECT 'dept.ravi', 'ravi.krishnan@demo.procure',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'SYSTEM_ADMIN', TRUE,
       (SELECT customer_id FROM customers WHERE customer_code = 'DEFAULT'),
       (SELECT company_id  FROM companies  WHERE company_code  = 'DEFAULT'),
       (SELECT position_id FROM positions  WHERE position_code = 'DEPT_HEAD'
          AND company_id = (SELECT company_id FROM companies WHERE company_code = 'DEFAULT')),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'dept.ravi');

-- 6. Department Head (Housekeeping) — same position, different person
INSERT INTO users (username, email, password_hash, role, active,
                   customer_id, company_id, position_id, created_at, updated_at)
SELECT 'dept.deepak', 'deepak.sharma@demo.procure',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'SYSTEM_ADMIN', TRUE,
       (SELECT customer_id FROM customers WHERE customer_code = 'DEFAULT'),
       (SELECT company_id  FROM companies  WHERE company_code  = 'DEFAULT'),
       (SELECT position_id FROM positions  WHERE position_code = 'DEPT_HEAD'
          AND company_id = (SELECT company_id FROM companies WHERE company_code = 'DEFAULT')),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'dept.deepak');

-- ── Vendor / Supplier Users ───────────────────────────────────
-- VENDOR_ADMIN = full control over their own catalog and orders
-- VENDOR_USER  = read-only / limited access for their company

-- 7. Metro Food Distributors — admin (primary contact, manages catalog)
INSERT INTO users (username, email, password_hash, role, active, vendor_id, created_at, updated_at)
SELECT 'vendor.metro', 'raj@metrofood.com',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'VENDOR_ADMIN', TRUE,
       (SELECT id FROM vendors WHERE name = 'Metro Food Distributors'),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'vendor.metro');

-- 8. CleanPro Supplies Ltd — standard user (sales rep)
INSERT INTO users (username, email, password_hash, role, active, vendor_id, created_at, updated_at)
SELECT 'vendor.cleanpro', 'anita@cleanpro.in',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'VENDOR_USER', TRUE,
       (SELECT id FROM vendors WHERE name = 'CleanPro Supplies Ltd'),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'vendor.cleanpro');

-- 9. OfficeZone India — admin (manages catalog and order acknowledgements)
INSERT INTO users (username, email, password_hash, role, active, vendor_id, created_at, updated_at)
SELECT 'vendor.officezone', 'vikram@officezone.in',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'VENDOR_ADMIN', TRUE,
       (SELECT id FROM vendors WHERE name = 'OfficeZone India'),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'vendor.officezone');

-- 10. Hospitality Linen Co. — standard user (order tracking)
INSERT INTO users (username, email, password_hash, role, active, vendor_id, created_at, updated_at)
SELECT 'vendor.linen', 'priya@hospitlinen.com',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'VENDOR_USER', TRUE,
       (SELECT id FROM vendors WHERE name = 'Hospitality Linen Co.'),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'vendor.linen');

-- 11. TechFix Equipment — admin (manages catalog)
INSERT INTO users (username, email, password_hash, role, active, vendor_id, created_at, updated_at)
SELECT 'vendor.techfix', 'sanjay@techfix.in',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'VENDOR_ADMIN', TRUE,
       (SELECT id FROM vendors WHERE name = 'TechFix Equipment'),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'vendor.techfix');

-- 12. Fresh Farm Organics — standard user (delivery confirmations)
INSERT INTO users (username, email, password_hash, role, active, vendor_id, created_at, updated_at)
SELECT 'vendor.freshfarm', 'meera@freshfarm.in',
       '$2a$12$7alXV.VAa9yaJDeCpyXiQeZmRUhVqUjGykULiDvFl5oQLcS6Li4ve',
       'VENDOR_USER', TRUE,
       (SELECT id FROM vendors WHERE name = 'Fresh Farm Organics'),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'vendor.freshfarm');
