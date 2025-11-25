-- ============================================================================
-- ENEMIES (Difficulty-based system)
-- ============================================================================

INSERT INTO enemies (name, difficulty, health, attack, defense, sprite_path) VALUES
-- LOW DIFFICULTY (0-30)
('Giant Rat', 5, 15, 11, 1, '/characters/enemy/low/rat.png'),
('Zombie', 10, 25, 12, 2, '/characters/enemy/low/zombie.png'),
('Goblin', 15, 30, 13, 2, '/characters/enemy/low/goblin.png'),
('Mummy', 20, 35, 14, 3, '/characters/enemy/low/mummy.png'),
('Giant Spider', 25, 40, 15, 3, '/characters/enemy/low/spider.png'),

-- MID DIFFICULTY (31-70)
('Orc Warrior', 35, 50, 18, 5, '/characters/enemy/mid/orc.png'),
('Dark Wizard', 45, 45, 20, 4, '/characters/enemy/mid/dark_wizard.png'),
('Centaur', 50, 60, 19, 6, '/characters/enemy/mid/centaur.png'),
('Echidna', 55, 55, 21, 5, '/characters/enemy/mid/echidna.png'),
('Lesser Devil', 65, 70, 22, 7, '/characters/enemy/mid/devil.png'),

-- HIGH DIFFICULTY (71-110)
('Troll', 75, 90, 24, 9, '/characters/enemy/high/troll.png'),
('Vampire', 80, 85, 26, 8, '/characters/enemy/high/vampire.png'),
('Ghost', 85, 70, 28, 10, '/characters/enemy/high/ghost.png'),
('Cyclops', 95, 110, 27, 10, '/characters/enemy/high/cyclops.png'),
('Minotaur', 105, 120, 29, 11, '/characters/enemy/high/minotaur.png'),

-- BOSSES (1000+)
('Griffin', 1000, 180, 30, 14, '/characters/enemy/boss/griffin.png'),
('Chimera', 1001, 200, 32, 15, '/characters/enemy/boss/chimera.png'),
('Black Dragon', 1002, 220, 34, 16, '/characters/enemy/boss/black_dragon.png'),
('Ancient Dragon', 1003, 250, 34, 16, '/characters/enemy/boss/dragon.png');

-- ============================================================================
-- RACES
-- ============================================================================
INSERT INTO races (name, health, attack, defense, sprite_path) VALUES
('Human', 100, 10, 10, '/characters/player/human.png'),
('Elf', 80, 15, 5, '/characters/player/elf.png'),
('Dwarf', 120, 8, 15, '/characters/player/dwarf.png');

-- ============================================================================
-- CLASSES
-- ============================================================================
INSERT INTO classes (name, health, attack, defense, sprite_path) VALUES
('Warrior', 120, 15, 10, '/characters/player/warrior.png'),
('Mage', 70, 25, 5, '/characters/player/mage.png'),
('Rogue', 90, 20, 8, '/characters/player/rogue.png');

-- ============================================================================
-- ITEMS
-- ============================================================================

INSERT INTO items (name, rarity, stat_modified, stat_value, description, sprite_path) VALUES
-- HEALTH POTIONS (0-90 rarity range)
('Minor Health Potion', 5, 'health', 15, 'Restores 15 HP', '/items/minor_health_potion.png'),
('Health Potion', 20, 'health', 25, 'Restores 25 HP', '/items/health_potion.png'),
('Greater Health Potion', 40, 'health', 40, 'Restores 40 HP', '/items/greater_health_potion.png'),
('Superior Health Potion', 60, 'health', 60, 'Restores 60 HP', '/items/superior_health_potion.png'),
('Ultimate Health Potion', 85, 'health', 100, 'Restores 100 HP', '/items/ultimate_health_potion.png'
),

-- ATTACK BUFFS (Scrolls/Elixirs - Temporary combat boost)
('Strength Berries', 10, 'attack', 3, 'Temporarily increases attack by 3', '/items/strength_berries.png'),
('Strength Scroll', 30, 'attack', 5, 'Temporarily increases attack by 5', '/items/strength_scroll.png'),
('Greater Strength Scroll', 50, 'attack', 8, 'Temporarily increases attack by 8', '/items/greater_strength_scroll.png'),
('Berserker Elixir', 70, 'attack', 12, 'Temporarily increases attack by 12', '/items/berserker_potion.png'),
('Titan Elixir', 90, 'attack', 15, 'Temporarily increases attack by 15', '/items/titan_potion.png'),

-- DEFENSE BUFFS (Temporary combat boost)
('Fortifying Ginger', 10, 'defense', 3, 'Temporarily increases defense by 3', '/items/fortifying_ginger.png'),
('Protection Scroll', 30, 'defense', 5, 'Temporarily increases defense by 5', '/items/protection_scroll.png'),
('Greater Protection Scroll', 50, 'defense', 8, 'Temporarily increases defense by 8', '/items/greater_protection_scroll.png'),
('Stone Skin Elixir', 70, 'defense', 10, 'Temporarily increases defense by 10', '/items/sturdy_potion.png'),
('Invulnerability Elixir', 90, 'defense', 15, 'Temporarily increases defense by 15', '/items/invulnerability_potion.png'),

-- CURSED ITEMS (Negative stats - clogs inventory)
('Cursed Vial', 5, 'health', -10, 'A toxic vial that damages you', '/items/placeholder.png'),
('Weakness Curse', 15, 'attack', -5, 'Temporarily reduces attack by 3', '/items/placeholder.png'),
('Fragility Curse', 15, 'defense', -5, 'Temporarily reduces defense by 3', '/items/fragility_curse.png');

-- ============================================================================
-- WEAPONS
-- ============================================================================

INSERT INTO weapons (name, rarity, attack, description, sprite_path) VALUES
-- COMMON (0-20)
('Rusty Sword', 5, 3, 'A worn blade barely holding together', '/items/common_sword.png'),
('Wooden Club', 8, 4, 'A simple wooden weapon', '/items/common_sword.png'),
('Iron Dagger', 12, 5, 'A basic iron blade', '/items/common_sword.png'),
('Bronze Sword', 18, 6, 'A decent bronze blade', '/items/common_sword.png'),

-- UNCOMMON (21-40)
('Steel Sword', 25, 8, 'A well-crafted steel blade', '/items/rare_sword.png'),
('Battle Axe', 30, 10, 'A heavy axe for brutal strikes', '/items/rare_sword.png'),
('Enchanted Dagger', 35, 11, 'A dagger with minor enchantments', '/items/rare_sword.png'),

-- RARE (41-60)
('Flamebrand Sword', 45, 13, 'A sword wreathed in flames', '/items/rare_sword.png'),
('Frost Axe', 50, 15, 'An axe that freezes enemies', '/items/epic_sword.png'),
('Lightning Spear', 55, 16, 'A spear crackling with electricity', '/items/epic_sword.png'),

-- EPIC (61-80)
('Dragon Slayer', 65, 18, 'Forged to slay dragons', '/items/epic_sword.png'),
('Shadowblade', 70, 20, 'A blade forged in darkness', '/items/epic_sword.png'),
('Holy Avenger', 75, 22, 'A blessed weapon of righteousness', '/items/epic_sword.png'),

-- LEGENDARY (81+)
('Excalibur', 85, 25, 'The legendary sword of kings', '/items/placeholder.png'),
('Mjolnir', 95, 28, 'The hammer of thunder gods', '/items/placeholder.png');

-- ============================================================================
-- ARMOURS (Rarity-based system)
-- ============================================================================

INSERT INTO armours (name, rarity, health, description, sprite_path) VALUES
-- COMMON (0-20)
('Cloth Rags', 5, 10, 'Barely offers protection', '/items/common_armour.png'),
('Leather Tunic', 10, 15, 'Basic leather protection', '/items/common_armour.png'),
('Studded Leather', 15, 20, 'Reinforced leather armor', '/items/common_armour.png'),

-- UNCOMMON (21-40)
('Chainmail', 25, 30, 'Interlocking metal rings', '/items/rare_armour.png'),
('Scale Mail', 30, 35, 'Overlapping metal scales', '/items/rare_armour.png'),
('Breastplate', 35, 40, 'Solid metal chest protection', '/items/rare_armour.png'),

-- RARE (41-60)
('Enchanted Chainmail', 45, 50, 'Magically reinforced armor', '/items/rare_armour.png'),
('Dragon Scale Armor', 50, 60, 'Armor made from dragon scales', '/items/epic_armour.png'),
('Mithril Plate', 55, 65, 'Lightweight but incredibly strong', '/items/epic_armour.png'),

-- EPIC (61-80)
('Demon Plate', 65, 75, 'Forged in the depths of hell', '/items/epic_armour.png'),
('Celestial Armor', 70, 85, 'Blessed by the heavens', '/items/epic_armour.png'),
('Titan Plate', 75, 95, 'Armor fit for giants', '/items/epic_armour.png'),

-- LEGENDARY (81+)
('Aegis of Immortality', 85, 110, 'Nearly indestructible protection', '/items/placeholder.png'),
('Divine Raiment', 95, 130, 'Armor of the gods themselves', '/items/placeholder.png');

-- ============================================================================
-- SHIELDS (Rarity-based system)
-- ============================================================================

INSERT INTO shields (name, rarity, defense, description, sprite_path) VALUES
-- COMMON (0-20)
('Wooden Shield', 5, 2, 'A basic wooden shield', '/items/common_shield.png'),
('Iron Buckler', 10, 3, 'A small iron shield', '/items/common_shield.png'),
('Kite Shield', 15, 4, 'A standard combat shield', '/items/common_shield.png'),

-- UNCOMMON (21-40)
('Steel Shield', 25, 6, 'A reinforced steel shield', '/items/rare_shield.png'),
('Tower Shield', 30, 7, 'A massive defensive shield', '/items/rare_shield.png'),
('Spiked Shield', 35, 8, 'Can deflect and counter attacks', '/items/rare_shield.png'),

-- RARE (41-60)
('Enchanted Shield', 45, 10, 'Magically enhanced defense', '/items/rare_shield.png'),
('Dragon Scale Shield', 50, 12, 'Made from dragon hide', '/items/epic_shield.png'),
('Mirror Shield', 55, 13, 'Reflects magical attacks', '/items/epic_shield.png'),

-- EPIC (61-80)
('Shield of the Ancients', 65, 15, 'A relic from a lost civilization', '/items/epic_shield.png'),
('Aegis Shield', 70, 17, 'The shield of heroes', '/items/epic_shield.png'),
('Bulwark of Eternity', 75, 19, 'An unbreakable defense', '/items/epic_shield.png'),

-- LEGENDARY (81+)
('Shield of the Gods', 85, 22, 'Divine protection incarnate', '/items/placeholder.png'),
('Infinity Shield', 95, 25, 'Absolute defensive power', '/items/placeholder.png');
