-- ============================================================
-- V3: Fix admin password hash (V2 contained an invalid hash)
--     Password: Admin@1234  |  BCrypt cost 12, $2a$ prefix
-- ============================================================
UPDATE users
SET password_hash = '$2a$12$JubV0bjGQAJ/9cQgRnG.lOqY7QyTkLh.yu4KugLw.qPZoT/GDq0a6'
WHERE username = 'admin';
