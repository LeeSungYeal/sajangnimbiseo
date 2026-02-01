-- Enable Row Level Security
ALTER TABLE store_management ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own data
CREATE POLICY "Users can insert their own stores" 
ON store_management 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view their own stores
CREATE POLICY "Users can view their own stores" 
ON store_management 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'store_management';
