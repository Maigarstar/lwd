import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from('listings')
  .select('id,name,venue_name,slug,status,visibility,country,region,city,capacity,rooms_total,rooms_suites,dining_in_house,exclusive_use_enabled,wedding_weekend_enabled,faq_enabled,seo_title,spaces,media_items,faq_categories')
  .eq('slug', 'grand-tirolia')
  .single();

if (error) { console.error(error.message); process.exit(1); }

console.log('\n✅ GRAND TIROLIA LISTING — VERIFICATION');
console.log('━'.repeat(55));

const scalar = ['id','name','venue_name','slug','status','visibility','country','region','city','capacity','rooms_total','rooms_suites','dining_in_house','exclusive_use_enabled','wedding_weekend_enabled','faq_enabled','seo_title'];
scalar.forEach(k => console.log('  ' + k.padEnd(30) + JSON.stringify(data[k])));

console.log('\n  spaces count:             ' + (data.spaces?.length ?? 0));
console.log('  media_items count:        ' + (data.media_items?.length ?? 0));
console.log('  faq_categories count:     ' + (data.faq_categories?.length ?? 0));

console.log('\n  Spaces:');
(data.spaces || []).forEach(s => console.log('    - ' + s.name + ' (capacity_seated: ' + s.capacity_seated + ')'));

console.log('\n  First media item:');
console.log('    ' + JSON.stringify(data.media_items?.[0] ?? null));
