import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpkggfibwreznussudfh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwa2dnZmlid3JlempudXNzdWRmaCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI1NTQxMDcyLCJleHAiOjE4ODMyMzA2NzJ9.W5-4FEqzb6O4FgdMJjHLbQqRLCsJ-pP8SkEe9FpNUgk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReviews() {
  try {
    // Get reviews for Orchardleigh House listing (ID: 80af17a5-71d8-4178-8c91-abc6d43a299c)
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', '80af17a5-71d8-4178-8c91-abc6d43a299c')
      .eq('moderation_status', 'approved');
    
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Reviews found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('First review:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('No approved reviews found for this listing');
      }
    }
  } catch (err) {
    console.log('Exception:', err.message);
  }
}

checkReviews();
