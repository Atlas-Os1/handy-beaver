-- v18: Add Cloudinary fallback URL to job_media
-- When R2 is unavailable, the serve route redirects to cloudinary_url

ALTER TABLE job_media ADD COLUMN cloudinary_url TEXT;
ALTER TABLE job_media ADD COLUMN cloudinary_public_id TEXT;
