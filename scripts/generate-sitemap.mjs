import 'dotenv/config'
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.VITE_SITE_URL || 'https://malanibarmer.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: posts, error } = await supabase.from('posts').select('slug, updated_at, created_at').not('slug', 'is', null).order('created_at', { ascending: false });
  if (error) throw error;
  const items = (posts || []).map((p) => {
    const loc = `${SITE_URL}/blog/${p.slug}`;
    const lastmod = (p.updated_at || p.created_at || '').split('T')[0];
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</urlset>`;
  const out = path.resolve(process.cwd(), 'public', 'sitemap.xml');
  fs.writeFileSync(out, xml, 'utf8');
  console.log('Wrote sitemap to', out);
}

run().catch((e) => { console.error(e); process.exit(1); });
