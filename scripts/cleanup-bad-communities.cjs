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

async function main() {
  let r = await mgmt("SELECT count(*) FROM communities")
  console.log(`Before: ${r.body}`)

  // Show sample of bad ones to understand pattern
  r = await mgmt(`SELECT name FROM communities WHERE name ~ '/c[0-9]+$' LIMIT 10`)
  console.log(`Sample with /cXXX suffix: ${r.body.slice(0,400)}`)

  // 1. Delete entries where name is ONLY a code: starts with / or pure c+digits
  r = await mgmt(`DELETE FROM communities WHERE name ~ '^/c[0-9]+$' OR name ~ '^c[0-9]{4,}$'`)
  console.log(`Deleted pure codes: ${r.status}`)

  // 2. Clean names that have code appended at end: "Real Name /c12345678"
  r = await mgmt(`UPDATE communities SET name = trim(regexp_replace(name, '\\s*/c[0-9]+\\s*$', '')) WHERE name ~ '/c[0-9]+$'`)
  console.log(`Cleaned /cXXX suffix from names: ${r.status} — ${r.body.slice(0,100)}`)

  // 3. Also clean "0 " prefix that appears in some names like "0 Bobby eH..."
  r = await mgmt(`UPDATE communities SET name = trim(substring(name from 3)) WHERE name ~ '^0 ' AND members_count = 0`)
  console.log(`Cleaned "0 " prefix: ${r.status}`)

  // 4. Delete any remaining that look like garbage (very short, pure symbols, etc.)
  r = await mgmt(`DELETE FROM communities WHERE length(trim(name)) < 2`)
  console.log(`Deleted empty names: ${r.status}`)

  r = await mgmt("SELECT count(*) FROM communities")
  console.log(`After: ${r.body}`)

  r = await mgmt("SELECT name, members_count FROM communities ORDER BY members_count DESC LIMIT 5")
  console.log(`Top 5: ${r.body.slice(0,300)}`)
}
main().catch(e => { console.error(e.message); process.exit(1) })
