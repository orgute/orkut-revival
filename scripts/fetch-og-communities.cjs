const https = require("https")
const http  = require("http")

const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

// ── Supabase REST ─────────────────────────────────────────────
function supa(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req  = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path:     `/rest/v1/${path}`,
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

// ── Fetch one community from Wayback ─────────────────────────
function fetchCommunity(code) {
  // code like "c00001234"
  const wayback = `https://web.archive.org/web/20140901000000*/orkut.google.com/${code}.html`
  return new Promise((resolve) => {
    const u = new URL(`https://web.archive.org/web/20140901120000/https://orkut.google.com/${code}.html`)
    const req = https.request({
      hostname: u.hostname, path: u.pathname + u.search,
      method: "GET", timeout: 12000,
      headers: { "User-Agent": "Mozilla/5.0 (archive research)", "Accept": "text/html" }
    }, res => {
      // Follow one redirect
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        res.resume()
        const loc = res.headers.location
        const u2  = loc.startsWith("http") ? new URL(loc) : new URL(`https://web.archive.org${loc}`)
        const req2 = https.request({
          hostname: u2.hostname, path: u2.pathname + u2.search,
          method: "GET", timeout: 12000,
          headers: { "User-Agent": "Mozilla/5.0 (archive research)", "Accept": "text/html" }
        }, res2 => {
          let b = ""
          res2.on("data", d => { b += d; if (b.length > 15000) req2.destroy() })
          res2.on("end", () => resolve(parseCommunity(b, code)))
        })
        req2.on("error", () => resolve(null))
        req2.on("timeout", () => { req2.destroy(); resolve(null) })
        req2.end()
        return
      }
      let b = ""
      res.on("data",  d => { b += d; if (b.length > 15000) req.destroy() })
      res.on("end",   () => resolve(parseCommunity(b, code)))
    })
    req.on("error",   () => resolve(null))
    req.on("timeout", () => { req.destroy(); resolve(null) })
    req.end()
  })
}

function parseCommunity(html, code) {
  if (!html || html.length < 100) return null

  // Name — try several patterns from Orkut's HTML
  let name = null
  const patterns = [
    /<h1[^>]*class="[^"]*community[^"]*"[^>]*>([^<]+)<\/h1>/i,
    /<div[^>]*id="[^"]*communityName[^"]*"[^>]*>([^<]+)<\/div>/i,
    /<title[^>]*>\s*([^<\-|]+?)(?:\s*[-|]|\s*-\s*orkut|\s*\|)/i,
    /<title[^>]*>([^<]{3,100})<\/title>/i,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m && m[1]) {
      name = m[1].replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
                 .replace(/&#39;/g,"'").replace(/&quot;/g,'"')
                 .replace(/orkut\s*[-–]\s*/i,"").replace(/\s*[-–]\s*orkut.*/i,"")
                 .replace(/\s*[-–]\s*Google\+.*/i,"").trim()
      if (name && name.length > 1 && name.length < 200) break
      name = null
    }
  }
  if (!name) return null

  // Skip obviously bad names
  if (/^(orkut|google|error|not found|wayback|internet archive)/i.test(name)) return null
  if (name.match(/^\d+$/)) return null

  // Category
  let category = "Geral"
  const catMatch = html.match(/category[^>]*>([^<]{2,40})<\//i) ||
                   html.match(/Categoria[^>]*>([^<]{2,40})<\//i)
  if (catMatch) category = catMatch[1].trim()

  // Member count
  let members = 0
  const memMatch = html.match(/(\d[\d,\.]+)\s*(?:members|membros)/i)
  if (memMatch) members = parseInt(memMatch[1].replace(/[,\.]/g,"")) || 0

  return { name, category, members, code }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Generate codes to try ─────────────────────────────────────
// OG Orkut community codes: c followed by digits
// Low numbers = oldest/biggest communities
// Format in archive: "c00001234" (zero-padded 8 digits) or just numbers
function generateCodes(start, end) {
  const codes = []
  for (let i = start; i <= end; i++) {
    codes.push(`c${String(i).padStart(8,"0")}`)  // zero-padded
    codes.push(`c${i}`)                             // non-padded
  }
  return codes
}

async function main() {
  console.log("=== OG Orkut Community Fetcher ===")
  console.log(`Started: ${new Date().toISOString()}\n`)

  // Check existing count
  let r = await supa("GET", "communities?select=count", null)
  console.log(`Current communities in DB: ${r.body}`)

  // Get existing names to avoid dupes
  r = await supa("GET", "communities?select=name&limit=500", null)
  const existingNames = new Set(JSON.parse(r.body || "[]").map(c => c.name.toLowerCase()))
  console.log(`Existing names loaded: ${existingNames.size}`)

  // Strategy: try community IDs 1 through 5000
  // These are the oldest/most iconic communities
  // Rate: 1 request per 3 seconds = ~500 per 25 min
  const results = { fetched: 0, found: 0, inserted: 0, errors: 0 }
  const toInsert = []

  console.log("\nFetching communities 1-3000 (non-padded codes)...")
  console.log("Rate: 1 req/2.5s — estimated 2h for 3000\n")

  for (let i = 1; i <= 3000; i++) {
    const code = `c${i}`
    
    try {
      const community = await fetchCommunity(code)
      results.fetched++

      if (community && community.name && !existingNames.has(community.name.toLowerCase())) {
        existingNames.add(community.name.toLowerCase())
        toInsert.push({
          name:          community.name.slice(0, 200),
          category:      (community.category || "Geral").slice(0, 100),
          description:   null,
          seed:          code,
          members_count: community.members || 0,
          orkut_code:    code,
        })
        results.found++
        console.log(`  ✓ [${i}] ${community.name} (${community.members || 0} members)`)

        // Batch insert every 20
        if (toInsert.length >= 20) {
          const res = await supa("POST", "communities", toInsert.splice(0, 20))
          if (res.status >= 200 && res.status < 300) results.inserted += 20
          else { results.errors++; console.log(`  Insert err: ${res.status} ${res.body.slice(0,80)}`) }
        }
      } else if (!community) {
        // Skip silently — many codes won't exist
      }
    } catch(e) {
      results.errors++
      console.log(`  ERR [${i}]: ${e.message}`)
    }

    // Progress every 100
    if (i % 100 === 0) {
      console.log(`\n--- Progress: ${i}/3000 | Found: ${results.found} | Inserted: ${results.inserted} | ${new Date().toISOString()} ---\n`)
      // Insert any remaining batch
      if (toInsert.length > 0) {
        const res = await supa("POST", "communities", [...toInsert])
        if (res.status >= 200 && res.status < 300) results.inserted += toInsert.length
        toInsert.length = 0
      }
    }

    // Rate limit: 2.5 seconds between requests
    await sleep(2500)
  }

  // Final insert
  if (toInsert.length > 0) {
    const res = await supa("POST", "communities", toInsert)
    if (res.status >= 200 && res.status < 300) results.inserted += toInsert.length
  }

  const r2 = await supa("GET", "communities?select=count", null)
  console.log(`\n=== DONE ===`)
  console.log(`Fetched: ${results.fetched} | Found: ${results.found} | Inserted: ${results.inserted} | Errors: ${results.errors}`)
  console.log(`Total communities in DB: ${r2.body}`)
  console.log(`Finished: ${new Date().toISOString()}`)
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1) })
