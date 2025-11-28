-- Returns total number of campaigns per account, sorted by most campaigns

DELIMITER $$
CREATE PROCEDURE total_campaigns()
BEGIN
    SELECT account_id, COUNT(*) AS total_campaigns
    FROM campaigns
    GROUP BY account_id
    ORDER BY total_campaigns DESC;
END $$
DELIMITER ;

-- Returns number of characters per class and per race

DELIMITER $$
CREATE PROCEDURE total_characters()
BEGIN
    SELECT cl.name AS class_name, r.name AS race_name, COUNT(*) AS total_characters
    FROM characters ch
    JOIN classes cl ON ch.class_id = cl.id
    JOIN races r ON ch.race_id = r.id
    GROUP BY cl.id, r.id
    ORDER BY total_characters DESC;
END $$
DELIMITER ;

-- Returns all campaigns for a given account, plus total characters in each campaign

DELIMITER $$
CREATE PROCEDURE campaigns_for_account(IN acc_id INT)
BEGIN
    SELECT c.id, c.name, c.state, COUNT(ch.id) AS num_characters
    FROM campaigns c
    LEFT JOIN characters ch ON c.id = ch.campaign_id
    WHERE c.account_id = acc_id
    GROUP BY c.id, c.name, c.state
    ORDER BY num_characters DESC;
END $$
DELIMITER ;

-- Returns all characters for a given campaign, including their class and race names
DELIMITER $$
CREATE PROCEDURE characters_in_campaign(IN camp_id INT)
BEGIN
    SELECT ch.id, ch.name, cl.name AS class_name, r.name AS race_name, ch.current_health, ch.attack, ch.defense
    FROM characters ch
    JOIN classes cl ON ch.class_id = cl.id
    JOIN races r ON ch.race_id = r.id
    WHERE ch.campaign_id = camp_id
    ORDER BY ch.current_health DESC, ch.attack DESC;
END $$
DELIMITER ;

-- Returns number of items of a certain rarity and the average stat value they modify
DELIMITER $$
CREATE PROCEDURE count_items_by_rarity(IN rarity_level INT, OUT item_count INT, OUT avg_stat_value DECIMAL(5,2))
BEGIN
    SELECT COUNT(*), AVG(stat_value) INTO item_count, avg_stat_value
    FROM items
    WHERE rarity = rarity_level;
END $$
DELIMITER ;

-- Returns number of weapons with attack above a threshold and their max attack
DELIMITER $$
CREATE PROCEDURE count_strong_weapons(IN attack_threshold INT, OUT strong_count INT, OUT max_attack_value INT)
BEGIN
    SELECT COUNT(*), MAX(attack) INTO strong_count, max_attack_value
    FROM weapons
    WHERE attack > attack_threshold;
END $$
DELIMITER ;

-- Prints a greeting for a character by name and their class/race
DELIMITER $$
CREATE PROCEDURE greet_character(IN char_id INT)
BEGIN
    SELECT CONCAT(
        'Hello ', ch.name, '! You are a ',
        cl.name, ' of race ', r.name, ' with ', ch.current_health, ' health.'
    ) AS greeting
    FROM characters ch
    JOIN classes cl ON ch.class_id = cl.id
    JOIN races r ON ch.race_id = r.id
    WHERE ch.id = char_id;
END $$
DELIMITER ;

-- Prints a summary of a campaign, including number of characters and total events logged

DELIMITER $$
CREATE PROCEDURE campaign_summary(IN camp_id INT)
BEGIN
    SELECT CONCAT(
        'Campaign "', c.name, '" has ', 
        COUNT(DISTINCT ch.id), ' characters and ',
        COUNT(DISTINCT l.id), ' log events.'
    ) AS summary
    FROM campaigns c
    LEFT JOIN characters ch ON c.id = ch.campaign_id
    LEFT JOIN logs l ON c.id = l.campaign_id
    WHERE c.id = camp_id
    GROUP BY c.id, c.name;
END $$
DELIMITER ;
