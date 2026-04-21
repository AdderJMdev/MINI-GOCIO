-- Recreate activity_logs to ensure target_id column exists
-- This is safer than ALTER TABLE if previous migrations had issues.

DROP TABLE IF EXISTS activity_logs;

CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    target_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
