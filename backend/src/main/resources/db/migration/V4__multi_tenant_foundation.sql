-- ============================================================
-- V4 – Multi-Tenant Foundation
-- Hierarchy: Customer → Company → Person → Position (access matrix)
-- ============================================================

-- ── Customers (top-level tenants) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    customer_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(50)  NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Companies (child of Customer) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    company_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_code  VARCHAR(50)  NOT NULL,
    company_name  VARCHAR(255) NOT NULL,
    customer_id   BIGINT       NOT NULL,
    legal_entity  VARCHAR(255),
    country       VARCHAR(100),
    currency      VARCHAR(10),
    address       VARCHAR(500),
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    CONSTRAINT uq_company_code_per_customer UNIQUE (customer_id, company_code)
);

-- ── Positions (define role + access matrix per company) ──────────────────────
-- access_matrix is stored as a JSON string:
-- {
--   "dashboard":      {"view":true},
--   "vendors":        {"view":true,"create":true,"edit":true,"delete":false},
--   "catalog":        {"view":true,"create":false,"import":false},
--   "orderGuides":    {"view":true,"create":true,"edit":true},
--   "requisitions":   {"view":true,"create":true,"edit":true,"approve":false},
--   "purchaseOrders": {"view":true,"create":false,"approve":false},
--   "inventory":      {"view":true,"adjust":false},
--   "integration":    {"view":false,"manage":false},
--   "logs":           {"view":false},
--   "settings":       {"view":false},
--   "orgStructure":   {"view":false,"edit":false},
--   "orgDocuments":   {"view":false,"upload":false,"approve":false},
--   "orgAnalytics":   {"view":false},
--   "persons":        {"view":false,"create":false,"edit":false},
--   "positions":      {"view":false,"create":false,"edit":false}
-- }
CREATE TABLE IF NOT EXISTS positions (
    position_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    position_code  VARCHAR(50)  NOT NULL,
    position_name  VARCHAR(255) NOT NULL,
    company_id     BIGINT       NOT NULL,
    description    VARCHAR(500),
    access_matrix  CLOB         NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN      NOT NULL DEFAULT FALSE,
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_position_company FOREIGN KEY (company_id) REFERENCES companies(company_id),
    CONSTRAINT uq_position_code_per_company UNIQUE (company_id, position_code)
);

-- ── Org Units (for org structure hierarchy) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS org_units (
    org_unit_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    unit_code     VARCHAR(50)  NOT NULL,
    unit_name     VARCHAR(255) NOT NULL,
    unit_type     VARCHAR(50)  NOT NULL, -- DIVISION, LEGAL_ENTITY, BU, OU, DEPARTMENT, SUB_DEPARTMENT
    company_id    BIGINT       NOT NULL,
    parent_id     BIGINT,                -- self-referencing for hierarchy
    manager_id    BIGINT,                -- FK to persons (set after persons table created)
    cost_center   VARCHAR(50),
    description   VARCHAR(500),
    sort_order    INT          NOT NULL DEFAULT 0,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_org_unit_company FOREIGN KEY (company_id) REFERENCES companies(company_id),
    CONSTRAINT fk_org_unit_parent  FOREIGN KEY (parent_id)  REFERENCES org_units(org_unit_id)
);

-- ── Persons ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS persons (
    person_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(50)  NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    company_id    BIGINT       NOT NULL,
    position_id   BIGINT,
    org_unit_id   BIGINT,
    manager_id    BIGINT,                -- self-referencing
    hire_date     DATE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_person_company  FOREIGN KEY (company_id)  REFERENCES companies(company_id),
    CONSTRAINT fk_person_position FOREIGN KEY (position_id) REFERENCES positions(position_id),
    CONSTRAINT fk_person_org_unit FOREIGN KEY (org_unit_id) REFERENCES org_units(org_unit_id),
    CONSTRAINT fk_person_manager  FOREIGN KEY (manager_id)  REFERENCES persons(person_id),
    CONSTRAINT uq_person_email_per_company UNIQUE (company_id, email)
);

-- Now wire org_unit manager FK (created after persons)
ALTER TABLE org_units ADD CONSTRAINT fk_org_unit_manager
    FOREIGN KEY (manager_id) REFERENCES persons(person_id);

-- ── Extend users table with tenant context ────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id  BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id   BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position_id  BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS person_id    BIGINT;

-- ── Seed: default customer + company so existing users/data aren't orphaned ───
INSERT INTO customers (customer_code, customer_name, status)
    VALUES ('DEFAULT', 'Default Customer', 'ACTIVE');

INSERT INTO companies (company_code, company_name, customer_id, status)
    SELECT 'DEFAULT', 'Default Company', customer_id, 'ACTIVE'
    FROM customers WHERE customer_code = 'DEFAULT';

-- System positions per default company
INSERT INTO positions (position_code, position_name, company_id, is_system_role, access_matrix)
    SELECT 'SYS_ADMIN', 'System Administrator', company_id, TRUE,
    '{"dashboard":{"view":true},"vendors":{"view":true,"create":true,"edit":true,"delete":true},"catalog":{"view":true,"create":true,"edit":true,"delete":true,"import":true},"orderGuides":{"view":true,"create":true,"edit":true,"delete":true},"requisitions":{"view":true,"create":true,"edit":true,"delete":true,"approve":true},"purchaseOrders":{"view":true,"create":true,"edit":true,"delete":true,"approve":true},"inventory":{"view":true,"adjust":true},"integration":{"view":true,"manage":true},"logs":{"view":true},"settings":{"view":true,"edit":true},"orgStructure":{"view":true,"edit":true,"delete":true},"orgDocuments":{"view":true,"upload":true,"approve":true,"delete":true},"orgAnalytics":{"view":true},"persons":{"view":true,"create":true,"edit":true,"delete":true},"positions":{"view":true,"create":true,"edit":true,"delete":true}}'
    FROM companies WHERE company_code = 'DEFAULT';

INSERT INTO positions (position_code, position_name, company_id, is_system_role, access_matrix)
    SELECT 'BUYER', 'Buyer', company_id, TRUE,
    '{"dashboard":{"view":true},"vendors":{"view":true,"create":false,"edit":false,"delete":false},"catalog":{"view":true,"create":false,"edit":false,"delete":false,"import":false},"orderGuides":{"view":true,"create":true,"edit":true,"delete":false},"requisitions":{"view":true,"create":true,"edit":true,"delete":false,"approve":false},"purchaseOrders":{"view":true,"create":true,"edit":false,"delete":false,"approve":false},"inventory":{"view":true,"adjust":false},"integration":{"view":false,"manage":false},"logs":{"view":true},"settings":{"view":false,"edit":false},"orgStructure":{"view":true,"edit":false,"delete":false},"orgDocuments":{"view":true,"upload":false,"approve":false,"delete":false},"orgAnalytics":{"view":false},"persons":{"view":false,"create":false,"edit":false,"delete":false},"positions":{"view":false,"create":false,"edit":false,"delete":false}}'
    FROM companies WHERE company_code = 'DEFAULT';

-- Assign existing admin user to default company + SYS_ADMIN position
UPDATE users
SET company_id  = (SELECT company_id  FROM companies  WHERE company_code = 'DEFAULT'),
    customer_id = (SELECT customer_id FROM customers  WHERE customer_code = 'DEFAULT'),
    position_id = (SELECT position_id FROM positions  WHERE position_code = 'SYS_ADMIN'
                   AND company_id = (SELECT company_id FROM companies WHERE company_code = 'DEFAULT'))
WHERE username = 'admin';
