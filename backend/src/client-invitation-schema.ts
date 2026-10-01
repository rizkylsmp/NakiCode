export const clientInvitationSchema = `CREATE TABLE IF NOT EXISTS order_client_invitations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  email VARCHAR(160) NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_client_invitation_order (order_id),
  UNIQUE KEY uq_client_invitation_token (token_hash),
  CONSTRAINT fk_client_invitation_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
