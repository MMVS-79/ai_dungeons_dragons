-- seed.sql (BALANCED FOR 60-TURN CAMPAIGNS)
-- This seed provides balanced progression for ~50% win rate with strategic play

INSERT INTO accounts (email, created_at, updated_at)
VALUES ('test@example.com', NOW(), NOW());

-- ============================================================================
-- ENEMIES (Balanced for 60-turn progression)
-- ============================================================================
-- Difficulty Formula: event_number * 2 + (dice_roll - 10)
-- Turn 1-12: Easy (difficulty 0-30)
-- Turn 13-30: Medium (difficulty 35-65)
-- Turn 31-55: Hard (difficulty 70-110)
-- Turn 56-60: 5% chance special (300/500/700) OR hard enemies
-- Turn 61+: Boss forced (1000+)
-- ============================================================================

INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES
-- EASY (Difficulty 5-30) - Turns 1-12
('Giant Rat',     5, 15,  8, 1, '/characters/enemy/low/rat.png'),
('Zombie',       10, 25,  9, 2, '/characters/enemy/low/zombie.png'),
('Goblin',       15, 30, 10, 2, '/characters/enemy/low/goblin.png'),
('Mummy',        20, 35, 11, 3, '/characters/enemy/low/mummy.png'),
('Giant Spider', 25, 40, 13, 3, '/characters/enemy/low/spider.png'),

-- MEDIUM (Difficulty 35-65) - Turns 13-30
('Orc Warrior',  35, 50, 15, 5, '/characters/enemy/mid/orc.png'),
('Dark Wizard',  40, 45, 17, 4, '/characters/enemy/mid/dark_wizard.png'),
('Centaur',      45, 60, 16, 6, '/characters/enemy/mid/centaur.png'),
('Echidna',      50, 55, 18, 5, '/characters/enemy/mid/echidna.png'),
('Lesser Devil', 55, 65, 19, 6, '/characters/enemy/mid/devil.png'),
('Golem',        60, 75, 17, 8, '/characters/enemy/mid/golem.png'),
('Yeti',         65, 70, 22, 5, '/characters/enemy/mid/yeti.png'),

-- HARD (Difficulty 70-110) - Turns 31-55
('Troll',       75,  85, 24,  7, '/characters/enemy/high/troll.png'),
('Angel',       80,  90, 25,  8, '/characters/enemy/high/angel.png'),
('Cerberus',    85,  95, 26,  9, '/characters/enemy/high/cerberus.png'),
('Hydra',       90, 105, 27,  8, '/characters/enemy/high/hydra.png'),
('Vampire',     95, 100, 28,  9, '/characters/enemy/high/vampire.png'),
('Ghost',      100,  80, 30, 11, '/characters/enemy/high/ghost.png'),
('Cyclops',    105, 120, 29, 10, '/characters/enemy/high/cyclops.png'),
('Minotaur',   110, 130, 32, 10, '/characters/enemy/high/minotaur.png'),

-- BOSSES (Difficulty 1000+) - Turn 61+ forced
('Griffin',        1000, 250, 32, 16, '/characters/enemy/boss/griffin.png'),
('Chimera',        1001, 200, 38, 14, '/characters/enemy/boss/chimera.png'),
('Black Dragon',   1002, 220, 34, 18, '/characters/enemy/boss/black_dragon.png'),
('Ancient Dragon', 1003, 250, 38, 18, '/characters/enemy/boss/dragon.png'),
('Demon King',     1004, 300, 40, 20, '/characters/enemy/boss/demon_king.png'),

-- SPECIAL ENEMIES (5% chance turns 56-60)
('Santa Claus', 300, 400, 25, 11, '/characters/enemy/other/santa_claus.png'),  -- HP tank
('Genie',       500, 200, 20, 40, '/characters/enemy/other/genie.png'),        -- Defense specialist
('Zeus',        700, 180, 45, 12, '/characters/enemy/other/zeus.png');         -- Attack powerhouse

-- ============================================================================
-- RACES (Balanced base stats)
-- ============================================================================

INSERT INTO races (name, health, attack, defense, sprite_path) VALUES
('Human',  45,  7,  6, '/characters/player/human.png'),   -- Balanced: 45 HP, 7 ATK, 6 DEF
('Elf',    35,  9,  5, '/characters/player/elf.png'),     -- Glass cannon: 35 HP, 9 ATK, 5 DEF
('Dwarf',  50,  5,  8, '/characters/player/dwarf.png');   -- Tank: 50 HP, 5 ATK, 8 DEF

-- ============================================================================
-- CLASSES (Balanced base stats)
-- ============================================================================

INSERT INTO classes (name, health, attack, defense, sprite_path) VALUES
('Warrior', 40,  5,  5, '/characters/player/warrior.png'), -- Balanced: 40 HP, 5 ATK, 5 DEF
('Mage',    30,  8,  3, '/characters/player/warrior.png'), -- High damage: 30 HP, 8 ATK, 3 DEF
('Rogue',   35,  6,  4, '/characters/player/warrior.png'); -- Balanced agile: 35 HP, 6 ATK, 4 DEF

-- Starting combinations (Race + Class):
-- Human Warrior: 85 HP, 12 ATK, 11 DEF (most balanced)
-- Elf Mage: 65 HP, 17 ATK, 8 DEF (glass cannon)
-- Dwarf Warrior: 90 HP, 10 ATK, 13 DEF (tank)
-- etc.

-- ============================================================================
-- CONSUMABLE ITEMS (Progressive scaling)
-- ============================================================================

INSERT INTO items (name, rarity, stat_modified, stat_value, description, sprite_path) VALUES
-- HEALTH POTIONS (Progression: early -> late game)
('Minor Health Potion',     5,  'health', 15, 'Restores 15 HP', '/drops/items/minor_health_potion.png'),
('Health Potion',          20,  'health', 25, 'Restores 25 HP', '/drops/items/health_potion.png'),
('Greater Health Potion',  40,  'health', 40, 'Restores 40 HP', '/drops/items/greater_health_potion.png'),
('Superior Health Potion', 60,  'health', 60, 'Restores 60 HP', '/drops/items/superior_health_potion.png'),
('Ultimate Health Potion', 85,  'health',100, 'Restores 100 HP', '/drops/items/ultimate_health_potion.png'),

-- ATTACK BUFFS (Temporary combat bonuses)
('Strength Berries',        10, 'attack',  3, 'Temporarily increases attack by 3', '/drops/items/strength_berries.png'),
('Strength Scroll',         30, 'attack',  5, 'Temporarily increases attack by 5', '/drops/items/strength_scroll.png'),
('Greater Strength Scroll', 50, 'attack',  8, 'Temporarily increases attack by 8', '/drops/items/greater_strength_scroll.png'),
('Berserker Elixir',        70, 'attack', 12, 'Temporarily increases attack by 12', '/drops/items/berserker_potion.png'),
('Titan Elixir',            90, 'attack', 15, 'Temporarily increases attack by 15', '/drops/items/titan_potion.png'),

-- DEFENSE BUFFS (Temporary combat bonuses)
('Fortifying Ginger',         10, 'defense',  3, 'Temporarily increases defense by 3', '/drops/items/fortifying_ginger.png'),
('Protection Scroll',         30, 'defense',  5, 'Temporarily increases defense by 5', '/drops/items/protection_scroll.png'),
('Greater Protection Scroll', 50, 'defense',  8, 'Temporarily increases defense by 8', '/drops/items/greater_protection_scroll.png'),
('Stone Skin Elixir',         70, 'defense', 10, 'Temporarily increases defense by 10', '/drops/items/sturdy_potion.png'),
('Invulnerability Elixir',    90, 'defense', 15, 'Temporarily increases defense by 15', '/drops/items/invulnerability_potion.png'),

-- CURSED ITEMS (Roll 1-6 on item drop events)
('Cursed Vial',      -15,  'health', -10, 'A toxic vial that damages you', '/drops/items/cursed_vial.png'),
('Cursed Jug',       -30,  'health', -30, 'A toxic jug that severely damages you', '/drops/items/cursed_jug.png'),
('Cursed Skull',     -15,  'attack',  -5, 'Temporarily reduces attack by 5', '/drops/items/cursed_skull.png'),
('Demonic Skull',    -45,  'attack', -12, 'Temporarily reduces attack by 12', '/drops/items/demonic_skull.png'),
('Cursed Gem',       -15,  'defense', -5, 'Temporarily reduces defense by 5', '/drops/items/cursed_gem.png'),
('Large Cursed Gem', -45,  'defense',-12, 'Temporarily reduces defense by 12', '/drops/items/large_cursed_gem.png');

-- ============================================================================
-- WEAPONS (Progressive power scaling)
-- ============================================================================

INSERT INTO weapons (name, rarity, attack, description, sprite_path) VALUES
-- COMMON (5-18 rarity) - Early game
('Rusty Sword',   5,  3, 'A worn blade barely holding together', '/drops/weapons/rusty_sword.png'),
('Wooden Club',   8,  4, 'A simple wooden weapon', '/drops/weapons/wooden_club.png'),
('Iron Dagger',  12,  5, 'A basic iron blade', '/drops/weapons/iron_dagger.png'),
('Bronze Sword', 18,  6, 'A decent bronze blade', '/drops/weapons/bronze_sword.png'),

-- UNCOMMON (25-35 rarity) - Mid game
('Steel Sword',      25,  8, 'A well-crafted steel blade', '/drops/weapons/steel_sword.png'),
('Battle Axe',       30, 10, 'A heavy axe for brutal strikes', '/drops/weapons/battle_axe.png'),
('Enchanted Dagger', 35, 11, 'A dagger with minor enchantments', '/drops/weapons/enchanted_dagger.png'),

-- RARE (45-55 rarity) - Late mid game
('Flamebrand Sword', 45, 13, 'A sword wreathed in flames', '/drops/weapons/flamebrand_sword.png'),
('Frost Axe',        50, 15, 'An axe that freezes enemies', '/drops/weapons/frost_axe.png'),
('Lightning Spear',  55, 16, 'A spear crackling with electricity', '/drops/weapons/lightning_spear.png'),

-- EPIC (65-75 rarity) - Late game
('Dragon Slayer', 65, 18, 'Forged to slay dragons', '/drops/weapons/dragon_slayer.png'),
('Shadowblade',   70, 20, 'A blade forged in darkness', '/drops/weapons/shadowblade.png'),
('Holy Avenger',  75, 22, 'A blessed weapon of righteousness', '/drops/weapons/holy_avenger.png'),

-- LEGENDARY (85-95 rarity) - End game
('Excalibur', 85, 25, 'The legendary sword of kings', '/drops/weapons/excalibur.png'),
('Mjolnir',   95, 30, 'The hammer of thunder gods', '/drops/weapons/mjolnir.png'),

-- SPECIAL (700 rarity) - Zeus reward (CANNOT BE REPLACED)
('Zeus Lightning', 700, 50, 'Zeus Pure Destructive Thunderbolt', '/drops/weapons/zeus_lightning.png');

-- ============================================================================
-- ARMOURS (Progressive HP scaling)
-- ============================================================================

INSERT INTO armours (name, rarity, health, description, sprite_path) VALUES
-- COMMON (5-18 rarity) - Early game
('Cloth Rags',       5, 10, 'Barely offers protection', '/drops/armours/cloth_rags.png'),
('Leather Tunic',   10, 15, 'Basic leather protection', '/drops/armours/leather_tunic.png'),
('Studded Leather', 15, 20, 'Reinforced leather armour', '/drops/armours/studded_leather.png'),

-- UNCOMMON (25-35 rarity) - Mid game
('Chainmail',      25, 30, 'Interlocking metal rings', '/drops/armours/chainmail.png'),
('Scale Mail',     30, 35, 'Overlapping metal scales', '/drops/armours/scale_mail.png'),
('Breastplate',    35, 40, 'Solid metal chest protection', '/drops/armours/breastplate.png'),

-- RARE (45-55 rarity) - Late mid game
('Enchanted Armour',     45, 50, 'Magically reinforced armour', '/drops/armours/enchanted_armour.png'),
('Dragon Scale Armour',  50, 60, 'Armour made from dragon scales', '/drops/armours/dragon_scale_armour.png'),
('Mithril Plate',        55, 65, 'Lightweight but incredibly strong', '/drops/armours/mithril_plate.png'),

-- EPIC (65-75 rarity) - Late game
('Demon Plate',      65, 75, 'Forged in the depths of hell', '/drops/armours/demon_plate.png'),
('Celestial Armour', 70, 85, 'Blessed by the heavens', '/drops/armours/celestial_armour.png'),
('Titan Plate',      75, 95, 'Armour fit for giants', '/drops/armours/titan_plate.png'),

-- LEGENDARY (85-95 rarity) - End game
('Aegis of Immortality', 85, 110, 'Nearly indestructible protection', '/drops/armours/aegis_of_immortality.png'),
('Divine Raiment',       95, 130, 'Armour of the gods themselves', '/drops/armours/divine_raiment.png'),

-- SPECIAL (300 rarity) - Santa reward (CANNOT BE REPLACED)
('Santas Robe', 300, 250, 'Santas Legendary Robe', '/drops/armours/santas_robe.png');

-- ============================================================================
-- SHIELDS (Progressive defense scaling)
-- ============================================================================

INSERT INTO shields (name, rarity, defense, description, sprite_path) VALUES
-- COMMON (5-18 rarity) - Early game
('Wooden Shield',  5, 2, 'A basic wooden shield', '/drops/shields/wooden_shield.png'),
('Iron Buckler',  10, 3, 'A small iron shield', '/drops/shields/iron_buckler.png'),
('Kite Shield',   15, 4, 'A standard combat shield', '/drops/shields/kite_shield.png'),

-- UNCOMMON (25-35 rarity) - Mid game
('Steel Shield',  25, 6, 'A reinforced steel shield', '/drops/shields/steel_shield.png'),
('Tower Shield',  30, 7, 'A massive defensive shield', '/drops/shields/tower_shield.png'),
('Spiked Shield', 35, 8, 'Can deflect and counter attacks', '/drops/shields/spiked_shield.png'),

-- RARE (45-55 rarity) - Late mid game
('Enchanted Shield',    45, 10, 'Magically enhanced defense', '/drops/shields/enchanted_shield.png'),
('Dragon Scale Shield', 50, 12, 'Made from dragon hide', '/drops/shields/dragon_scale_shield.png'),
('Mirror Shield',       55, 13, 'Reflects magical attacks', '/drops/shields/mirror_shield.png'),

-- EPIC (65-75 rarity) - Late game
('Shield of the Ancients', 65, 15, 'A relic from a lost civilization', '/drops/shields/shield_of_the_ancients.png'),
('Aegis Shield',           70, 17, 'The shield of heroes', '/drops/shields/aegis_shield.png'),
('Bulwark of Eternity',    75, 19, 'An unbreakable defense', '/drops/shields/bulwark_of_eternity.png'),

-- LEGENDARY (85-95 rarity) - End game
('Shield of the Gods', 85, 22, 'Divine protection incarnate', '/drops/shields/shield_of_the_gods.png'),
('Infinity Shield',    95, 25, 'Absolute defensive power', '/drops/shields/infinity_shield.png'),

-- SPECIAL (500 rarity) - Santa reward (CANNOT BE REPLACED)
('Caps Shield', 500, 50, 'The Stars and Stripes of America', '/drops/shields/caps_shield.png');

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================

INSERT INTO campaigns (account_id, name, description, state) VALUES
(1, 'The Quest for the Ancient Relic', 'A brave warrior seeks to recover the lost artifact of power', 'active'),
(1, 'Mystic Shadows',                  'An elven mage explores the dark depths of forbidden magic',   'active'),
(1, 'Underground Kingdoms',            'A dwarven rogue navigates treacherous underground passages', 'active'),
(1, 'The Last Stand',                  'A veteran campaign nearing its epic conclusion',             'active');

-- ============================================================================
-- CHARACTERS
-- ============================================================================

INSERT INTO characters (
    campaign_id,
    race_id,
    class_id,
    name,
    current_health,
    max_health,
    attack,
    defense
) VALUES
-- Campaign 1: Human Warrior
(1, 1, 1, 'Aragorn the Brave', 220, 220, 25, 20),

-- Campaign 2: Elf Mage
(2, 2, 2, 'Elara Moonwhisper', 150, 150, 40, 10),

-- Campaign 3: Dwarf Rogue
(3, 3, 3, 'Thorin Ironfoot', 210, 210, 28, 23),

-- Campaign 4: Human Mage
(4, 1, 2, 'Gandalf the Wise', 170, 170, 35, 15);
