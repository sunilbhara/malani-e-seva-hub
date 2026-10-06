// Applies one SQL migration file over a direct Postgres connection (TLS verified).
//   node scripts/apply-migration.mjs supabase/migrations/<file>.sql
// Needs SUPABASE_DB_URL (or DATABASE_URL) and SUPABASE_CA_CERT in .env.
// Prefer the Supabase dashboard / MCP for routine migrations; this is a fallback.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to-migration.sql>");
  process.exit(1);
}
const connectionString = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
const caPath = process.env.SUPABASE_CA_CERT;
if (!connectionString || !caPath) {
  console.error("Set SUPABASE_DB_URL (or DATABASE_URL) and SUPABASE_CA_CERT in .env.");
  process.exit(1);
}

const sql = readFileSync(resolve(file), "utf8");
const client = new pg.Client({ connectionString, ssl: { ca: readFileSync(resolve(caPath), "utf8"), rejectUnauthorized: true } });

try {
  await client.connect();
  console.log(`Applying ${file} ...`);
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log("Migration applied.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
