-- =====================================================
-- D&D Dragon Demo - Database Reset Script
-- Run this anytime you want to reset the demo
-- =====================================================
-- Drop database if it exists (clean slate)
DROP DATABASE IF EXISTS dnd_game;

-- Create fresh database
CREATE DATABASE dnd_game;

-- Switch to the new database
USE dnd_game;

-- Create dragon table
CREATE TABLE dragon(
  id int PRIMARY KEY AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  hp int NOT NULL,
  max_hp int NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo dragon with full HP
INSERT INTO dragon(name, hp, max_hp)
  VALUES ('Ancient Red Dragon', 100, 100);

-- Verify the reset worked
SELECT
  id,
  name,
  hp,
  max_hp,
  created_at
FROM
  dragon;

-- Show confirmation message
SELECT
  'Database reset complete! Dragon HP restored to 100/100' AS status;

