const https = require("https")
const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

function supa(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req  = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: `/rest/v1/${path}`, method,
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
        ...(data ? {"Content-Length": Buffer.byteLength(data)} : {})
      }
    }, res => {
      let b = ""; res.on("data", d => b += d)
      res.on("end", () => resolve({ status: res.statusCode, body: b }))
    })
    req.on("error", reject)
    if (data) req.write(data)
    req.end()
  })
}

async function main() {
  // Count before
  let r = await supa("GET", "communities?select=count", null)
  console.log(`Before: ${r.body}`)

  // Delete anything that looks like a code: starts with / or starts with c + only digits
  // Pattern 1: name starts with /
  r = await supa("DELETE", "communities?name=like.%2F%25", null)
  console.log(`Deleted /c* entries: ${r.status}`)

  // Pattern 2: name matches ^c\d+ (pure code like c22672322)
  r = await supa("DELETE", "communities?name=like.c%25&name=not.like.%25 %25&name=not.like.%25ã%25&name=not.like.%25é%25&name=not.like.%25ô%25&name=not.like.%25í%25&name=not.like.%25ó%25", null)
  console.log(`Deleted c+digits entries: ${r.status}`)

  // Count after
  r = await supa("GET", "communities?select=count", null)
  console.log(`After: ${r.body}`)

  // Show sample of what's left
  r = await supa("GET", "communities?select=name&order=members_count.desc&limit=10", null)
  console.log(`Top 10 remaining: ${r.body.slice(0,400)}`)
}
main().catch(e => { console.error(e.message); process.exit(1) })
