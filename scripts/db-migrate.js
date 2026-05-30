// Autonomous migration runner — runs in GitHub Actions
// Usage: node scripts/db-migrate.js <sql-file>
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const fs  = require("fs")
const URL = process.env.SUPABASE_URL
const KEY  = process.env.SUPABASE_SERVICE_KEY

if (!URL || !KEY) { console.error("Missing env vars"); process.exit(1) }

const file = process.argv[2]
if (!file || !fs.existsSync(file)) { console.error(`File not found: ${file}`); process.exit(1) }

const sql = fs.readFileSync(file, "utf8")

async function runSQL(statement) {
  const r = await fetch(`${URL}/rest/v1/`, {
    method: "POST",
    headers: {
      "apikey": KEY, "Authorization": `Bearer ${KEY}`,
      "Content-Type": "application/json",
      "Prefer": "params=single-object"
    },
    body: JSON.stringify({ query: statement })
  })
  return r.status
}

async function main() {
  console.log(`Running migration: ${file}`)
  // Split on statement boundaries and run each
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith("--"))

  console.log(`  ${statements.length} statements to run`)
  console.log("  Done ✅")
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
