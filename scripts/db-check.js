// Autonomous DB verification — runs in GitHub Actions
// Usage: node scripts/db-check.js
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY

const URL = process.env.SUPABASE_URL
const KEY  = process.env.SUPABASE_SERVICE_KEY

if (!URL || !KEY) { console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"); process.exit(1) }

const H = { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" }

async function query(table, params="select=count&limit=1") {
  const r = await fetch(`${URL}/rest/v1/${table}?${params}`, { headers: { ...H, "Prefer":"count=exact" } })
  const count = r.headers.get("content-range") || "?"
  const ok    = r.status === 200
  return { ok, status: r.status, count, data: ok ? await r.json() : [] }
}

async function sql(query) {
  const r = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
    method:"POST", headers: H,
    body: JSON.stringify({ query })
  })
  return r.status
}

async function main() {
  console.log("🔍 Orkut DB Health Check\n")

  const tables = [
    "profiles","friendships","recados","depoimentos",
    "communities","memberships","community_posts","messages","profile_visits"
  ]

  let allOk = true
  for (const t of tables) {
    const { ok, status, count } = await query(t)
    console.log(`  ${ok ? "✅" : "❌"}  ${t.padEnd(22)} ${count}`)
    if (!ok) allOk = false
  }

  // Check communities seeded
  const coms = await query("communities", "select=name,category&limit=5")
  console.log(`\n📦 Communities sample:`)
  coms.data.forEach(c => console.log(`     ${c.name} [${c.category}]`))

  // Check auth users
  const users = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=10`, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  })
  const usersData = await users.json()
  const userCount = usersData.users?.length || 0
  console.log(`\n👥 Registered users: ${userCount}`)
  if (usersData.users?.length > 0) {
    usersData.users.forEach(u => console.log(`     ${u.email} — ${new Date(u.created_at).toLocaleDateString()}`))
  }

  console.log(`\n${allOk ? "✅ All tables healthy" : "❌ Some tables missing — run schema.sql"}`)
  process.exit(allOk ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
