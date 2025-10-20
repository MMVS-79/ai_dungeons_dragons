-- Migration: Add event_type and event_data to event_history table
-- This enables LLM context chaining with stat effects
-- Run this AFTER your existing schema is set up

USE dnd_game;

-- Add new columns for LLM event tracking
ALTER TABLE event_history 
ADD COLUMN event_type VARCHAR(50) AFTER message,
ADD COLUMN event_data JSON AFTER event_type;

-- Set defaults for existing rows (if any)
UPDATE event_history 
SET 
  event_type = 'NARRATIVE',
  event_data = '{"health": 0, "attack": 0, "defense": 0}'
WHERE event_type IS NULL;

-- Verify the migration
SELECT 
  'Migration complete!' AS status,
  COUNT(*) AS total_events
FROM event_history;

-- Show updated schema
DESCRIBE event_history;

