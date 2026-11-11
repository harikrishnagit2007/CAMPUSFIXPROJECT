-- ===================================================================
-- Flyway Database Migration V5: Firebase UID Column & Index for User Linking
-- ===================================================================

ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) UNIQUE AFTER id;
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
