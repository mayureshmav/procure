-- Seed a SUPER_ADMIN user for cross-tenant (multi-tenant) organisation management
-- Password: SuperAdmin@1234 (BCrypt $2a$12$ encoded)
INSERT INTO users (username, password_hash, role, active)
SELECT 'super.admin', '$2a$12$LxBlcshUmNUkqpvou43QdeeLsZXFzLgslSsCmkXpgvR1uhDCtd.Su', 'SUPER_ADMIN', true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'super.admin');
