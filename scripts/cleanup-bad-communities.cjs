const https = require("https")
const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

function mgmt(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql })
    const req  = https.request({
      hostname: "api.supabase.com",
      path: `/v1/projects/${PROJECT}/database/query`,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }, res => {
      let b = ""; res.on("data", d => b += d)
      res.on("end", () => resolve({ status: res.statusCode, body: b }))
    })
    req.on("error", reject)
    req.write(data); req.end()
  })
}

function supa(method, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: `/rest/v1/${path}`, method,
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      }
    }, res => {
      let b = ""; res.on("data", d => b += d)
      res.on("end", () => resolve({ status: res.statusCode, body: b }))
    })
    req.on("error", reject)
    req.end()
  })
}

async function main() {
  // Count before
  let r = await mgmt("SELECT count(*) FROM communities")
  console.log(`Before: ${r.body}`)

  // Delete all entries where name looks like a code (starts with / or matches /c\d+/)
  r = await mgmt(`DELETE FROM communities WHERE name ~ '^/c[0-9]' OR name ~ '^c[0-9]{5,}$'`)
  console.log(`Delete regex: ${r.status} — ${r.body.slice(0,100)}`)

  // Count after
  r = await mgmt("SELECT count(*) FROM communities")
  console.log(`After: ${r.body}`)

  // Show top 10
  r = await mgmt("SELECT name, members_count FROM communities ORDER BY members_count DESC LIMIT 10")
  console.log(`Top 10: ${r.body.slice(0,400)}`)
}
main().catch(e => { console.error(e.message); process.exit(1) })
