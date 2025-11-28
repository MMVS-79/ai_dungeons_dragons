DROP TABLE IF EXISTS campaigns;

CREATE TABLE campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    state VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

DELIMITER $$

CREATE TRIGGER campaigns_limit_before_insert
BEFORE INSERT ON campaigns
FOR EACH ROW
BEGIN
    DECLARE cnt INT;
    SELECT COUNT(*) INTO cnt
    FROM campaigns
    WHERE account_id = NEW.account_id;

    IF cnt >= 5 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Limit of 5 campaigns per account exceeded';
    END IF;
END $$

DELIMITER ;
