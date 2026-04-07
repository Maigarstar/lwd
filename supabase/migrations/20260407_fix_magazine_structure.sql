-- Fix Magazine Navigation Structure
-- Magazine should be a LINK to /magazine
-- Featured Stories should be a MEGA menu directly under Magazine
-- All magazine categories should be children of Featured Stories

-- First, get the IDs we need
-- Magazine ID: a0000001-0000-0000-0000-000000000006
-- Destinations ID: we need to find it

-- Find Magazine and Featured Stories IDs
SELECT id, label, parent_id, type 
FROM nav_items 
WHERE label IN ('Magazine', 'Featured Stories', 'Destinations') 
AND parent_id IS NULL OR parent_id = 'a0000001-0000-0000-0000-000000000006'
ORDER BY label;
