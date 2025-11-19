-- Seed admin user
INSERT INTO accounts (email) VALUES ('admin@example.com');

-- Seed enemies
INSERT INTO enemies (name, health, attack, defense, sprite_path, is_boss) VALUES
('Goblin', 30, 5, 2, '/characters/enemy/low/goblin.png', 0),
('Orc', 50, 10, 5, '/characters/enemy/mid/orc.png', 0),
('Dragon', 200, 25, 15, '/characters/enemy/boss/dragon.png', 1);

-- Seed Races
INSERT INTO races (name, health, attack, defense, sprite_path) VALUES
('Human', 100, 10, 10, '/characters/player/human.png'),
('Elf', 80, 15, 5, '/characters/player/elf.png'),
('Dwarf', 120, 8, 15, '/characters/player/dwarf.png');

-- Seed Classes
INSERT INTO classes (name, health, attack, defense, sprite_path) VALUES
('Warrior', 120, 15, 10, '/characters/player/warrior.png'),
('Mage', 70, 25, 5, '/characters/player/mage.png'),
('Rogue', 90, 20, 8, '/characters/player/rogue.png');

-- Seed Items
INSERT INTO items (name, health, description, sprite_path) VALUES
('Small Health Potion', 20, 'Restores 20 health points.', '/items/green_potion.png'),
('Large Health Potion', 50, 'Restores 50 health points.', '/items/red_potion.png');

-- Seed Weapons
INSERT INTO weapons (name, attack, description, sprite_path, rarity) VALUES
('Common Sword', 10, 'A basic wood sword.', '/items/common_sword.png', 0),
('Rare Sword', 15, 'A well made steel sword.', '/items/rare_sword.png', 1),
('Epic Sword', 25, 'An epic sword forged by a great blacksmith.', '/items/epic_sword.png', 2);

-- Seed Armours
INSERT INTO armours (name, health, description, sprite_path, rarity) VALUES
('Common Armour', 20, 'Basic leather armour.', '/items/common_armour.png', 0),
('Rare Armour', 40, 'Sturdy Steel Chestplate.', '/items/rare_armour.png', 1),
('Epic Armour', 60, 'Heavy plated epic armour.', '/items/epic_armour.png', 2);

-- Seed Shields
INSERT INTO shields (name, defense, description, sprite_path, rarity) VALUES
('Common Shield', 5, 'A basic wooden shield.', '/items/common_shield.png', 0),
('Rare Shield', 10, 'A sturdy iron shield.', '/items/rare_shield.png', 1),
('Epic Shield', 20, 'A shield made from dragon scales.', '/items/epic_shield.png', 2);
