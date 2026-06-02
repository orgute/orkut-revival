const https = require("https")
const http  = require("http")

function fetchWithRedirects(url, rangeEnd, hops=0) {
  return new Promise((resolve, reject) => {
    if (hops > 8) return reject(new Error("Too many redirects"))
    const mod = url.startsWith("https") ? https : http
    const u = new URL(url)
    const req = mod.request({
      hostname: u.hostname, path: u.pathname + u.search, method: "GET",
      headers: { "User-Agent": "ia_downloader/1.0", "Range": `bytes=0-${rangeEnd}` }
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const loc = res.headers.location.startsWith("http") ? res.headers.location : `https://${u.hostname}${res.headers.location}`
        return fetchWithRedirects(loc, rangeEnd, hops+1).then(resolve).catch(reject)
      }
      const chunks = []
      res.on("data", d => chunks.push(d))
      res.on("end", () => resolve({ status: res.statusCode, data: Buffer.concat(chunks).toString("utf8") }))
    })
    req.on("error", reject)
    req.end()
  })
}

async function main() {
  const URL = "https://archive.org/download/orkut-community-list/Orkut%20Community%20List.txt"
  console.log("Fetching first 5KB...")
  const r = await fetchWithRedirects(URL, 5000)
  console.log(`Status: ${r.status}`)
  console.log("--- RAW CONTENT ---")
  // Show hex for first 500 chars to see separators
  const sample = r.data.slice(0, 500)
  console.log("Text:", JSON.stringify(sample))
  console.log("\nLines:")
  r.data.split("\n").slice(0, 30).forEach((l, i) => console.log(`[${i+1}] ${JSON.stringify(l)}`))
}
main().catch(e => { console.error(e.message); process.exit(1) })
