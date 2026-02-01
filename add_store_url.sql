-- Add store_url column to store_management table
ALTER TABLE store_management 
ADD COLUMN IF NOT EXISTS store_url TEXT;

-- Verify the column was added
SELECT * 
FROM information_schema.columns 
WHERE table_name = 'store_management' 
  AND column_name = 'store_url';
