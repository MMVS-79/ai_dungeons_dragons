-- Seed admin user
INSERT INTO accounts (email) VALUES ('admin@example.com');

-- Seed enemies
INSERT INTO enemies (name, health, attack, defense, sprite_path) VALUES
('Goblin', 30, 5, 2, 'sprites/goblin.png'),
('Orc', 50, 10, 5, 'sprites/orc.png'),
('Dragon', 200, 25, 15, 'sprites/dragon.png');

-- Seed Races
INSERT INTO races (name, health, attack, defense, sprite_path) VALUES
('Human', 100, 10, 10, 'sprites/human.png'),
('Elf', 80, 15, 5, 'sprites/elf.png'),
('Dwarf', 120, 8, 15, 'sprites/dwarf.png');

-- Seed Classes
INSERT INTO classes (name, health, attack, defense, sprite_path) VALUES
('Warrior', 120, 15, 10, 'sprites/warrior.png'),
('Mage', 70, 25, 5, 'sprites/mage.png'),
('Rogue', 90, 20, 8, 'sprites/rogue.png');

-- Seed Items
INSERT INTO items (name, health, description, sprite_path) VALUES
('Small Health Potion', 50, 'Restores 50 health points.', 'sprites/health_potion.png'),
('Large Health Potion', 100, 'Restores 100 health points.', 'sprites/large_health_potion.png');

-- Seed Weapons
INSERT INTO weapons (name, attack, description, sprite_path) VALUES
('Short Sword', 10, 'A basic short sword.', 'sprites/short_sword.png'),
('Long Bow', 15, 'A long-range bow.', 'sprites/long_bow.png'),
('Staff of Fire', 20, 'A magical staff that shoots fire.', 'sprites/staff_of_fire.png');

-- Seed Armours
INSERT INTO armours (name, health, description, sprite_path) VALUES
('Leather Armour', 20, 'Basic leather armour.', 'sprites/leather_armour.png'),
('Chainmail', 40, 'Sturdy chainmail armour.', 'sprites/chainmail.png'),
('Plate Armour', 60, 'Heavy plate armour.', 'sprites/plate_armour.png');

-- Seed Shields
INSERT INTO shields (name, defense, description, sprite_path) VALUES
('Wooden Shield', 5, 'A basic wooden shield.', 'sprites/wooden_shield.png'),
('Iron Shield', 10, 'A sturdy iron shield.', 'sprites/iron_shield.png'),
('Dragon Shield', 20, 'A shield made from dragon scales.', 'sprites/dragon_shield.png');
