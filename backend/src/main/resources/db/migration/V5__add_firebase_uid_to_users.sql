-- ===================================================================
-- Flyway Database Migration V5: Firebase UID Column for User Linking
-- ===================================================================

ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) UNIQUE AFTER id;
