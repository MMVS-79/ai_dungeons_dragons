-- 1. Count how many characters belong to each race
SELECT r.name AS race_name, COUNT(ch.id) AS num_characters
FROM races r
LEFT JOIN characters ch ON r.id = ch.race_id
GROUP BY r.id, r.name;

-- 2. Count total characters per class along with average health
SELECT cl.name AS class_name, COUNT(ch.id) AS num_characters, AVG(ch.max_health) AS avg_health
FROM classes cl
LEFT JOIN characters ch ON cl.id = ch.class_id
GROUP BY cl.id, cl.name;

-- 3. Get all characters with their campaign name and account email
SELECT ch.name AS character_name, c.name AS campaign_name, a.email AS account_email
FROM characters ch
JOIN campaigns c ON ch.campaign_id = c.id
JOIN accounts a ON c.account_id = a.id
ORDER BY ch.id;

-- 4. Show all logs with campaign name and account email
SELECT l.id AS log_id, l.message, c.name AS campaign_name, a.email AS account_email
FROM logs l
JOIN campaigns c ON l.campaign_id = c.id
JOIN accounts a ON c.account_id = a.id
ORDER BY l.created_at DESC;

-- 5. Find the most common race among characters
SELECT r.name AS race_name, COUNT(ch.id) AS num_characters
FROM races r
JOIN characters ch ON r.id = ch.race_id
GROUP BY r.id
ORDER BY COUNT(ch.id) DESC
LIMIT 1;

-- 6. Ensure that there are no campaigns that have more than 1 character
SELECT c.id AS campaign_id, c.name AS campaign_name, COUNT(ch.id) AS num_characters
FROM campaigns c
JOIN characters ch ON c.id = ch.campaign_id
GROUP BY c.id, c.name
HAVING COUNT(ch.id) > 1;

-- 7. Average attack and defense for characters grouped by class
SELECT cl.name AS class_name, AVG(ch.attack) AS avg_attack, AVG(ch.defense) AS avg_defense
FROM classes cl
JOIN characters ch ON cl.id = ch.class_id
GROUP BY cl.id;

-- 8. Show weapons in database from rarest to most common
SELECT name, rarity
FROM weapons
ORDER BY rarity DESC;

-- 9. Find top 5 characters with the highest current health
SELECT name, current_health, max_health
FROM characters
ORDER BY current_health DESC
LIMIT 5;

-- 10. Total number of logs per campaign
SELECT c.id AS campaign_id, c.name AS campaign_name, COUNT(l.id) AS log_count
FROM campaigns c
LEFT JOIN logs l ON c.id = l.campaign_id
GROUP BY c.id, c.name;

-- 11. Characters that have both a weapon and a shield assigned
SELECT name, weapon_id, shield_id
FROM characters
WHERE weapon_id IS NOT NULL AND shield_id IS NOT NULL;

-- 12. Show health bonus from armours per character
SELECT ch.name AS character_name, a.health
FROM characters ch
JOIN armours a ON ch.armour_id = a.id
GROUP BY ch.id;

-- 13. Count of items per stat_modified type
SELECT stat_modified, COUNT(*) AS num_items
FROM items
GROUP BY stat_modified;

-- 14. Count the number of campaigns that are 'active' or 'paused'
SELECT c.state AS campaign_state, COUNT(c.id) AS campaign_count
FROM campaigns c
GROUP BY c.state;

-- 15. Characters in campaigns that are currently active
SELECT ch.name AS character_name, c.name AS campaign_name, c.state
FROM characters ch
JOIN campaigns c ON ch.campaign_id = c.id
WHERE c.state = 'active';

-- 16. Average attack of characters per race
SELECT r.name AS race_name, AVG(ch.attack) AS avg_attack
FROM races r
JOIN characters ch ON r.id = ch.race_id
GROUP BY r.id;

-- 17. Show top 3 campaigns with the most logs
SELECT c.id AS campaign_id, c.name AS campaign_name, COUNT(l.id) AS log_count
FROM campaigns c
JOIN logs l ON c.id = l.campaign_id
GROUP BY c.id, c.name
ORDER BY log_count DESC
LIMIT 3;

-- 18. Characters with health below 50% of max_health
SELECT name, current_health, max_health
FROM characters
WHERE current_health < max_health / 2;

-- 19. Find average attack and defense for characters grouped by race and class (2-level grouping)
SELECT r.name AS race_name, cl.name AS class_name, AVG(ch.attack) AS avg_attack, AVG(ch.defense) AS avg_defense
FROM characters ch
JOIN races r ON ch.race_id = r.id
JOIN classes cl ON ch.class_id = cl.id
GROUP BY r.id, cl.id;

-- 20. Count of logs per event_type
SELECT event_type, COUNT(*) AS count
FROM logs
GROUP BY event_type
ORDER BY count DESC;
