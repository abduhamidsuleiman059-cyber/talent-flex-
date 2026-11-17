/* TalentFlex service worker
   - App inafunguka haraka hata mtandao ukiwa mbaya au umezimwa
   - Toleo jipya likipatikana, linaiarifu app ionyeshe "Sasisha" */

const CACHE = 'talentflex-v1'
const BASE = new URL(self.registration.scope).pathname
const ORIGIN = self.location.origin

// Orodha ya faili za app (script, css, picha) zilizotajwa kwenye index.html
function collectUrls(html) {
  const urls = new Set([BASE + 'logo.png', BASE + 'manifest.webmanifest'])
  const re = /(?:src|href)=["']([^"']+)["']/g
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1], ORIGIN + BASE)
      if (u.origin === ORIGIN && u.pathname.startsWith(BASE)) {
        urls.add(u.pathname + u.search)
      }
    } catch {
      // ruka
    }
  }
  return urls
}

async function cacheShell(cache, html) {
  const urls = collectUrls(html)
  await Promise.all(
    [...urls].map(async (u) => {
      try {
        // Faili za assets zina majina ya kipekee: zikishahifadhiwa hazihitaji kupakuliwa tena
        if (u.startsWith(BASE + 'assets/') && (await cache.match(u, { ignoreVary: true }))) {
          return
        }
        const res = await fetch(new Request(u, { cache: 'reload' }))
        if (res.ok) await cache.put(u, res)
      } catch {
        // ruka
      }
    })
  )
}

// Futa assets za zamani ambazo hazitumiki tena
async function prune(cache, html) {
  const keep = collectUrls(html)
  const requests = await cache.keys()
  await Promise.all(
    requests.map(async (req) => {
      const u = new URL(req.url)
      if (u.pathname.startsWith(BASE + 'assets/') && !keep.has(u.pathname + u.search)) {
        await cache.delete(req)
      }
    })
  )
}

function notifyUpdate() {
  self.clients
    .matchAll({ type: 'window' })
    .then((clients) => clients.forEach((c) => c.postMessage({ type: 'UPDATE_AVAILABLE' })))
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE)
        const res = await fetch(new Request(BASE, { cache: 'reload' }))
        if (res.ok) {
          const html = await res.clone().text()
          await cache.put(BASE, res)
          await cacheShell(cache, html)
        }
      } catch {
        // ruka
      }
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k.startsWith('talentflex-') && k !== CACHE)
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

// Ukurasa: onyesha nakala iliyohifadhiwa mara moja, kisha angalia toleo jipya nyuma ya pazia
async function handleNavigate(event) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(BASE, { ignoreVary: true })
  const oldText = cached ? await cached.clone().text() : null

  const refresh = (async () => {
    try {
      const res = await fetch(new Request(BASE, { cache: 'no-cache' }))
      if (!res.ok) return null

      const fresh = await res.clone().text()
      if (oldText === null) {
        await cache.put(BASE, res.clone())
        await cacheShell(cache, fresh)
      } else if (oldText !== fresh) {
        await cache.put(BASE, res.clone())
        await cacheShell(cache, fresh)
        await prune(cache, fresh)
        notifyUpdate()
      }
      return res
    } catch {
      return null
    }
  })()

  if (cached) {
    event.waitUntil(refresh)
    return cached
  }

  const res = await refresh
  return (
    res ||
    new Response(
      'Uko offline na app haijahifadhiwa bado. Ifungue mara moja ukiwa na mtandao.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    )
  )
}

// Faili za assets (zina majina ya kipekee): hifadhi kwanza, mtandao ukiwa ndio wa mwisho
async function cacheFirst(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req, { ignoreVary: true })
  if (hit) return hit

  try {
    const res = await fetch(req)
    if (res.ok) await cache.put(req, res.clone())
    return res
  } catch {
    return Response.error()
  }
}

// Faili nyingine (logo, manifest): onyesha iliyohifadhiwa, sasisha nyuma ya pazia
async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req, { ignoreVary: true })

  const update = fetch(req)
    .then(async (res) => {
      if (res.ok) await cache.put(req, res.clone())
      return res
    })
    .catch(() => null)

  if (hit) {
    event.waitUntil(update)
    return hit
  }
  return (await update) || Response.error()
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || req.headers.has('range')) return

  const url = new URL(req.url)
  if (url.origin !== ORIGIN || !url.pathname.startsWith(BASE)) return
  if (url.pathname === BASE + 'sw.js') return

  if (req.mode === 'navigate') {
    event.respondWith(handleNavigate(event))
    return
  }

  if (url.pathname.startsWith(BASE + 'assets/')) {
    event.respondWith(cacheFirst(req))
    return
  }

  event.respondWith(staleWhileRevalidate(event, req))
})