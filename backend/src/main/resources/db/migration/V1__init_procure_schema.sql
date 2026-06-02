-- ============================================================
-- V1: P2P Procurement — initial schema (H2 + PostgreSQL compat)
-- ============================================================

CREATE TABLE IF NOT EXISTS vendors (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50),
    name            VARCHAR(255) NOT NULL,
    contact_name    VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    address         VARCHAR(500),
    payment_terms   VARCHAR(50),
    category        VARCHAR(255),
    status          VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS uom_master (
    id                       BIGINT AUTO_INCREMENT PRIMARY KEY,
    code                     VARCHAR(50)  NOT NULL UNIQUE,
    description              VARCHAR(255) NOT NULL,
    uom_type                 VARCHAR(50)  NOT NULL,
    is_catch_weight_eligible BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currency_master (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(10)  NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    symbol          VARCHAR(10),
    decimal_places  INT          NOT NULL DEFAULT 2,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id       BIGINT       REFERENCES vendors(id) ON DELETE SET NULL,
    username        VARCHAR(100) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'VENDOR_USER',
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login      TIMESTAMP,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id                   BIGINT       REFERENCES vendors(id),
    sku                         VARCHAR(100) NOT NULL UNIQUE,
    vendor_sku                  VARCHAR(100),
    name                        VARCHAR(500) NOT NULL,
    description                 CLOB,
    category                    VARCHAR(255),
    sub_category                VARCHAR(255),
    brand                       VARCHAR(255),
    manufacturer                VARCHAR(255),
    country_of_origin           VARCHAR(3),
    -- Barcodes
    gtin                        VARCHAR(20),
    upc                         VARCHAR(15),
    ean                         VARCHAR(15),
    -- UOM & Pricing
    uom                         VARCHAR(50)  DEFAULT 'EA',
    uom_id                      BIGINT       REFERENCES uom_master(id),
    unit_price                  NUMERIC(18,4),
    cost_price                  NUMERIC(18,4),
    rrp                         NUMERIC(18,4),
    currency_id                 BIGINT       REFERENCES currency_master(id),
    currency_code               VARCHAR(10)  DEFAULT 'INR',
    tax_code                    VARCHAR(50),
    tax_rate_pct                NUMERIC(6,4),
    price_uom_id                BIGINT       REFERENCES uom_master(id),
    -- Catch Weight
    is_catch_weight             BOOLEAN      NOT NULL DEFAULT FALSE,
    catch_weight_min            NUMERIC(10,4),
    catch_weight_max            NUMERIC(10,4),
    catch_weight_avg            NUMERIC(10,4),
    catch_weight_nominal        NUMERIC(10,4),
    catch_weight_tolerance_pct  NUMERIC(5,2) DEFAULT 5.00,
    catch_weight_price_method   VARCHAR(20)  DEFAULT 'PER_WEIGHT_UNIT',
    catch_weight_uom_id         BIGINT       REFERENCES uom_master(id),
    -- Pack / Case
    case_qty                    INT,
    inner_pack_qty              INT,
    pack_size_description       VARCHAR(100),
    -- Portion
    portion_size                NUMERIC(10,4),
    portion_size_uom_id         BIGINT       REFERENCES uom_master(id),
    portions_per_pack           NUMERIC(10,4),
    serving_suggestion          VARCHAR(500),
    -- Ordering Rules
    min_order_qty               NUMERIC(10,4) DEFAULT 1,
    max_order_qty               NUMERIC(10,4),
    order_increment             NUMERIC(10,4) DEFAULT 1,
    lead_time_days              INT,
    -- Date Lifecycle
    effective_date              DATE,
    expire_date                 DATE,
    discontinue_date            DATE,
    new_product_until           DATE,
    -- Status
    product_status              VARCHAR(30)  DEFAULT 'ACTIVE',
    is_active                   BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Storage & Handling
    storage_temp                VARCHAR(20),
    storage_temp_min_c          NUMERIC(5,2),
    storage_temp_max_c          NUMERIC(5,2),
    shelf_life_days             INT,
    hazmat                      BOOLEAN      DEFAULT FALSE,
    hazmat_class                VARCHAR(50),
    -- Dietary / Allergens (CLOB for H2 compat; JSONB in PostgreSQL)
    allergens                   CLOB,
    dietary_flags               CLOB,
    -- Dimensions
    gross_weight                NUMERIC(10,4),
    net_weight                  NUMERIC(10,4),
    weight_uom_id               BIGINT       REFERENCES uom_master(id),
    length_mm                   NUMERIC(10,2),
    width_mm                    NUMERIC(10,2),
    height_mm                   NUMERIC(10,2),
    -- Substitution
    substitute_sku              VARCHAR(100),
    is_substitute_allowed       BOOLEAN      DEFAULT FALSE,
    -- Audit
    last_imported_at            TIMESTAMP,
    created_at                  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_guides (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    is_shared   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_by  VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_guide_items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_guide_id  BIGINT         NOT NULL REFERENCES order_guides(id) ON DELETE CASCADE,
    item_id         BIGINT         NOT NULL REFERENCES items(id),
    default_qty     INT            NOT NULL DEFAULT 1,
    target_price    NUMERIC(12,2),
    UNIQUE(order_guide_id, item_id)
);

CREATE TABLE IF NOT EXISTS requisitions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    req_number      VARCHAR(100) NOT NULL UNIQUE,
    title           VARCHAR(255) NOT NULL,
    requested_by    VARCHAR(100),
    department      VARCHAR(100),
    status          VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    notes           CLOB,
    total_amount    NUMERIC(14,2) DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at    TIMESTAMP,
    approved_at     TIMESTAMP,
    approved_by     VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS requisition_lines (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    requisition_id  BIGINT         NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    item_id         BIGINT         NOT NULL REFERENCES items(id),
    quantity        NUMERIC(12,4)  NOT NULL,
    unit_price      NUMERIC(14,4),
    line_total      NUMERIC(14,2),
    notes           VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    po_number       VARCHAR(100) NOT NULL UNIQUE,
    vendor_id       BIGINT       NOT NULL REFERENCES vendors(id),
    requisition_id  BIGINT       REFERENCES requisitions(id),
    status          VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    delivery_date   DATE,
    notes           CLOB,
    total_amount    NUMERIC(14,2) DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id   BIGINT         NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id             BIGINT         NOT NULL REFERENCES items(id),
    quantity            NUMERIC(12,4)  NOT NULL,
    unit_price          NUMERIC(14,4),
    line_total          NUMERIC(14,2),
    notes               VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS inventory_items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id         BIGINT         NOT NULL UNIQUE REFERENCES items(id),
    on_hand_qty     NUMERIC(12,4)  NOT NULL DEFAULT 0,
    reorder_point   NUMERIC(12,4),
    reorder_qty     NUMERIC(12,4),
    location        VARCHAR(255),
    last_updated    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Catalog-specific tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sftp_integrations (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id           BIGINT       NOT NULL REFERENCES vendors(id) UNIQUE,
    protocol_type       VARCHAR(10)  NOT NULL DEFAULT 'SFTP',
    host                VARCHAR(255) NOT NULL,
    port                INT          NOT NULL DEFAULT 22,
    username            VARCHAR(100) NOT NULL,
    password_encrypted  CLOB,
    private_key_path    CLOB,
    remote_directory    VARCHAR(500) NOT NULL DEFAULT '/',
    archive_directory   VARCHAR(500),
    file_pattern        VARCHAR(255) DEFAULT '*.csv',
    processed_file_suffix VARCHAR(50),
    -- FTP extras
    ftp_mode            VARCHAR(10),
    ftp_use_tls         BOOLEAN      DEFAULT FALSE,
    -- SFTP extras
    private_key_passphrase CLOB,
    strict_host_key_checking BOOLEAN DEFAULT TRUE,
    -- AS2
    as2_from            VARCHAR(255),
    as2_to              VARCHAR(255),
    as2_partner_url     VARCHAR(500),
    as2_certificate     CLOB,
    as2_private_key     CLOB,
    as2_mdn_url         VARCHAR(500),
    as2_subject         VARCHAR(255),
    as2_encryption_alg  VARCHAR(20),
    as2_signing_alg     VARCHAR(20),
    as2_mdn_mode        VARCHAR(10),
    as2_compression_enabled BOOLEAN  DEFAULT FALSE,
    -- AS4
    as4_party_id        VARCHAR(255),
    as4_party_id_type   VARCHAR(255),
    as4_partner_party_id VARCHAR(255),
    as4_endpoint_url    VARCHAR(500),
    as4_certificate     CLOB,
    as4_private_key     CLOB,
    as4_pmode_id        VARCHAR(255),
    as4_service         VARCHAR(255),
    as4_action          VARCHAR(255),
    as4_security_mode   VARCHAR(20),
    --
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    last_polled_at      TIMESTAMP,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS file_format_mappings (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id       BIGINT       NOT NULL REFERENCES vendors(id),
    format_type     VARCHAR(20)  NOT NULL,
    mapping_name    VARCHAR(255) NOT NULL,
    mapping_config  CLOB         NOT NULL,
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, format_type, mapping_name)
);

CREATE TABLE IF NOT EXISTS catalog_import_jobs (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_id           BIGINT       NOT NULL REFERENCES vendors(id),
    uploaded_by_user_id BIGINT       REFERENCES users(id),
    job_ref             VARCHAR(100) NOT NULL UNIQUE,
    source_type         VARCHAR(20)  NOT NULL,
    format_type         VARCHAR(20)  NOT NULL,
    file_name           VARCHAR(500),
    source_url          CLOB,
    mapping_id          BIGINT       REFERENCES file_format_mappings(id),
    status              VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    total_records       INT          DEFAULT 0,
    processed_records   INT          DEFAULT 0,
    failed_records      INT          DEFAULT 0,
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    notification_sent   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_failure_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id          BIGINT       NOT NULL REFERENCES catalog_import_jobs(id) ON DELETE CASCADE,
    row_number      INT,
    sku             VARCHAR(100),
    field_name      VARCHAR(100),
    raw_value       CLOB,
    error_code      VARCHAR(100) NOT NULL,
    error_message   CLOB         NOT NULL,
    severity        VARCHAR(20)  NOT NULL DEFAULT 'ERROR',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_price_breaks (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id      BIGINT       NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    vendor_id       BIGINT       NOT NULL REFERENCES vendors(id),
    break_type      VARCHAR(20)  NOT NULL,
    tier_sequence   INT          NOT NULL,
    min_value       NUMERIC(18,4) NOT NULL,
    max_value       NUMERIC(18,4),
    unit_price      NUMERIC(18,4) NOT NULL,
    discount_pct    NUMERIC(6,4),
    currency_id     BIGINT       REFERENCES currency_master(id),
    effective_date  DATE,
    expire_date     DATE,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, break_type, tier_sequence)
);

CREATE TABLE IF NOT EXISTS product_price_history (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id          BIGINT       NOT NULL REFERENCES items(id),
    import_job_id       BIGINT       REFERENCES catalog_import_jobs(id),
    old_unit_price      NUMERIC(18,4),
    new_unit_price      NUMERIC(18,4),
    old_effective_date  DATE,
    new_effective_date  DATE,
    old_expire_date     DATE,
    new_expire_date     DATE,
    changed_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by          VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_vendor        ON items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_items_sku           ON items(sku);
CREATE INDEX IF NOT EXISTS idx_import_jobs_vendor  ON catalog_import_jobs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status  ON catalog_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_failure_logs_job    ON import_failure_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_price_breaks_item   ON product_price_breaks(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_item  ON product_price_history(product_id);
