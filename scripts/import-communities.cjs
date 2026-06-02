const https = require("https")
const http  = require("http")

const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

if (!KEY) { console.error("SUPABASE_SERVICE_KEY not set"); process.exit(1) }
console.log(`Key present: ${KEY.slice(0,20)}...`)

function supaREST(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: `/rest/v1/${path}`,
      method,
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=minimal",
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

function fetchURL(url, rangeEnd) {
  return new Promise((resolve, reject) => {
    function doReq(url, hops) {
      if (hops > 8) return reject(new Error("Too many redirects"))
      const mod = url.startsWith("https") ? https : http
      const u = new URL(url)
      const req = mod.request({
        hostname: u.hostname, path: u.pathname + u.search, method: "GET",
        headers: {
          "User-Agent": "ia_downloader/1.0",
          ...(rangeEnd ? {"Range": `bytes=0-${rangeEnd}`} : {})
        }
      }, res => {
        console.log(`  ${res.statusCode} ${url.slice(0,80)}`)
        if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
          const loc = res.headers.location.startsWith("http") 
            ? res.headers.location 
            : `https://${u.hostname}${res.headers.location}`
          return doReq(loc, hops+1)
        }
        const chunks = []
        res.on("data", d => chunks.push(d))
        res.on("end", () => resolve({ status: res.statusCode, data: Buffer.concat(chunks).toString("utf8") }))
      })
      req.on("error", reject)
      req.end()
    }
    doReq(url, 0)
  })
}

function streamFile(url, onLine, maxLines) {
  return new Promise((resolve, reject) => {
    function doReq(url, hops) {
      if (hops > 8) return reject(new Error("Too many redirects"))
      const mod = url.startsWith("https") ? https : http
      const u = new URL(url)
      let count = 0, buf = "", done = false

      const req = mod.request({
        hostname: u.hostname, path: u.pathname + u.search, method: "GET",
        headers: { "User-Agent": "ia_downloader/1.0" }
      }, res => {
        console.log(`  Stream: ${res.statusCode} ${url.slice(0,80)}`)
        if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
          const loc = res.headers.location.startsWith("http")
            ? res.headers.location
            : `https://${u.hostname}${res.headers.location}`
          return doReq(loc, hops+1)
        }
        res.on("data", chunk => {
          if (done) return
          buf += chunk.toString("utf8")
          const lines = buf.split("\n")
          buf = lines.pop()
          for (const ln of lines) {
            if (done) break
            const t = ln.trim()
            if (t) { onLine(t); count++ }
            if (maxLines && count >= maxLines) { done = true; req.destroy(); break }
          }
        })
        res.on("end", () => resolve(count))
        res.on("error", reject)
      })
      req.on("error", e => { if (done) resolve(count); else reject(e) })
      req.end()
    }
    doReq(url, 0)
  })
}

async function main() {
  console.log("=== OG Orkut Community Import ===\n")

  // 1. Test Supabase connectivity
  console.log("1. Testing Supabase connectivity...")
  let r = await supaREST("GET", "communities?limit=1&select=count")
  console.log(`   Supabase: ${r.status} — ${r.body.slice(0,100)}`)

  // 2. Add column
  console.log("\n2. Schema prep (via REST RPC not needed — column already attempted)")

  // 3. Peek at archive file
  const FILE = "https://archive.org/download/orkut-community-list/Orkut%20Community%20List.txt"
  console.log("\n3. Fetching first 3KB of community list...")
  try {
    const peek = await fetchURL(FILE, 3000)
    console.log(`   Status: ${peek.status}, length: ${peek.data.length}`)
    console.log("   --- First 1500 chars ---")
    console.log(peek.data.slice(0, 1500))
    console.log("   ---")
  } catch(e) {
    console.log(`   Fetch error: ${e.message}`)
  }

  // 4. Stream and parse
  console.log("\n4. Streaming file...")
  const communities = []
  let seen = 0

  try {
    await streamFile(FILE, line => {
      seen++
      if (seen <= 20) console.log(`   [${seen}] ${line.slice(0,100)}`)

      // Detect format from line structure
      let name = "", code = "", category = "Geral", members_count = 0
      if (line.includes("\t")) {
        const p = line.split("\t")
        code = (p[0]||"").trim(); name = (p[1]||"").trim()
        category = (p[2]||"Geral").trim(); members_count = parseInt(p[3]||"0")||0
      } else if (line.includes("|")) {
        const p = line.split("|")
        code = (p[0]||"").trim(); name = (p[1]||"").trim()
        category = (p[2]||"Geral").trim(); members_count = parseInt(p[3]||"0")||0
      } else if (line.match(/^[a-z]\d{4,}/i)) {
        // Looks like a code at start: "c00001234 Community Name"
        const m = line.match(/^([a-z0-9]+)\s+(.+)$/i)
        if (m) { code = m[1]; name = m[2] }
        else { name = line }
      } else {
        name = line
      }

      if (name && name.length > 1 && name.length < 300) {
        communities.push({ code: code||null, name: name.trim(), category: category||"Geral", members_count })
      }
    }, 300000)
  } catch(e) {
    console.log(`   Stream error: ${e.message}`)
  }

  console.log(`\n   Lines: ${seen}, Parsed: ${communities.length}`)
  if (communities.length === 0) { console.log("⚠️ Nothing parsed — see format above"); process.exit(0) }

  // 5. Deduplicate + insert
  console.log(`\n5. Inserting ${communities.length} communities...`)
  const nameSet = new Set()
  const rows = []
  for (const c of communities) {
    const key = c.name.toLowerCase().slice(0,60)
    if (nameSet.has(key)) continue
    nameSet.add(key)
    rows.push({
      name:          c.name.slice(0,200),
      category:      (c.category||"Geral").slice(0,100),
      description:   null,
      seed:          (c.code||("s"+rows.length)).replace(/[^a-z0-9]/gi,"").slice(0,20)||("s"+rows.length),
      members_count: c.members_count||0,
    })
  }

  console.log(`   Unique: ${rows.length}`)
  let inserted = 0, errs = 0
  const BATCH = 200
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i+BATCH)
    const res = await supaREST("POST", "communities", batch)
    if (res.status >= 200 && res.status < 300) inserted += batch.length
    else { errs++; if (errs<=3) console.log(`   ERR batch ${i}: ${res.status} ${res.body.slice(0,120)}`) }
    if (i % 20000===0 && i>0) console.log(`   Progress: ${inserted}/${rows.length}`)
  }

  r = await supaREST("GET", "communities?select=count", null)
  console.log(`\n✅ Done! Inserted: ${inserted}, Errors: ${errs}`)
  console.log(`   Total in DB: ${r.body}`)
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1) })
