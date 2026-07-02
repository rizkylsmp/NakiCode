-- Add lynk_url column to templates table
-- This migration adds support for Lynk payment links

ALTER TABLE templates
ADD COLUMN lynk_url VARCHAR(500) NULL AFTER demo_url;
