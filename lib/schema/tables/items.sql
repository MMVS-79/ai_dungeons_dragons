DROP TABLE IF EXISTS items;
CREATE TABLE items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    rarity INT NOT NULL,
    stat_modified VARCHAR(50) NOT NULL, -- 'health', 'attack', 'defense'
    stat_value INT NOT NULL, -- Can be positive or negative
    description TEXT,
    sprite_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rarity (rarity)
);
