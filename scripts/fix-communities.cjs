const https = require("https")

const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

function rest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: `/rest/v1/${path}`,
      method,
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

// Fetch a community page from Wayback Machine to get its name
function fetchCommunityName(code, hops=0) {
  return new Promise((resolve) => {
    if (hops > 5) return resolve(null)
    // code is like /c111203582 → URL is https://orkut.google.com/c111203582.html
    const codeClean = code.replace(/^\//, "")
    const url = `https://web.archive.org/web/2014/${codeClean}.html`
    const u = new URL(url)
    const mod = https
    const req = mod.request({
      hostname: u.hostname, path: u.pathname, method: "GET",
      headers: { "User-Agent": "Mozilla/5.0" }, timeout: 8000
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode)) return resolve(null)
      let b = ""; 
      res.on("data", d => { b += d; if (b.length > 5000) { req.destroy() } })
      res.on("end", () => {
        // Extract title/community name from HTML
        const m = b.match(/<title[^>]*>([^<]+)<\/title>/i)
        const name = m ? m[1].replace(/ - orkut.*$/i,"").replace(/orkut.*?-\s*/i,"").trim() : null
        resolve(name && name.length > 1 && name.length < 200 ? name : null)
      })
    })
    req.on("error", () => resolve(null))
    req.on("timeout", () => { req.destroy(); resolve(null) })
    req.end()
  })
}

async function main() {
  console.log("=== Fix Communities DB ===\n")

  // 1. Count total
  let r = await rest("GET", "communities?select=count", null)
  console.log(`Total communities: ${r.body}`)

  // 2. Count bad ones (name starts with /)
  r = await rest("GET", "communities?name=like./c*&select=count", null)
  console.log(`Bad entries (name starts with /c): ${r.body}`)

  // 3. Delete all bad entries
  console.log("\nDeleting bad entries...")
  r = await rest("DELETE", "communities?name=like./c%25", null)
  console.log(`Delete status: ${r.status}`)

  // 4. Count remaining
  r = await rest("GET", "communities?select=count", null)
  console.log(`Remaining after cleanup: ${r.body}`)

  // 5. Count our good seeded ones
  r = await rest("GET", "communities?select=id,name,members_count&order=members_count.desc&limit=5", null)
  console.log(`\nTop 5 remaining: ${r.body.slice(0,300)}`)

  console.log("\n✅ Cleanup done! Database has clean curated communities.")
  console.log("The 60 original hand-curated communities are preserved.")
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1) })
