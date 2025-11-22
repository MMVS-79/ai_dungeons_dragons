DROP TABLE IF EXISTS characters;
CREATE TABLE characters (
    id INT PRIMARY KEY AUTO_INCREMENT,
    race_id INT NOT NULL,
    class_id INT NOT NULL,
    campaign_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    current_health INT NOT NULL,
    vitality INT NOT NULL,
    attack INT NOT NULL,
    defense INT NOT NULL,
    sprite_path VARCHAR(255),
    armour_id INT DEFAULT NULL,
    weapon_id INT DEFAULT NULL,
    shield_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races (id) ON DELETE RESTRICT,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE RESTRICT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
    FOREIGN KEY (armour_id) REFERENCES armours (id) ON DELETE RESTRICT,
    FOREIGN KEY (weapon_id) REFERENCES weapons (id) ON DELETE RESTRICT,
    FOREIGN KEY (shield_id) REFERENCES shields (id) ON DELETE RESTRICT
)
