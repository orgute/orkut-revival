const https = require("https")
const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

// ONLY use the REST API — management API rejects service role keys
function rest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: `/rest/v1/${path}`, method,
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        ...(data ? {"Content-Length": Buffer.byteLength(data)} : {})
      }
    }, res => {
      let b = ""
      res.on("data", d => b += d)
      res.on("end", () => resolve({ status: res.statusCode, body: b }))
    })
    req.on("error", reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  console.log("=== Cleanup via REST API only ===\n")
  console.log(`Key present: ${KEY ? KEY.slice(0,20)+'...' : 'MISSING — set SUPABASE_SERVICE_KEY'}`)

  // 1. Count total
  let r = await rest("GET", "communities?select=count", null)
  console.log(`Total communities: ${r.status} — ${r.body.slice(0,100)}`)

  // 2. Find communities with /c codes in name
  r = await rest("GET", "communities?name=like.*%2Fc*&select=id,name&limit=100", null)
  console.log(`With /c pattern: ${r.status} — count: ${(JSON.parse(r.body||'[]')).length}`)

  // 3. Get ALL communities and filter in JS
  r = await rest("GET", "communities?select=id,name&limit=5000", null)
  const all = JSON.parse(r.body || "[]")
  console.log(`Fetched ${all.length} communities`)

  const BAD_RE    = /\/c\d+/i        // contains /c followed by digits
  const CODE_RE   = /^c\d{4,}$/i     // pure code like c12345
  const PREFIX_RE = /^\d+\s/          // starts with "0 " or "1 " etc

  const toDelete = all.filter(c => BAD_RE.test(c.name) || CODE_RE.test(c.name.trim()))
  const toFix    = all.filter(c => !BAD_RE.test(c.name) && !CODE_RE.test(c.name.trim()) && PREFIX_RE.test(c.name))

  console.log(`\nTo delete (has /cXXXX or is pure code): ${toDelete.length}`)
  toDelete.slice(0,10).forEach(c => console.log(`  DEL: "${c.name}"`))

  console.log(`\nTo fix (has "0 " prefix): ${toFix.length}`)
  toFix.slice(0,5).forEach(c => console.log(`  FIX: "${c.name}"`))

  // 4. Delete bad ones in batches by ID
  let deleted = 0
  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50)
    const ids   = batch.map(c => c.id).join(",")
    const res   = await rest("DELETE", `communities?id=in.(${ids})`, null)
    if (res.status >= 200 && res.status < 300) deleted += batch.length
    else console.log(`Delete batch error: ${res.status} — ${res.body.slice(0,100)}`)
  }
  console.log(`\nDeleted: ${deleted}`)

  // 5. Fix "0 " prefix by updating each row
  let fixed = 0
  for (const c of toFix) {
    const newName = c.name.replace(/^\d+\s+/, "").trim()
    if (newName.length < 2) continue
    const res = await rest("PATCH", `communities?id=eq.${c.id}`, { name: newName })
    if (res.status >= 200 && res.status < 300) fixed++
  }
  console.log(`Fixed prefix: ${fixed}`)

  // 6. Fix bio on all profiles
  r = await rest("PATCH", `profiles?bio=eq.Ol%C3%A1!%20Estou%20de%20volta%20no%20Orkut%20%3A)`,
    { bio: "Olá! Estou de volta :)" })
  console.log(`\nBio fix: ${r.status} — ${r.body.slice(0,100)}`)

  // Also try URL-encoded version
  r = await rest("GET", "profiles?select=name,bio&limit=10", null)
  console.log(`Profiles bio check: ${r.body.slice(0,300)}`)

  // 7. Final count
  r = await rest("GET", "communities?select=count", null)
  console.log(`\nFinal total: ${r.body}`)
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1) })
