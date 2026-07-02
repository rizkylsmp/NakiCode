-- Add cover_image column to blog_posts table
-- This migration adds support for blog post cover images

ALTER TABLE blog_posts
ADD COLUMN cover_image VARCHAR(500) NULL AFTER author;
