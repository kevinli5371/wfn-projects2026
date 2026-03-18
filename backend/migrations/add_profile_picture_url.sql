-- Add profile_picture_url to users if it doesn't exist (fixes PGRST204 on login)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT DEFAULT '';
