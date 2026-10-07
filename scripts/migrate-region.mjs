// One-off data copy from the old Supabase project (Singapore) to the new one (Mumbai).
//
// The schema must already exist on the target (it does: applied via migrations).
// Copies auth users/identities (password hashes included, so existing passwords keep
// working) and every public table, preserving IDs. Triggers are disabled on the target
// during the copy so handle_new_user does not create duplicate profiles and the
// engagement counters on posts are not double-counted.
//
// The new schema is stricter than the old one, so a few values are normalised on the way
// (see SOURCE_EXPR / SOURCE_FILTER): e-mail addresses used as display names become "पाठक",
// unknown post types/languages fall back to defaults, empty or over-long comments are
// trimmed or skipped, and duplicate views (same visitor, same day) collapse into one.
// Verification compares the normalised source with the target, so it is still exact.
//
// Usage (connection strings go in .env, never in code or chat):
//   OLD_DB_URL=postgresql://postgres.<old-ref>:<password>@<pooler-host>:5432/postgres
//   NEW_DB_URL=postgresql://postgres.<new-ref>:<password>@<pooler-host>:5432/postgres
//   node scripts/migrate-region.mjs            # dry run: counts only
//   node scripts/migrate-region.mjs --apply    # copy + verify
//
// Use the "Session pooler" strings (port 5432) from Dashboard → Connect, and set
//   SUPABASE_CA_CERT=./prod-ca-2021.crt   (Project Settings → Database → SSL → download)
import "dotenv/config";
import fs from "node:fs";
import pg from "pg";

const TABLES = [
  "auth.users",
  "auth.identities",
  "public.profiles",
  "public.user_roles",
  "public.posts",
  "public.comments",
  "public.post_likes",
  "public.post_views",
  "public.post_bookmarks",
  "public.post_reactions",
  "public.newsletter_subscribers",
  "public.user_notifications",
];

// Per-column expressions applied when reading from the source.
const SOURCE_EXPR = {
  "public.profiles": {
    full_name: `case when full_name like '%@%' then 'पाठक' else full_name end`,
  },
  "public.posts": {
    language: `case when language in ('hi', 'en') then language else 'hi' end`,
    post_type: `case when post_type in ('article','job','admit_card','result','exam','local_news','guide') then post_type else 'article' end`,
    status: `case when status in ('draft','scheduled','published','archived') then status when status is null then 'published' else 'draft' end`,
    published_at: `case when coalesce(status, 'published') = 'published' then coalesce(published_at, created_at) else published_at end`,
  },
  "public.comments": {
    content: `left(btrim(content), 2000)`,
  },
};

// Rows that cannot satisfy the new constraints, or duplicates the new unique indexes reject.
const SOURCE_FILTER = {
  "public.comments": `where char_length(btrim(content)) >= 1`,
  "public.post_reactions": `where reaction in ('helpful','important','informative','urgent')`,
};

// Tables whose rows must be de-duplicated on the source (keeps the earliest row).
const SOURCE_DISTINCT = {
  "public.post_views": `distinct on (post_id, visitor_id, ((created_at at time zone 'Asia/Kolkata')::date))`,
};
const SOURCE_ORDER = {
  "public.post_views": `order by post_id, visitor_id, ((created_at at time zone 'Asia/Kolkata')::date), created_at`,
};

const apply = process.argv.includes("--apply");
const { OLD_DB_URL, NEW_DB_URL } = process.env;
if (!OLD_DB_URL || !NEW_DB_URL) {
  console.error("Set OLD_DB_URL and NEW_DB_URL in .env (Session pooler connection strings).");
  process.exit(1);
}
if (OLD_DB_URL === NEW_DB_URL) {
  console.error("OLD_DB_URL and NEW_DB_URL are identical; refusing to run.");
  process.exit(1);
}

// Supabase's pooler certificates are signed by Supabase's own CA, which Node does not
// trust by default. Download it from Dashboard → Project Settings → Database → SSL.
const caPath = process.env.SUPABASE_CA_CERT;
if (!caPath || !fs.existsSync(caPath)) {
  console.error("Set SUPABASE_CA_CERT in .env to the path of the downloaded Supabase CA certificate (prod-ca-2021.crt).");
  process.exit(1);
}
const ssl = { ca: fs.readFileSync(caPath, "utf8"), rejectUnauthorized: true };
const src = new pg.Client({ connectionString: OLD_DB_URL, ssl });
const dst = new pg.Client({ connectionString: NEW_DB_URL, ssl });

const split = (t) => t.split(".");

// Columns that can be written on the target and also exist on the source.
async function sharedColumns(table) {
  const [schema, name] = split(table);
  const q = `select column_name from information_schema.columns
             where table_schema = $1 and table_name = $2 and is_generated = 'NEVER'
             order by ordinal_position`;
  const [a, b] = await Promise.all([src.query(q, [schema, name]), dst.query(q, [schema, name])]);
  const srcCols = new Set(a.rows.map((r) => r.column_name));
  return b.rows.map((r) => r.column_name).filter((c) => srcCols.has(c));
}

const ident = (c) => `"${c.replace(/"/g, '""')}"`;

// SELECT for one table: plain on the target, normalised on the source.
function selectSql(table, cols, side) {
  if (side === "dst") return `select ${cols.map(ident).join(", ")} from ${table}`;
  const expr = SOURCE_EXPR[table] ?? {};
  const list = cols.map((c) => (expr[c] ? `(${expr[c]}) as ${ident(c)}` : ident(c))).join(", ");
  return [`select`, SOURCE_DISTINCT[table] ?? "", list, `from ${table}`, SOURCE_FILTER[table] ?? "", SOURCE_ORDER[table] ?? ""].join(" ");
}

// Order-independent fingerprint of the shared columns, used to prove the copy is exact.
async function fingerprint(client, table, cols, side) {
  const { rows } = await client.query(
    `select count(*)::int as n,
            coalesce(md5(string_agg(md5(row_to_json(x)::text), '' order by md5(row_to_json(x)::text))), '') as h
       from (${selectSql(table, cols, side)}) x`,
  );
  return rows[0];
}

async function main() {
  await src.connect();
  await dst.connect();

  const plan = [];
  for (const table of TABLES) {
    const cols = await sharedColumns(table);
    const raw = (await src.query(`select count(*)::int as n from ${table}`)).rows[0].n;
    const s = await fingerprint(src, table, cols, "src");
    const d = await fingerprint(dst, table, cols, "dst");
    plan.push({ table, cols, s, d });
    const note = raw !== s.n ? `  (${raw - s.n} duplicate/invalid rows skipped)` : "";
    console.log(`${table.padEnd(30)} source=${String(s.n).padStart(5)}  target=${String(d.n).padStart(5)}${note}`);
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to copy.");
    return;
  }

  const nonEmpty = plan.filter((p) => p.d.n > 0);
  if (nonEmpty.length) {
    console.error(`\nTarget already has data in: ${nonEmpty.map((p) => p.table).join(", ")}. Aborting to avoid mixing data.`);
    process.exit(1);
  }

  await dst.query("begin");
  try {
    await dst.query("set local session_replication_role = replica"); // skip triggers and FK checks during copy
    for (const { table, cols, s } of plan) {
      if (s.n === 0) continue;
      const list = cols.map(ident).join(", ");
      const { rows } = await src.query(`select coalesce(json_agg(x), '[]'::json) as data from (${selectSql(table, cols, "src")}) x`);
      const res = await dst.query(
        `insert into ${table} (${list})
         select ${list} from json_populate_recordset(null::${table}, $1::json)
         on conflict do nothing`,
        [JSON.stringify(rows[0].data)],
      );
      console.log(`copied ${table}: ${res.rowCount}`);
    }
    // Existing posts were announced on the old site already: mark them so the on-publish
    // trigger never re-sends them to Telegram/push when they are edited later.
    const marked = await dst.query(
      `update public.posts set broadcast_at = coalesce(published_at, now())
        where status = 'published' and broadcast_at is null`,
    );
    console.log(`marked ${marked.rowCount} existing published posts as already announced`);
    await dst.query("commit");
  } catch (err) {
    await dst.query("rollback");
    throw err;
  }

  console.log("\nVerifying…");
  let ok = true;
  for (const { table, cols } of plan) {
    const [s, d] = await Promise.all([fingerprint(src, table, cols, "src"), fingerprint(dst, table, cols, "dst")]);
    const same = s.n === d.n && s.h === d.h;
    ok &&= same;
    console.log(`${same ? "OK  " : "DIFF"} ${table.padEnd(30)} ${s.n} rows`);
  }
  if (!ok) {
    console.error("\nVerification failed. Do not switch the app over yet.");
    process.exit(1);
  }
  console.log("\nAll tables copied exactly.");
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(async () => {
    await src.end().catch(() => {});
    await dst.end().catch(() => {});
  });
