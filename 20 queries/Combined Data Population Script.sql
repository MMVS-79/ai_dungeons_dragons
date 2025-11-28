-- 1. Accounts
INSERT INTO accounts (id, email) VALUES
(1, 'user1@example.com'),  (2, 'user2@example.com'),  (3, 'user3@example.com'),
(4, 'user4@example.com'),  (5, 'user5@example.com'),  (6, 'user6@example.com'),
(7, 'user7@example.com'),  (8, 'user8@example.com'),  (9, 'user9@example.com'),
(10, 'user10@example.com'), (11, 'user11@example.com'), (12, 'user12@example.com'),
(13, 'user13@example.com'), (14, 'user14@example.com'), (15, 'user15@example.com'),
(16, 'user16@example.com'), (17, 'user17@example.com'), (18, 'user18@example.com'),
(19, 'user19@example.com'), (20, 'user20@example.com');

-- 2. Classes
INSERT INTO classes (id, name, health, attack, defense, sprite_path) VALUES
(1, 'Warrior', 50, 10, 10, 'sprites/class_1.png'),
(2, 'Mage', 40, 15, 5, 'sprites/class_2.png'),
(3, 'Rogue', 45, 12, 8, 'sprites/class_3.png');

-- 3. Races
INSERT INTO races (id, name, health, attack, defense, sprite_path) VALUES
(1, 'Human', 50, 10, 10, 'sprites/race_1.png'),
(2, 'Elf', 40, 12, 8, 'sprites/race_2.png'),
(3, 'Dwarf', 60, 8, 12, 'sprites/race_3.png');

-- 4. Campaigns (2 per account)
INSERT INTO campaigns (id, account_id, name, description, state) VALUES
(101, 1, 'Campaign 101', 'Adventure 101', 'active'),
(102, 1, 'Campaign 102', 'Adventure 102', 'paused'),
(103, 2, 'Campaign 103', 'Adventure 103', 'active'),
(104, 2, 'Campaign 104', 'Adventure 104', 'paused'),
(105, 3, 'Campaign 105', 'Adventure 105', 'active'),
(106, 3, 'Campaign 106', 'Adventure 106', 'paused'),
(107, 4, 'Campaign 107', 'Adventure 107', 'active'),
(108, 4, 'Campaign 108', 'Adventure 108', 'paused'),
(109, 5, 'Campaign 109', 'Adventure 109', 'active'),
(110, 5, 'Campaign 110', 'Adventure 110', 'paused'),
(111, 6, 'Campaign 111', 'Adventure 111', 'active'),
(112, 6, 'Campaign 112', 'Adventure 112', 'paused'),
(113, 7, 'Campaign 113', 'Adventure 113', 'active'),
(114, 7, 'Campaign 114', 'Adventure 114', 'paused'),
(115, 8, 'Campaign 115', 'Adventure 115', 'active'),
(116, 8, 'Campaign 116', 'Adventure 116', 'paused'),
(117, 9, 'Campaign 117', 'Adventure 117', 'active'),
(118, 9, 'Campaign 118', 'Adventure 118', 'paused'),
(119, 10, 'Campaign 119', 'Adventure 119', 'active'),
(120, 10, 'Campaign 120', 'Adventure 120', 'paused'),
(121, 11, 'Campaign 121', 'Adventure 121', 'active'),
(122, 11, 'Campaign 122', 'Adventure 122', 'paused'),
(123, 12, 'Campaign 123', 'Adventure 123', 'active'),
(124, 12, 'Campaign 124', 'Adventure 124', 'paused'),
(125, 13, 'Campaign 125', 'Adventure 125', 'active'),
(126, 13, 'Campaign 126', 'Adventure 126', 'paused'),
(127, 14, 'Campaign 127', 'Adventure 127', 'active'),
(128, 14, 'Campaign 128', 'Adventure 128', 'paused'),
(129, 15, 'Campaign 129', 'Adventure 129', 'active'),
(130, 15, 'Campaign 130', 'Adventure 130', 'paused'),
(131, 16, 'Campaign 131', 'Adventure 131', 'active'),
(132, 16, 'Campaign 132', 'Adventure 132', 'paused'),
(133, 17, 'Campaign 133', 'Adventure 133', 'active'),
(134, 17, 'Campaign 134', 'Adventure 134', 'paused'),
(135, 18, 'Campaign 135', 'Adventure 135', 'active'),
(136, 18, 'Campaign 136', 'Adventure 136', 'paused'),
(137, 19, 'Campaign 137', 'Adventure 137', 'active'),
(138, 19, 'Campaign 138', 'Adventure 138', 'paused'),
(139, 20, 'Campaign 139', 'Adventure 139', 'active'),
(140, 20, 'Campaign 140', 'Adventure 140', 'paused');

INSERT INTO armours (name, rarity, health, description, sprite_path) VALUES
('Armour 1', 4, 10, 'Protective armour number 1', 'sprites/armour_1.png'),
('Armour 2', 2, 18, 'Protective armour number 2', 'sprites/armour_2.png'),
('Armour 3', 1, 32, 'Protective armour number 3', 'sprites/armour_3.png'),
('Armour 4', 1, 22, 'Protective armour number 4', 'sprites/armour_4.png'),
('Armour 5', 4, 50, 'Protective armour number 5', 'sprites/armour_5.png'),
('Armour 6', 2, 49, 'Protective armour number 6', 'sprites/armour_6.png'),
('Armour 7', 2, 50, 'Protective armour number 7', 'sprites/armour_7.png'),
('Armour 8', 2, 33, 'Protective armour number 8', 'sprites/armour_8.png'),
('Armour 9', 4, 37, 'Protective armour number 9', 'sprites/armour_9.png'),
('Armour 10', 3, 42, 'Protective armour number 10', 'sprites/armour_10.png'),
('Armour 11', 5, 50, 'Protective armour number 11', 'sprites/armour_11.png'),
('Armour 12', 2, 35, 'Protective armour number 12', 'sprites/armour_12.png'),
('Armour 13', 3, 11, 'Protective armour number 13', 'sprites/armour_13.png'),
('Armour 14', 3, 44, 'Protective armour number 14', 'sprites/armour_14.png'),
('Armour 15', 2, 24, 'Protective armour number 15', 'sprites/armour_15.png');

INSERT INTO weapons (name, rarity, attack, description, sprite_path) VALUES
('Weapon 1', 3, 27, 'Weapon number 1', 'sprites/weapon_1.png'),
('Weapon 2', 5, 27, 'Weapon number 2', 'sprites/weapon_2.png'),
('Weapon 3', 2, 12, 'Weapon number 3', 'sprites/weapon_3.png'),
('Weapon 4', 4, 9, 'Weapon number 4', 'sprites/weapon_4.png'),
('Weapon 5', 3, 7, 'Weapon number 5', 'sprites/weapon_5.png'),
('Weapon 6', 4, 27, 'Weapon number 6', 'sprites/weapon_6.png'),
('Weapon 7', 1, 5, 'Weapon number 7', 'sprites/weapon_7.png'),
('Weapon 8', 4, 19, 'Weapon number 8', 'sprites/weapon_8.png'),
('Weapon 9', 4, 28, 'Weapon number 9', 'sprites/weapon_9.png'),
('Weapon 10', 1, 20, 'Weapon number 10', 'sprites/weapon_10.png'),
('Weapon 11', 4, 13, 'Weapon number 11', 'sprites/weapon_11.png'),
('Weapon 12', 1, 19, 'Weapon number 12', 'sprites/weapon_12.png'),
('Weapon 13', 4, 19, 'Weapon number 13', 'sprites/weapon_13.png'),
('Weapon 14', 5, 30, 'Weapon number 14', 'sprites/weapon_14.png'),
('Weapon 15', 1, 8, 'Weapon number 15', 'sprites/weapon_15.png');

INSERT INTO shields (name, rarity, defense, description, sprite_path) VALUES
('Shield 1', 2, 24, 'Shield number 1', 'sprites/shield_1.png'),
('Shield 2', 3, 8, 'Shield number 2', 'sprites/shield_2.png'),
('Shield 3', 1, 10, 'Shield number 3', 'sprites/shield_3.png'),
('Shield 4', 1, 21, 'Shield number 4', 'sprites/shield_4.png'),
('Shield 5', 1, 9, 'Shield number 5', 'sprites/shield_5.png'),
('Shield 6', 3, 17, 'Shield number 6', 'sprites/shield_6.png'),
('Shield 7', 5, 15, 'Shield number 7', 'sprites/shield_7.png'),
('Shield 8', 4, 15, 'Shield number 8', 'sprites/shield_8.png'),
('Shield 9', 3, 23, 'Shield number 9', 'sprites/shield_9.png'),
('Shield 10', 4, 11, 'Shield number 10', 'sprites/shield_10.png');

INSERT INTO items (name, rarity, stat_modified, stat_value, description, sprite_path) VALUES
('Item 1', 3, 'health', 13, 'Item number 1 modifies health by 13', 'sprites/item_1.png'),
('Item 2', 4, 'defense', 15, 'Item number 2 modifies defense by 15', 'sprites/item_2.png'),
('Item 3', 5, 'attack', 19, 'Item number 3 modifies attack by 19', 'sprites/item_3.png'),
('Item 4', 2, 'health', 10, 'Item number 4 modifies health by 10', 'sprites/item_4.png'),
('Item 5', 2, 'defense', 16, 'Item number 5 modifies defense by 16', 'sprites/item_5.png'),
('Item 6', 5, 'defense', 18, 'Item number 6 modifies defense by 18', 'sprites/item_6.png'),
('Item 7', 5, 'health', 11, 'Item number 7 modifies health by 11', 'sprites/item_7.png'),
('Item 8', 1, 'attack', 17, 'Item number 8 modifies attack by 17', 'sprites/item_8.png'),
('Item 9', 5, 'defense', 5, 'Item number 9 modifies defense by 5', 'sprites/item_9.png'),
('Item 10', 1, 'health', 4, 'Item number 10 modifies health by 4', 'sprites/item_10.png'),
('Item 11', 1, 'defense', -10, 'Item number 11 modifies defense by -10', 'sprites/item_11.png'),
('Item 12', 3, 'defense', -5, 'Item number 12 modifies defense by -5', 'sprites/item_12.png'),
('Item 13', 5, 'health', 2, 'Item number 13 modifies health by 2', 'sprites/item_13.png'),
('Item 14', 3, 'defense', -8, 'Item number 14 modifies defense by -8', 'sprites/item_14.png'),
('Item 15', 5, 'health', -1, 'Item number 15 modifies health by -1', 'sprites/item_15.png'),
('Item 16', 5, 'attack', 12, 'Item number 16 modifies attack by 12', 'sprites/item_16.png'),
('Item 17', 2, 'attack', 12, 'Item number 17 modifies attack by 12', 'sprites/item_17.png'),
('Item 18', 1, 'health', 9, 'Item number 18 modifies health by 9', 'sprites/item_18.png'),
('Item 19', 2, 'health', -1, 'Item number 19 modifies health by -1', 'sprites/item_19.png'),
('Item 20', 3, 'health', 0, 'Item number 20 modifies health by 0', 'sprites/item_20.png');

-- Characters with armours, weapons, and shields
INSERT INTO characters (race_id, class_id, campaign_id, name, current_health, max_health, attack, defense, armour_id, weapon_id, shield_id) VALUES
(1, 1, 101, 'Character 1', 50, 50, 10, 10, 1, 1, 1),
(2, 2, 102, 'Character 2', 40, 40, 12, 8, 2, 2, 2),
(3, 3, 103, 'Character 3', 60, 60, 8, 12, 3, 3, 3),
(1, 2, 104, 'Character 4', 50, 50, 11, 9, 4, 4, 4),
(2, 1, 105, 'Character 5', 40, 40, 12, 8, 5, 5, 5),
(3, 3, 106, 'Character 6', 60, 60, 8, 12, 6, 6, 6),
(1, 1, 107, 'Character 7', 50, 50, 10, 10, 7, 7, 7),
(2, 2, 108, 'Character 8', 40, 40, 12, 8, 8, 8, 8),
(3, 3, 109, 'Character 9', 60, 60, 8, 12, 9, 9, 9),
(1, 2, 110, 'Character 10', 50, 50, 11, 9, 10, 10, 10),
(2, 1, 111, 'Character 11', 40, 40, 12, 8, 11, 11, 1),
(3, 3, 112, 'Character 12', 60, 60, 8, 12, 12, 12, 2),
(1, 1, 113, 'Character 13', 50, 50, 10, 10, 13, 13, 3),
(2, 2, 114, 'Character 14', 40, 40, 12, 8, 14, 14, 4),
(3, 3, 115, 'Character 15', 60, 60, 8, 12, 15, 15, 5),
(1, 2, 116, 'Character 16', 50, 50, 11, 9, 1, 1, 6),
(2, 1, 117, 'Character 17', 40, 40, 12, 8, 2, 2, 7),
(3, 3, 118, 'Character 18', 60, 60, 8, 12, 3, 3, 8),
(1, 1, 119, 'Character 19', 50, 50, 10, 10, 4, 4, 9),
(2, 2, 120, 'Character 20', 40, 40, 12, 8, 5, 5, 10),
(3, 3, 121, 'Character 21', 60, 60, 8, 12, 6, 6, 1),
(1, 2, 122, 'Character 22', 50, 50, 11, 9, 7, 7, 2),
(2, 1, 123, 'Character 23', 40, 40, 12, 8, 8, 8, 3),
(3, 3, 124, 'Character 24', 60, 60, 8, 12, 9, 9, 4),
(1, 1, 125, 'Character 25', 50, 50, 10, 10, 10, 10, 5),
(2, 2, 126, 'Character 26', 40, 40, 12, 8, 11, 11, 6),
(3, 3, 127, 'Character 27', 60, 60, 8, 12, 12, 12, 7),
(1, 2, 128, 'Character 28', 50, 50, 11, 9, 13, 13, 8),
(2, 1, 129, 'Character 29', 40, 40, 12, 8, 14, 14, 9),
(3, 3, 130, 'Character 30', 60, 60, 8, 12, 15, 15, 10),
(1, 1, 131, 'Character 31', 50, 50, 10, 10, 1, 1, 1),
(2, 2, 132, 'Character 32', 40, 40, 12, 8, 2, 2, 2),
(3, 3, 133, 'Character 33', 60, 60, 8, 12, 3, 3, 3),
(1, 2, 134, 'Character 34', 50, 50, 11, 9, 4, 4, 4),
(2, 1, 135, 'Character 35', 40, 40, 12, 8, 5, 5, 5),
(3, 3, 136, 'Character 36', 60, 60, 8, 12, 6, 6, 6),
(1, 1, 137, 'Character 37', 50, 50, 10, 10, 7, 7, 7),
(2, 2, 138, 'Character 38', 40, 40, 12, 8, 8, 8, 8),
(3, 3, 139, 'Character 39', 60, 60, 8, 12, 9, 9, 9),
(1, 2, 140, 'Character 40', 50, 50, 11, 9, 10, 10, 10);


INSERT INTO character_items (character_id, item_id) VALUES
(4, 9),
(7, 16),
(9, 11),
(1, 13),
(5, 19),
(4, 1),
(9, 3),
(2, 19),
(9, 3),
(1, 6),
(3, 10),
(1, 13),
(2, 6),
(8, 17),
(6, 17),
(3, 6),
(6, 4),
(4, 5),
(3, 19),
(8, 2);

INSERT INTO chats (campaign_id, conversation_path) VALUES (101, 'conversations/campaign_101.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (102, 'conversations/campaign_102.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (103, 'conversations/campaign_103.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (104, 'conversations/campaign_104.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (105, 'conversations/campaign_105.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (106, 'conversations/campaign_106.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (107, 'conversations/campaign_107.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (108, 'conversations/campaign_108.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (109, 'conversations/campaign_109.json');
INSERT INTO chats (campaign_id, conversation_path) VALUES (110, 'conversations/campaign_110.json');

INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Goblin #1', 8, 192, 13, 8, 'sprites/enemies/enemy_1.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Skeleton #2', 2, 131, 24, 15, 'sprites/enemies/enemy_2.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Wolf #3', 7, 389, 15, 9, 'sprites/enemies/enemy_3.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Dragon Whelp #4', 5, 221, 12, 24, 'sprites/enemies/enemy_4.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Giant Spider #5', 10, 263, 6, 12, 'sprites/enemies/enemy_5.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Orc #6', 2, 371, 44, 3, 'sprites/enemies/enemy_6.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Troll #7', 7, 214, 8, 28, 'sprites/enemies/enemy_7.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Zombie #8', 5, 68, 36, 4, 'sprites/enemies/enemy_8.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Dragon Whelp #9', 5, 457, 24, 6, 'sprites/enemies/enemy_9.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Slime #10', 3, 283, 49, 8, 'sprites/enemies/enemy_10.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Slime #11', 6, 338, 42, 30, 'sprites/enemies/enemy_11.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Giant Spider #12', 10, 122, 37, 15, 'sprites/enemies/enemy_12.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Orc #13', 7, 304, 45, 8, 'sprites/enemies/enemy_13.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Bandit #14', 6, 254, 44, 10, 'sprites/enemies/enemy_14.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Orc #15', 7, 459, 26, 22, 'sprites/enemies/enemy_15.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Bandit #16', 5, 416, 30, 3, 'sprites/enemies/enemy_16.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Troll #17', 7, 266, 35, 1, 'sprites/enemies/enemy_17.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Orc #18', 3, 123, 34, 19, 'sprites/enemies/enemy_18.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Goblin #19', 1, 135, 44, 7, 'sprites/enemies/enemy_19.png');
INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES ('Slime #20', 3, 415, 26, 14, 'sprites/enemies/enemy_20.png');

INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (108, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 3}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 1 (loot) occurred.', 1, 'loot', '{"detail": "Example loot event", "value": 19}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (107, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 74}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 1 (dialogue) occurred.', 1, 'dialogue', '{"detail": "Example dialogue event", "value": 46}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 86}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 1 (rest) occurred.', 1, 'rest', '{"detail": "Example rest event", "value": 84}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 38}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (107, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 5}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 72}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 45}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (129, 'Event 1 (rest) occurred.', 1, 'rest', '{"detail": "Example rest event", "value": 31}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 2 (rest) occurred.', 2, 'rest', '{"detail": "Example rest event", "value": 45}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 97}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (121, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 31}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (115, 'Event 1 (loot) occurred.', 1, 'loot', '{"detail": "Example loot event", "value": 54}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (137, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 70}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 2 (rest) occurred.', 2, 'rest', '{"detail": "Example rest event", "value": 15}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (137, 'Event 2 (combat) occurred.', 2, 'combat', '{"detail": "Example combat event", "value": 10}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (135, 'Event 1 (rest) occurred.', 1, 'rest', '{"detail": "Example rest event", "value": 25}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (136, 'Event 1 (loot) occurred.', 1, 'loot', '{"detail": "Example loot event", "value": 46}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (136, 'Event 2 (rest) occurred.', 2, 'rest', '{"detail": "Example rest event", "value": 36}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (125, 'Event 1 (rest) occurred.', 1, 'rest', '{"detail": "Example rest event", "value": 75}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (126, 'Event 1 (rest) occurred.', 1, 'rest', '{"detail": "Example rest event", "value": 19}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 24}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 2 (rest) occurred.', 2, 'rest', '{"detail": "Example rest event", "value": 86}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 2 (combat) occurred.', 2, 'combat', '{"detail": "Example combat event", "value": 44}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 1 (movement) occurred.', 1, 'movement', '{"detail": "Example movement event", "value": 29}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 31}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 2 (loot) occurred.', 2, 'loot', '{"detail": "Example loot event", "value": 46}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (134, 'Event 1 (dialogue) occurred.', 1, 'dialogue', '{"detail": "Example dialogue event", "value": 36}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 1 (dialogue) occurred.', 1, 'dialogue', '{"detail": "Example dialogue event", "value": 71}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 51}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 2 (combat) occurred.', 2, 'combat', '{"detail": "Example combat event", "value": 31}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 3 (combat) occurred.', 3, 'combat', '{"detail": "Example combat event", "value": 29}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 1 (rest) occurred.', 1, 'rest', '{"detail": "Example rest event", "value": 31}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (125, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 48}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 77}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (119, 'Event 1 (loot) occurred.', 1, 'loot', '{"detail": "Example loot event", "value": 37}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 1 (movement) occurred.', 1, 'movement', '{"detail": "Example movement event", "value": 79}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (137, 'Event 3 (rest) occurred.', 3, 'rest', '{"detail": "Example rest event", "value": 51}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (108, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 99}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 43}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (136, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 27}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (121, 'Event 2 (loot) occurred.', 2, 'loot', '{"detail": "Example loot event", "value": 71}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 4 (combat) occurred.', 4, 'combat', '{"detail": "Example combat event", "value": 78}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (134, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 40}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (121, 'Event 3 (combat) occurred.', 3, 'combat', '{"detail": "Example combat event", "value": 27}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 4}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 3 (combat) occurred.', 3, 'combat', '{"detail": "Example combat event", "value": 46}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (125, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 71}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (138, 'Event 1 (dialogue) occurred.', 1, 'dialogue', '{"detail": "Example dialogue event", "value": 30}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 59}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (118, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 77}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (130, 'Event 1 (movement) occurred.', 1, 'movement', '{"detail": "Example movement event", "value": 58}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (139, 'Event 1 (loot) occurred.', 1, 'loot', '{"detail": "Example loot event", "value": 92}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 4 (loot) occurred.', 4, 'loot', '{"detail": "Example loot event", "value": 14}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (128, 'Event 1 (rest) occurred.', 1, 'rest', '{"detail": "Example rest event", "value": 32}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 35}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (129, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 33}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (139, 'Event 2 (combat) occurred.', 2, 'combat', '{"detail": "Example combat event", "value": 16}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 5 (loot) occurred.', 5, 'loot', '{"detail": "Example loot event", "value": 63}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 37}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 4 (rest) occurred.', 4, 'rest', '{"detail": "Example rest event", "value": 98}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 1 (loot) occurred.', 1, 'loot', '{"detail": "Example loot event", "value": 88}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (126, 'Event 2 (rest) occurred.', 2, 'rest', '{"detail": "Example rest event", "value": 88}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 5 (dialogue) occurred.', 5, 'dialogue', '{"detail": "Example dialogue event", "value": 25}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 1 (dialogue) occurred.', 1, 'dialogue', '{"detail": "Example dialogue event", "value": 41}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 15}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (129, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 19}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 2 (combat) occurred.', 2, 'combat', '{"detail": "Example combat event", "value": 5}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 3 (rest) occurred.', 3, 'rest', '{"detail": "Example rest event", "value": 4}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 2 (rest) occurred.', 2, 'rest', '{"detail": "Example rest event", "value": 64}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (138, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 100}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (138, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 36}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (134, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 76}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 32}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (120, 'Event 1 (movement) occurred.', 1, 'movement', '{"detail": "Example movement event", "value": 30}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 98}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (121, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 9}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (119, 'Event 2 (combat) occurred.', 2, 'combat', '{"detail": "Example combat event", "value": 40}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (139, 'Event 3 (rest) occurred.', 3, 'rest', '{"detail": "Example rest event", "value": 86}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 12}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (109, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 36}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (116, 'Event 1 (loot) occurred.', 1, 'loot', '{"detail": "Example loot event", "value": 28}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 80}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (129, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 15}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (138, 'Event 4 (movement) occurred.', 4, 'movement', '{"detail": "Example movement event", "value": 52}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 81}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (113, 'Event 1 (dialogue) occurred.', 1, 'dialogue', '{"detail": "Example dialogue event", "value": 51}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 10}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (104, 'Event 1 (combat) occurred.', 1, 'combat', '{"detail": "Example combat event", "value": 94}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (125, 'Event 4 (loot) occurred.', 4, 'loot', '{"detail": "Example loot event", "value": 48}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (104, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 57}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 53}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (115, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 86}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 4 (combat) occurred.', 4, 'combat', '{"detail": "Example combat event", "value": 48}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 4 (combat) occurred.', 4, 'combat', '{"detail": "Example combat event", "value": 25}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 4 (combat) occurred.', 4, 'combat', '{"detail": "Example combat event", "value": 80}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 78}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 4 (loot) occurred.', 4, 'loot', '{"detail": "Example loot event", "value": 57}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (101, 'Event 1 (dialogue) occurred.', 1, 'dialogue', '{"detail": "Example dialogue event", "value": 30}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (112, 'Event 1 (rest) occurred.', 1, 'rest', '{"detail": "Example rest event", "value": 55}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 5 (rest) occurred.', 5, 'rest', '{"detail": "Example rest event", "value": 21}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 3 (rest) occurred.', 3, 'rest', '{"detail": "Example rest event", "value": 19}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (107, 'Event 3 (combat) occurred.', 3, 'combat', '{"detail": "Example combat event", "value": 86}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 49}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 4 (rest) occurred.', 4, 'rest', '{"detail": "Example rest event", "value": 54}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (120, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 67}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (129, 'Event 5 (loot) occurred.', 5, 'loot', '{"detail": "Example loot event", "value": 66}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 5 (rest) occurred.', 5, 'rest', '{"detail": "Example rest event", "value": 66}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (116, 'Event 2 (combat) occurred.', 2, 'combat', '{"detail": "Example combat event", "value": 43}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 4 (loot) occurred.', 4, 'loot', '{"detail": "Example loot event", "value": 10}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (134, 'Event 4 (movement) occurred.', 4, 'movement', '{"detail": "Example movement event", "value": 33}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 5 (loot) occurred.', 5, 'loot', '{"detail": "Example loot event", "value": 86}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 6 (combat) occurred.', 6, 'combat', '{"detail": "Example combat event", "value": 48}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (136, 'Event 4 (rest) occurred.', 4, 'rest', '{"detail": "Example rest event", "value": 60}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (135, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 47}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (139, 'Event 4 (combat) occurred.', 4, 'combat', '{"detail": "Example combat event", "value": 22}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 5 (rest) occurred.', 5, 'rest', '{"detail": "Example rest event", "value": 30}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (134, 'Event 5 (dialogue) occurred.', 5, 'dialogue', '{"detail": "Example dialogue event", "value": 5}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 6 (dialogue) occurred.', 6, 'dialogue', '{"detail": "Example dialogue event", "value": 77}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (110, 'Event 1 (dialogue) occurred.', 1, 'dialogue', '{"detail": "Example dialogue event", "value": 24}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (110, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 63}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (119, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 71}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 6 (dialogue) occurred.', 6, 'dialogue', '{"detail": "Example dialogue event", "value": 18}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (137, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 91}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (128, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 66}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 6 (rest) occurred.', 6, 'rest', '{"detail": "Example rest event", "value": 98}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 75}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (134, 'Event 6 (dialogue) occurred.', 6, 'dialogue', '{"detail": "Example dialogue event", "value": 23}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (108, 'Event 3 (rest) occurred.', 3, 'rest', '{"detail": "Example rest event", "value": 6}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 7 (dialogue) occurred.', 7, 'dialogue', '{"detail": "Example dialogue event", "value": 84}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 3 (combat) occurred.', 3, 'combat', '{"detail": "Example combat event", "value": 79}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 7 (movement) occurred.', 7, 'movement', '{"detail": "Example movement event", "value": 69}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 4 (movement) occurred.', 4, 'movement', '{"detail": "Example movement event", "value": 37}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (101, 'Event 2 (rest) occurred.', 2, 'rest', '{"detail": "Example rest event", "value": 79}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (129, 'Event 6 (loot) occurred.', 6, 'loot', '{"detail": "Example loot event", "value": 58}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 5 (rest) occurred.', 5, 'rest', '{"detail": "Example rest event", "value": 51}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (126, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 17}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (118, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 61}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 7 (dialogue) occurred.', 7, 'dialogue', '{"detail": "Example dialogue event", "value": 85}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (138, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 67}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 5 (loot) occurred.', 5, 'loot', '{"detail": "Example loot event", "value": 67}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 6 (combat) occurred.', 6, 'combat', '{"detail": "Example combat event", "value": 83}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 6 (dialogue) occurred.', 6, 'dialogue', '{"detail": "Example dialogue event", "value": 13}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 3 (movement) occurred.', 3, 'movement', '{"detail": "Example movement event", "value": 7}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (101, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 59}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 8 (combat) occurred.', 8, 'combat', '{"detail": "Example combat event", "value": 4}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 95}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 8 (loot) occurred.', 8, 'loot', '{"detail": "Example loot event", "value": 83}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (120, 'Event 3 (combat) occurred.', 3, 'combat', '{"detail": "Example combat event", "value": 75}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (120, 'Event 4 (loot) occurred.', 4, 'loot', '{"detail": "Example loot event", "value": 4}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 100}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (128, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 23}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 8 (rest) occurred.', 8, 'rest', '{"detail": "Example rest event", "value": 46}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (113, 'Event 2 (loot) occurred.', 2, 'loot', '{"detail": "Example loot event", "value": 13}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (138, 'Event 6 (rest) occurred.', 6, 'rest', '{"detail": "Example rest event", "value": 100}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 6 (loot) occurred.', 6, 'loot', '{"detail": "Example loot event", "value": 34}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 6 (dialogue) occurred.', 6, 'dialogue', '{"detail": "Example dialogue event", "value": 61}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (110, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 68}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (126, 'Event 4 (rest) occurred.', 4, 'rest', '{"detail": "Example rest event", "value": 63}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 7 (combat) occurred.', 7, 'combat', '{"detail": "Example combat event", "value": 12}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 5 (movement) occurred.', 5, 'movement', '{"detail": "Example movement event", "value": 19}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (126, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 64}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 7 (movement) occurred.', 7, 'movement', '{"detail": "Example movement event", "value": 69}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (104, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 81}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 4 (movement) occurred.', 4, 'movement', '{"detail": "Example movement event", "value": 88}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (108, 'Event 4 (combat) occurred.', 4, 'combat', '{"detail": "Example combat event", "value": 19}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 5 (movement) occurred.', 5, 'movement', '{"detail": "Example movement event", "value": 24}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 9 (movement) occurred.', 9, 'movement', '{"detail": "Example movement event", "value": 80}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 5 (movement) occurred.', 5, 'movement', '{"detail": "Example movement event", "value": 58}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 5 (dialogue) occurred.', 5, 'dialogue', '{"detail": "Example dialogue event", "value": 38}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (112, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 51}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (137, 'Event 5 (dialogue) occurred.', 5, 'dialogue', '{"detail": "Example dialogue event", "value": 35}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 9 (combat) occurred.', 9, 'combat', '{"detail": "Example combat event", "value": 5}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (113, 'Event 3 (combat) occurred.', 3, 'combat', '{"detail": "Example combat event", "value": 54}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (130, 'Event 2 (movement) occurred.', 2, 'movement', '{"detail": "Example movement event", "value": 98}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 6 (combat) occurred.', 6, 'combat', '{"detail": "Example combat event", "value": 5}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 6 (rest) occurred.', 6, 'rest', '{"detail": "Example rest event", "value": 69}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 7 (rest) occurred.', 7, 'rest', '{"detail": "Example rest event", "value": 53}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 6 (movement) occurred.', 6, 'movement', '{"detail": "Example movement event", "value": 91}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 8 (movement) occurred.', 8, 'movement', '{"detail": "Example movement event", "value": 34}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 8 (rest) occurred.', 8, 'rest', '{"detail": "Example rest event", "value": 68}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 6 (rest) occurred.', 6, 'rest', '{"detail": "Example rest event", "value": 72}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 7 (combat) occurred.', 7, 'combat', '{"detail": "Example combat event", "value": 3}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 9 (loot) occurred.', 9, 'loot', '{"detail": "Example loot event", "value": 87}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (135, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 51}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 7 (rest) occurred.', 7, 'rest', '{"detail": "Example rest event", "value": 60}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (116, 'Event 3 (movement) occurred.', 3, 'movement', '{"detail": "Example movement event", "value": 2}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (129, 'Event 7 (loot) occurred.', 7, 'loot', '{"detail": "Example loot event", "value": 42}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 7 (dialogue) occurred.', 7, 'dialogue', '{"detail": "Example dialogue event", "value": 41}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 8 (rest) occurred.', 8, 'rest', '{"detail": "Example rest event", "value": 67}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 4 (movement) occurred.', 4, 'movement', '{"detail": "Example movement event", "value": 63}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (139, 'Event 5 (movement) occurred.', 5, 'movement', '{"detail": "Example movement event", "value": 54}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 8 (loot) occurred.', 8, 'loot', '{"detail": "Example loot event", "value": 88}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (136, 'Event 5 (movement) occurred.', 5, 'movement', '{"detail": "Example movement event", "value": 57}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 9 (rest) occurred.', 9, 'rest', '{"detail": "Example rest event", "value": 8}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (130, 'Event 3 (rest) occurred.', 3, 'rest', '{"detail": "Example rest event", "value": 18}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (102, 'Event 10 (dialogue) occurred.', 10, 'dialogue', '{"detail": "Example dialogue event", "value": 78}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 6 (loot) occurred.', 6, 'loot', '{"detail": "Example loot event", "value": 58}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (108, 'Event 5 (dialogue) occurred.', 5, 'dialogue', '{"detail": "Example dialogue event", "value": 50}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (138, 'Event 7 (rest) occurred.', 7, 'rest', '{"detail": "Example rest event", "value": 62}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 7 (dialogue) occurred.', 7, 'dialogue', '{"detail": "Example dialogue event", "value": 71}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 7 (movement) occurred.', 7, 'movement', '{"detail": "Example movement event", "value": 39}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (130, 'Event 4 (combat) occurred.', 4, 'combat', '{"detail": "Example combat event", "value": 28}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (125, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 45}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 10 (loot) occurred.', 10, 'loot', '{"detail": "Example loot event", "value": 65}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (118, 'Event 3 (loot) occurred.', 3, 'loot', '{"detail": "Example loot event", "value": 34}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (121, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 26}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (135, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 63}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (109, 'Event 2 (dialogue) occurred.', 2, 'dialogue', '{"detail": "Example dialogue event", "value": 46}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 7 (loot) occurred.', 7, 'loot', '{"detail": "Example loot event", "value": 29}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (109, 'Event 3 (rest) occurred.', 3, 'rest', '{"detail": "Example rest event", "value": 35}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 8 (loot) occurred.', 8, 'loot', '{"detail": "Example loot event", "value": 60}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 7 (combat) occurred.', 7, 'combat', '{"detail": "Example combat event", "value": 21}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 5 (dialogue) occurred.', 5, 'dialogue', '{"detail": "Example dialogue event", "value": 7}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (112, 'Event 3 (dialogue) occurred.', 3, 'dialogue', '{"detail": "Example dialogue event", "value": 57}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 6 (rest) occurred.', 6, 'rest', '{"detail": "Example rest event", "value": 14}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (130, 'Event 5 (rest) occurred.', 5, 'rest', '{"detail": "Example rest event", "value": 89}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 8 (dialogue) occurred.', 8, 'dialogue', '{"detail": "Example dialogue event", "value": 67}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (113, 'Event 4 (combat) occurred.', 4, 'combat', '{"detail": "Example combat event", "value": 24}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 8 (movement) occurred.', 8, 'movement', '{"detail": "Example movement event", "value": 18}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 9 (dialogue) occurred.', 9, 'dialogue', '{"detail": "Example dialogue event", "value": 93}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (109, 'Event 4 (rest) occurred.', 4, 'rest', '{"detail": "Example rest event", "value": 95}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 8 (combat) occurred.', 8, 'combat', '{"detail": "Example combat event", "value": 82}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 7 (combat) occurred.', 7, 'combat', '{"detail": "Example combat event", "value": 67}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 8 (loot) occurred.', 8, 'loot', '{"detail": "Example loot event", "value": 88}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 6 (movement) occurred.', 6, 'movement', '{"detail": "Example movement event", "value": 93}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (138, 'Event 8 (rest) occurred.', 8, 'rest', '{"detail": "Example rest event", "value": 74}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (101, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 83}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 9 (combat) occurred.', 9, 'combat', '{"detail": "Example combat event", "value": 66}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (101, 'Event 5 (loot) occurred.', 5, 'loot', '{"detail": "Example loot event", "value": 23}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (113, 'Event 5 (dialogue) occurred.', 5, 'dialogue', '{"detail": "Example dialogue event", "value": 80}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (112, 'Event 4 (loot) occurred.', 4, 'loot', '{"detail": "Example loot event", "value": 62}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 7 (combat) occurred.', 7, 'combat', '{"detail": "Example combat event", "value": 32}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 9 (rest) occurred.', 9, 'rest', '{"detail": "Example rest event", "value": 24}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (137, 'Event 6 (loot) occurred.', 6, 'loot', '{"detail": "Example loot event", "value": 63}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 10 (combat) occurred.', 10, 'combat', '{"detail": "Example combat event", "value": 62}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (126, 'Event 6 (loot) occurred.', 6, 'loot', '{"detail": "Example loot event", "value": 23}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (130, 'Event 6 (loot) occurred.', 6, 'loot', '{"detail": "Example loot event", "value": 95}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (112, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 76}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (111, 'Event 10 (rest) occurred.', 10, 'rest', '{"detail": "Example rest event", "value": 58}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 10 (dialogue) occurred.', 10, 'dialogue', '{"detail": "Example dialogue event", "value": 14}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (119, 'Event 4 (movement) occurred.', 4, 'movement', '{"detail": "Example movement event", "value": 21}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 9 (rest) occurred.', 9, 'rest', '{"detail": "Example rest event", "value": 91}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 8 (rest) occurred.', 8, 'rest', '{"detail": "Example rest event", "value": 54}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (135, 'Event 5 (dialogue) occurred.', 5, 'dialogue', '{"detail": "Example dialogue event", "value": 47}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (129, 'Event 8 (movement) occurred.', 8, 'movement', '{"detail": "Example movement event", "value": 71}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 9 (dialogue) occurred.', 9, 'dialogue', '{"detail": "Example dialogue event", "value": 63}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (108, 'Event 6 (dialogue) occurred.', 6, 'dialogue', '{"detail": "Example dialogue event", "value": 10}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (119, 'Event 5 (movement) occurred.', 5, 'movement', '{"detail": "Example movement event", "value": 1}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (131, 'Event 9 (combat) occurred.', 9, 'combat', '{"detail": "Example combat event", "value": 38}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (105, 'Event 10 (combat) occurred.', 10, 'combat', '{"detail": "Example combat event", "value": 12}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 11 (dialogue) occurred.', 11, 'dialogue', '{"detail": "Example dialogue event", "value": 78}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 8 (movement) occurred.', 8, 'movement', '{"detail": "Example movement event", "value": 56}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 8 (dialogue) occurred.', 8, 'dialogue', '{"detail": "Example dialogue event", "value": 79}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 10 (rest) occurred.', 10, 'rest', '{"detail": "Example rest event", "value": 63}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (108, 'Event 7 (loot) occurred.', 7, 'loot', '{"detail": "Example loot event", "value": 23}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (139, 'Event 6 (loot) occurred.', 6, 'loot', '{"detail": "Example loot event", "value": 67}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 9 (rest) occurred.', 9, 'rest', '{"detail": "Example rest event", "value": 66}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (101, 'Event 6 (movement) occurred.', 6, 'movement', '{"detail": "Example movement event", "value": 88}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 10 (rest) occurred.', 10, 'rest', '{"detail": "Example rest event", "value": 72}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 11 (combat) occurred.', 11, 'combat', '{"detail": "Example combat event", "value": 17}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (139, 'Event 7 (loot) occurred.', 7, 'loot', '{"detail": "Example loot event", "value": 19}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (114, 'Event 12 (rest) occurred.', 12, 'rest', '{"detail": "Example rest event", "value": 31}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (103, 'Event 12 (loot) occurred.', 12, 'loot', '{"detail": "Example loot event", "value": 88}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (112, 'Event 6 (movement) occurred.', 6, 'movement', '{"detail": "Example movement event", "value": 31}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 9 (combat) occurred.', 9, 'combat', '{"detail": "Example combat event", "value": 59}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (128, 'Event 4 (rest) occurred.', 4, 'rest', '{"detail": "Example rest event", "value": 93}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (122, 'Event 10 (movement) occurred.', 10, 'movement', '{"detail": "Example movement event", "value": 89}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (104, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 61}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (107, 'Event 4 (movement) occurred.', 4, 'movement', '{"detail": "Example movement event", "value": 11}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (135, 'Event 6 (rest) occurred.', 6, 'rest', '{"detail": "Example rest event", "value": 17}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (133, 'Event 11 (combat) occurred.', 11, 'combat', '{"detail": "Example combat event", "value": 81}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (112, 'Event 7 (loot) occurred.', 7, 'loot', '{"detail": "Example loot event", "value": 72}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 10 (rest) occurred.', 10, 'rest', '{"detail": "Example rest event", "value": 65}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (135, 'Event 7 (dialogue) occurred.', 7, 'dialogue', '{"detail": "Example dialogue event", "value": 10}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (113, 'Event 6 (loot) occurred.', 6, 'loot', '{"detail": "Example loot event", "value": 25}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (107, 'Event 5 (movement) occurred.', 5, 'movement', '{"detail": "Example movement event", "value": 64}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (134, 'Event 7 (combat) occurred.', 7, 'combat', '{"detail": "Example combat event", "value": 100}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (120, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 11}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 9 (rest) occurred.', 9, 'rest', '{"detail": "Example rest event", "value": 19}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (125, 'Event 6 (rest) occurred.', 6, 'rest', '{"detail": "Example rest event", "value": 39}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 10 (loot) occurred.', 10, 'loot', '{"detail": "Example loot event", "value": 67}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (110, 'Event 4 (rest) occurred.', 4, 'rest', '{"detail": "Example rest event", "value": 39}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (101, 'Event 7 (movement) occurred.', 7, 'movement', '{"detail": "Example movement event", "value": 100}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (109, 'Event 5 (combat) occurred.', 5, 'combat', '{"detail": "Example combat event", "value": 87}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (134, 'Event 8 (movement) occurred.', 8, 'movement', '{"detail": "Example movement event", "value": 62}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (121, 'Event 6 (combat) occurred.', 6, 'combat', '{"detail": "Example combat event", "value": 76}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (121, 'Event 7 (movement) occurred.', 7, 'movement', '{"detail": "Example movement event", "value": 14}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (140, 'Event 11 (loot) occurred.', 11, 'loot', '{"detail": "Example loot event", "value": 2}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (104, 'Event 5 (movement) occurred.', 5, 'movement', '{"detail": "Example movement event", "value": 89}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (113, 'Event 7 (combat) occurred.', 7, 'combat', '{"detail": "Example combat event", "value": 81}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (118, 'Event 4 (dialogue) occurred.', 4, 'dialogue', '{"detail": "Example dialogue event", "value": 56}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (123, 'Event 10 (combat) occurred.', 10, 'combat', '{"detail": "Example combat event", "value": 82}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (124, 'Event 9 (movement) occurred.', 9, 'movement', '{"detail": "Example movement event", "value": 68}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (127, 'Event 11 (combat) occurred.', 11, 'combat', '{"detail": "Example combat event", "value": 93}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (117, 'Event 9 (dialogue) occurred.', 9, 'dialogue', '{"detail": "Example dialogue event", "value": 28}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (132, 'Event 11 (dialogue) occurred.', 11, 'dialogue', '{"detail": "Example dialogue event", "value": 2}');
INSERT INTO logs (campaign_id, message, event_number, event_type, event_data) VALUES (106, 'Event 11 (combat) occurred.', 11, 'combat', '{"detail": "Example combat event", "value": 56}');
