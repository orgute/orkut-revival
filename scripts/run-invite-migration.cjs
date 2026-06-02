const https = require("https")
const fs    = require("fs")

const URL = "https://uakmvwwgtjrwdymfwtrf.supabase.co"
const KEY  = process.env.SUPABASE_SERVICE_KEY

function query(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql })
    const opts = {
      hostname: "uakmvwwgtjrwdymfwtrf.supabase.co",
      path: "/rest/v1/rpc/exec_sql",
      method: "POST",
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }
    const req = https.request(opts, res => {
      let body = ""
      res.on("data", d => body += d)
      res.on("end", () => resolve({ status: res.statusCode, body }))
    })
    req.on("error", reject)
    req.write(data); req.end()
  })
}

// Use the pg endpoint directly via REST
async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql })
    const opts = {
      hostname: "uakmvwwgtjrwdymfwtrf.supabase.co",
      path: "/pg",
      method: "POST",
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }
    const req = https.request(opts, res => {
      let body = ""
      res.on("data", d => body += d)
      res.on("end", () => resolve({ status: res.statusCode, body }))
    })
    req.on("error", reject)
    req.write(data); req.end()
  })
}

async function main() {
  console.log("Running invite migration via Supabase Management API...")

  // Use the correct endpoint: /rest/v1/rpc for stored procedures
  // For raw SQL we need the pg endpoint or management API
  // Let's use the management API
  const PROJECT = "uakmvwwgtjrwdymfwtrf"

  const sql = fs.readFileSync("scripts/invite-migration.sql", "utf8")
  
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith("--"))

  console.log(`Running ${statements.length} SQL statements via management API...`)

  for (const stmt of statements) {
    const result = await new Promise((resolve, reject) => {
      const data = JSON.stringify({ query: stmt + ";" })
      const opts = {
        hostname: "api.supabase.com",
        path: `/v1/projects/${PROJECT}/database/query`,
        method: "POST",
        headers: {
          "Authorization": `Bearer ${KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data)
        }
      }
      const req = https.request(opts, res => {
        let body = ""
        res.on("data", d => body += d)
        res.on("end", () => resolve({ status: res.statusCode, body }))
      })
      req.on("error", reject)
      req.write(data); req.end()
    })

    const preview = stmt.slice(0, 60).replace(/\n/g, ' ')
    if (result.status === 200 || result.status === 201) {
      console.log(`  ✅ ${preview}`)
    } else {
      console.log(`  ⚠️  ${preview}`)
      console.log(`     Status: ${result.status} — ${result.body.slice(0, 100)}`)
    }
  }

  // Seed invites for existing users
  console.log("\nSeeding invites for existing users...")
  const seedResult = await new Promise((resolve, reject) => {
    const data = JSON.stringify({ 
      query: "select generate_invites_for_user(id) from profiles;" 
    })
    const opts = {
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT}/database/query`,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }
    const req = https.request(opts, res => {
      let body = ""
      res.on("data", d => body += d)
      res.on("end", () => resolve({ status: res.statusCode, body }))
    })
    req.on("error", reject)
    req.write(data); req.end()
  })
  console.log(`Seed: ${seedResult.status} — ${seedResult.body.slice(0, 200)}`)
  console.log("\n✅ Done!")
}

main().catch(e => { console.error(e.message); process.exit(1) })
