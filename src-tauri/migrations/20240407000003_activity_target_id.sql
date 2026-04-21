-- Add target_id to activity_logs to link to specific entities (sale_id, purchase_id, etc)
ALTER TABLE activity_logs ADD COLUMN target_id INTEGER;
