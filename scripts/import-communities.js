const https = require("https")
const http  = require("http")

const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

function mgmtQuery(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql })
    const req = https.request({
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

function restInsert(rows) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(rows)
    const req = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: "/rest/v1/communities",
      method: "POST",
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=minimal",
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

// Follow redirects manually
function fetchWithRedirects(url, rangeStart, rangeEnd, maxRedirects=5) {
  return new Promise((resolve, reject) => {
    function doRequest(url, hops) {
      if (hops > maxRedirects) return reject(new Error("Too many redirects"))
      const mod = url.startsWith("https") ? https : http
      const u = new URL(url)
      const opts = {
        hostname: u.hostname, path: u.pathname + u.search, method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
          "Range": `bytes=${rangeStart}-${rangeEnd}`
        }
      }
      const req = mod.request(opts, res => {
        console.log(`  → ${url.slice(0,80)} [${res.statusCode}]`)
        if ([301,302,303,307,308].includes(res.statusCode)) {
          return doRequest(res.headers.location, hops+1)
        }
        let chunks = []; let total = 0
        res.on("data", d => { chunks.push(d); total += d.length })
        res.on("end", () => resolve({ status: res.statusCode, data: Buffer.concat(chunks).toString("utf8"), total }))
      })
      req.on("error", reject)
      req.end()
    }
    doRequest(url, 0)
  })
}

// Stream entire file line by line, following redirects
function streamLines(url, onLine, maxLines) {
  return new Promise((resolve, reject) => {
    function doRequest(url, hops) {
      if (hops > 5) return reject(new Error("Too many redirects"))
      const mod = url.startsWith("https") ? https : http
      const u = new URL(url)
      let lineCount = 0, buffer = "", aborted = false

      const req = mod.request({
        hostname: u.hostname, path: u.pathname + u.search, method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" }
      }, res => {
        console.log(`  Streaming from ${u.hostname}${u.pathname.slice(0,50)} [${res.statusCode}]`)
        if ([301,302,303,307,308].includes(res.statusCode)) {
          return doRequest(res.headers.location, hops+1)
        }
        res.on("data", chunk => {
          if (aborted) return
          buffer += chunk.toString("utf8")
          const lines = buffer.split("\n")
          buffer = lines.pop()
          for (const line of lines) {
            if (aborted) break
            const t = line.trim()
            if (t) { onLine(t); lineCount++ }
            if (maxLines && lineCount >= maxLines) {
              aborted = true; req.destroy(); break
            }
          }
        })
        res.on("end", () => resolve(lineCount))
        res.on("error", reject)
      })
      req.on("error", e => { if (aborted) resolve(lineCount); else reject(e) })
      req.end()
    }
    doRequest(url, 0)
  })
}

async function main() {
  console.log("=== OG Orkut Community Import ===\n")

  const URL = "https://archive.org/download/orkut-community-list/Orkut%20Community%20List.txt"

  // Step 1: Peek at first 3KB
  console.log("Step 1: Peeking at file format (first 3KB)...")
  try {
    const peek = await fetchWithRedirects(URL, 0, 3000)
    console.log(`Response: ${peek.status}, bytes: ${peek.total}`)
    console.log("First 2000 chars:")
    console.log(peek.data.slice(0, 2000))
    console.log("\n---\n")
  } catch(e) {
    console.log(`Peek failed: ${e.message}`)
  }

  // Step 2: Check communities table
  console.log("Step 2: Checking communities table...")
  let r = await mgmtQuery("SELECT count(*) FROM communities")
  console.log(`Existing: ${r.body}`)

  // Step 3: Add orkut_code column
  r = await mgmtQuery("ALTER TABLE communities ADD COLUMN IF NOT EXISTS orkut_code text UNIQUE")
  console.log(`Column add: ${r.status} — ${r.body.slice(0,100)}`)

  // Step 4: Stream and parse
  console.log("\nStep 3: Streaming communities (up to 200K lines)...")
  const communities = []
  let linesSeen = 0

  await streamLines(URL, (line) => {
    linesSeen++
    if (linesSeen <= 15) console.log(`  [${linesSeen}] ${line.slice(0,120)}`)

    // Parse multiple possible formats
    let name, code, category, members_count

    // Tab separated?
    if (line.includes("\t")) {
      const p = line.split("\t")
      ;[code, name, category, members_count] = p
    }
    // Pipe separated?
    else if (line.includes("|")) {
      const p = line.split("|")
      ;[code, name, category, members_count] = p
    }
    // Comma separated?
    else if (line.includes(",")) {
      const p = line.split(",")
      ;[code, name, category, members_count] = p
    }
    // Just a name?
    else {
      name = line; code = null; category = "Geral"; members_count = 0
    }

    name = (name||"").trim()
    code = (code||"").trim()
    category = (category||"Geral").trim() || "Geral"
    members_count = parseInt((members_count||"0").replace(/[^0-9]/g,"")) || 0

    if (name && name.length > 1 && name.length < 300) {
      communities.push({ name, code: code||null, category, members_count })
    }
  }, 200000)

  console.log(`\nLines seen: ${linesSeen}`)
  console.log(`Communities parsed: ${communities.length}`)
  console.log("\nSample (first 10):")
  communities.slice(0,10).forEach(c => console.log(`  ${JSON.stringify(c)}`))

  if (communities.length === 0) {
    console.log("⚠️ No communities parsed — check format above"); process.exit(0)
  }

  // Step 5: Insert in batches
  console.log(`\nStep 4: Inserting ${communities.length} communities...`)

  // Map to DB schema, skip duplicates by name
  const seen = new Set()
  const rows = []
  for (const c of communities) {
    const key = c.name.toLowerCase().slice(0, 50)
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      name:          c.name.slice(0, 200),
      category:      c.category.slice(0, 100) || "Geral",
      description:   null,
      seed:          c.code ? c.code.replace(/[^a-z0-9]/gi,"").slice(0,20) : ("s"+rows.length),
      members_count: c.members_count,
      orkut_code:    c.code || null,
    })
  }

  console.log(`Unique communities: ${rows.length}`)

  let inserted = 0, errors = 0
  const BATCH = 200
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i+BATCH)
    const res = await restInsert(batch)
    if (res.status >= 200 && res.status < 300) {
      inserted += batch.length
    } else {
      errors++
      if (errors <= 3) console.log(`  Batch error ${i}: ${res.status} — ${res.body.slice(0,150)}`)
    }
    if (i % 10000 === 0 && i > 0) console.log(`  Progress: ${inserted} inserted, ${i} processed`)
  }

  // Final count
  r = await mgmtQuery("SELECT count(*) FROM communities")
  console.log(`\n✅ Done! Inserted: ${inserted}, Errors: ${errors}`)
  console.log(`Total in DB: ${r.body}`)
}

main().catch(e => { console.error("FATAL:", e.message, e.stack); process.exit(1) })
