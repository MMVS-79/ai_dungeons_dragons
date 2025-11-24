DROP TABLE IF EXISTS logs;
CREATE TABLE logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT, -- * used to be nullable for ON DELETE SET NULL
    message TEXT NOT NULL,
    event_number INT NOT NULL,
    event_type VARCHAR(50),
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
    UNIQUE (campaign_id, event_number)
);

DELIMITER $$
CREATE TRIGGER logs_campaign_id_not_null
BEFORE INSERT ON logs
FOR EACH ROW
BEGIN
  IF NEW.campaign_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'campaign_id cannot be NULL on insert';
  END IF;
END$$
DELIMITER ;
