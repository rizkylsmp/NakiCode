-- Add max_redemptions column to coupons table
-- Coupons can now expire either by date or by usage limit.

ALTER TABLE coupons
ADD COLUMN max_redemptions INT NULL AFTER expires_at;
