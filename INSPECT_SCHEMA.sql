-- Inspect Schema
-- Run this to see the actual columns of the 'trash' table

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trash';
