-- ============================================================
-- V9: Approval Engine
-- Tables: approval_policies → approval_rules
--               → approval_conditions
--               → approval_steps
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_policies (
    id              VARCHAR(36)  PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     VARCHAR(1000),
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',  -- DRAFT | ACTIVE | ARCHIVED
    effective_date  DATE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_rules (
    id              VARCHAR(36)  PRIMARY KEY,
    policy_id       VARCHAR(36)  NOT NULL REFERENCES approval_policies(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     VARCHAR(1000),
    priority        INT          NOT NULL DEFAULT 1,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    stop_on_match   BOOLEAN      NOT NULL DEFAULT TRUE,
    document_types  VARCHAR(500) NOT NULL DEFAULT '',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- field_name avoids the SQL reserved word FIELD; cond_value avoids reserved word VALUE
CREATE TABLE IF NOT EXISTS approval_conditions (
    id          VARCHAR(36)  PRIMARY KEY,
    rule_id     VARCHAR(36)  NOT NULL REFERENCES approval_rules(id) ON DELETE CASCADE,
    field_name  VARCHAR(50)  NOT NULL,
    operator    VARCHAR(20)  NOT NULL,
    cond_value  VARCHAR(500) NOT NULL DEFAULT '',
    value_to    VARCHAR(500),
    sort_order  INT          NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS approval_steps (
    id                    VARCHAR(36)   PRIMARY KEY,
    rule_id               VARCHAR(36)   NOT NULL REFERENCES approval_rules(id) ON DELETE CASCADE,
    step_number           INT           NOT NULL,
    label                 VARCHAR(255),
    step_type             VARCHAR(30)   NOT NULL DEFAULT 'POSITION',
    position_ids          VARCHAR(500),
    person_ids            VARCHAR(500),
    approval_mode         VARCHAR(20)   NOT NULL DEFAULT 'ANY_ONE',
    approval_limit_amount NUMERIC(14,2),
    timeout_hours         INT,
    on_timeout            VARCHAR(20)   DEFAULT 'ESCALATE'
);

CREATE INDEX IF NOT EXISTS idx_approval_rules_policy   ON approval_rules(policy_id);
CREATE INDEX IF NOT EXISTS idx_approval_cond_rule       ON approval_conditions(rule_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_rule      ON approval_steps(rule_id);
