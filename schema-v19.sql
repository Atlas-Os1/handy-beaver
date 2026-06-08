-- v19: Add source column to messages table for tracking message origin
-- Supports: portal, email, voice, whatsapp, lil-beaver, forwarded
ALTER TABLE messages ADD COLUMN source TEXT DEFAULT 'portal';
