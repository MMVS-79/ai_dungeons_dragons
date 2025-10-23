SET FOREIGN_KEY_CHECKS=0;

-- Accounts table
source schema/tables/accounts.sql;

-- Campaigns table and related tables
source schema/tables/campaigns.sql;
source schema/tables/chats.sql;
source schema/tables/logs.sql;

-- Unit tables
source schema/tables/races.sql;
source schema/tables/classes.sql;
source schema/tables/enemies.sql;
source schema/tables/characters.sql;

-- Inventory tables
source schema/tables/items.sql;
source schema/tables/armours.sql;
source schema/tables/weapons.sql;
source schema/tables/shields.sql;

-- Junction tables for character inventory
source schema/tables/character_items.sql;
source schema/tables/character_armours.sql;
source schema/tables/character_weapons.sql;
source schema/tables/character_shields.sql;

SET FOREIGN_KEY_CHECKS=1;