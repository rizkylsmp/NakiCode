-- Add source_code column to templates table
-- This migration adds a separate field for source code file references

ALTER TABLE templates
ADD COLUMN source_code JSON NOT NULL DEFAULT ('[]') AFTER included_files;
