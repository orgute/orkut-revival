#!/usr/bin/env node
// Autonomous DB verification — runs in GitHub Actions (Node 20)
const https = require("https")

const URL_BASE = process.env.SUPABASE_URL
const KEY      = process.env.SUPABASE_SERVICE_KEY

if (!URL_BASE || !KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
  process.exit(1)
}

function get(path, extraHeaders={}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, URL_BASE)
    const opts = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   "GET",
      headers: {
        "apikey":        KEY,
        "Authorization": `Bearer ${KEY}`,
        "Content-Type":  "application/json",
        "Prefer":        "count=exact",
        ...extraHeaders
      }
    }
    const req = https.request(opts, res => {
      let body = ""
      res.on("data", d => body += d)
      res.on("end", () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) }) }
        catch { resolve({ status: res.statusCode, headers: res.headers, body }) }
      })
    })
    req.on("error", reject)
    req.end()
  })
}

async function main() {
  console.log("🔍 Orkut Revival — DB Health Check")
  console.log(`   ${URL_BASE}\n`)

  const tables = [
    "profiles","friendships","recados","depoimentos",
    "communities","memberships","community_posts","messages","profile_visits"
  ]

  let allOk = true
  for (const t of tables) {
    const r = await get(`/rest/v1/${t}?select=*&limit=0`)
    const count = r.headers["content-range"] || "?"
    const ok    = r.status === 200
    console.log(`  ${ok ? "✅" : "❌"}  ${t.padEnd(22)} rows: ${count}`)
    if (!ok) {
      allOk = false
      console.log(`       → ${r.status}: ${JSON.stringify(r.body).slice(0,120)}`)
    }
  }

  // Communities sample
  const coms = await get("/rest/v1/communities?select=name,category&order=members_count.desc&limit=5")
  if (coms.status === 200 && Array.isArray(coms.body)) {
    console.log(`\n📦 Top communities:`)
    coms.body.forEach(c => console.log(`     ${c.name}`))
  }

  // Auth users
  const users = await get("/auth/v1/admin/users?page=1&per_page=20")
  if (users.status === 200 && users.body.users) {
    console.log(`\n👥 Registered users: ${users.body.users.length}`)
    users.body.users.forEach(u =>
      console.log(`     ${u.email} — joined ${new Date(u.created_at).toLocaleDateString("pt-BR")}`)
    )
  } else {
    console.log(`\n👥 Auth check: ${users.status}`)
  }

  console.log(`\n${allOk ? "✅ All tables healthy — ready to deploy" : "❌ Schema issues detected"}`)
  process.exit(allOk ? 0 : 1)
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1) })
