export const digitalOfficeSchema = [
  `CREATE TABLE IF NOT EXISTS digital_office_workers (
    id CHAR(36) PRIMARY KEY, owner_id INT NOT NULL, name VARCHAR(100) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE, last_seen DATETIME NULL, revoked_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX office_worker_owner (owner_id)
  )`,
  `CREATE TABLE IF NOT EXISTS digital_office_missions (
    id CHAR(36) PRIMARY KEY, owner_id INT NOT NULL, instruction TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'planned',
    tasks JSON NOT NULL, report MEDIUMTEXT NULL, error VARCHAR(500) NULL,
    worker_id CHAR(36) NULL, lease_token CHAR(36) NULL, lease_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX office_mission_queue (owner_id, status, created_at)
  )`,
];
