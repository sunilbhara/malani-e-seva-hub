import 'dotenv/config'
import { createClient } from '@supabase/supabase-js';
import { slugify } from 'transliteration';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uniqueSlugFor(title, id) {
  const base = slugify(title || '', { lowercase: true, separator: '-' }).replace(/(^-+|-+$)/g, '');
  const safeBase = base || 'post';
  let candidate = safeBase;
  let i = 1;
  while (true) {
    const { data, error } = await supabase.from('posts').select('id').eq('slug', candidate).limit(1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    // If the found row is the same post, accept it
    if (data.some(r => r.id === id)) break;
    i += 1;
    candidate = `${safeBase}-${i}`;
  }
  return candidate;
}

async function run() {
  console.log('Fetching posts without slug...');
  const { data: rows, error } = await supabase.from('posts').select('id, title, slug').or('slug.is.null,slug.eq.').limit(1000);
  if (error) throw error;
  if (!rows || rows.length === 0) {
    console.log('No rows to backfill.');
    return;
  }
  for (const r of rows) {
    try {
      const candidate = await uniqueSlugFor(r.title || '', r.id);
      console.log(`Updating ${r.id} -> ${candidate}`);
      const { error: upErr } = await supabase.from('posts').update({ slug: candidate }).eq('id', r.id);
      if (upErr) throw upErr;
    } catch (e) {
      console.error('Failed to update', r.id, e.message || e);
    }
  }
  console.log('Backfill complete.');
}

run().catch((e) => { console.error(e); process.exit(1); });
