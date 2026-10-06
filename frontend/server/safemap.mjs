// Shared by Vite development and preview. The Safemap service key stays on Node.
const ENDPOINT = 'https://www.safemap.go.kr/openapi2/IF_0087_WMS';
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function buildSafemapUrl(params, serviceKey) {
  const raw = params.get('bbox') || '';
  const box = raw.split(',').map(Number);
  const [west, south, east, north] = box;
  const width = Number(params.get('width'));
  const height = Number(params.get('height'));
  if (box.length !== 4 || raw.split(',').some((x) => !x.trim()) || !box.every(Number.isFinite)
    || west < 120 || east > 135 || south < 30 || north > 44
    || west >= east || south >= north || east - west > 0.3 || north - south > 0.3
    || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || width > 1024 || height > 1024) {
    throw new Error('INVALID_BOUNDS');
  }
  let key = serviceKey.trim();
  // Accept either a raw key or the URL-encoded key copied from the portal.
  try { key = decodeURIComponent(key); } catch { /* already raw */ }
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    serviceKey: key, service: 'WMS', request: 'GetMap', version: '1.1.1',
    layers: 'A2SM_CRMNLHSPOT_TOT', styles: 'A2SM_CrmnlHspot_Tot_Tot',
    srs: 'EPSG:4326', bbox: box.join(','), format: 'image/png',
    width: String(width), height: String(height), transparent: 'TRUE',
  }).toString();
  return url;
}

export function createSafemapMiddleware({ serviceKey = '', fetchImpl = fetch } = {}) {
  const cache = new Map();
  const json = (res, status, code) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ code }));
  };
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/safemap/')) return next();
    if (req.method !== 'GET') return json(res, 405, 'METHOD_NOT_ALLOWED');
    if (url.pathname === '/safemap/status') {
      return json(res, 200, serviceKey.trim() ? 'READY' : 'MISSING_KEY');
    }
    if (url.pathname !== '/safemap/wms') return json(res, 404, 'NOT_FOUND');
    if (!serviceKey.trim()) return json(res, 503, 'MISSING_KEY');
    let upstream;
    try { upstream = buildSafemapUrl(url.searchParams, serviceKey); }
    catch { return json(res, 400, 'INVALID_BOUNDS'); }
    const cacheKey = upstream.searchParams.get('bbox') + ':' + upstream.searchParams.get('width') + ':' + upstream.searchParams.get('height');
    const cached = cache.get(cacheKey);
    const send = (bytes) => {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' });
      res.end(bytes);
    };
    if (cached && Date.now() - cached.time < 300000) return send(cached.bytes);
    const controller = new AbortController();
    const onClose = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', onClose);
    try {
      const response = await fetchImpl(upstream, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        headers: { Accept: 'image/png' },
      });
      if (!response.ok) return json(res, 502, 'UPSTREAM_ERROR');
      const bytes = Buffer.from(await response.arrayBuffer());
      // The portal can return an XML/JSON service error with HTTP 200.
      if (!bytes.subarray(0, 8).equals(PNG)) return json(res, 502, 'NOT_AN_IMAGE');
      if (cache.size >= 32) cache.delete(cache.keys().next().value);
      cache.set(cacheKey, { bytes, time: Date.now() });
      if (!res.destroyed) send(bytes);
    } catch {
      if (!res.destroyed) json(res, 502, 'UPSTREAM_ERROR');
    } finally {
      res.off('close', onClose);
    }
  };
}

export function safemapPlugin(serviceKey) {
  return {
    name: 'safemap-wms-proxy',
    configureServer(server) { server.middlewares.use(createSafemapMiddleware({ serviceKey })); },
    configurePreviewServer(server) { server.middlewares.use(createSafemapMiddleware({ serviceKey })); },
  };
}
