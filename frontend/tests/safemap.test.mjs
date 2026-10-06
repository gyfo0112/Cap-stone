import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { buildSafemapUrl, createSafemapMiddleware } from '../server/safemap.mjs';
import { createCrimeOverlay } from '../src/map/crimeOverlay.js';

const query = 'bbox=126.97,37.56,126.98,37.57&width=256&height=256';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==', 'base64');

async function withServer(options, run) {
  const middleware = createSafemapMiddleware(options);
  const server = createServer((req, res) => middleware(req, res, () => { res.writeHead(404); res.end(); }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('WMS uses longitude-first bounds, original layer/style and transparent PNG; key is encoded once', () => {
  for (const key of ['a+b/c==', 'a%2Bb%2Fc%3D%3D']) {
    const url = buildSafemapUrl(new URLSearchParams(query), key);
    assert.equal(url.origin, 'https://www.safemap.go.kr');
    assert.equal(url.searchParams.get('serviceKey'), 'a+b/c==');
    assert.equal(url.searchParams.get('transparent'), 'TRUE');
    assert.equal(url.searchParams.get('srs'), 'EPSG:4326');
    assert.equal(url.searchParams.get('format'), 'image/png');
    assert.equal(url.searchParams.get('bbox'), '126.97,37.56,126.98,37.57');
  }
});

test('invalid or oversized image requests never reach upstream', () => {
  for (const value of ['bbox=126,37,125,38&width=256&height=256', query.replace('width=256', 'width=10000'), query.replace('126.97', 'NaN')]) {
    assert.throws(() => buildSafemapUrl(new URLSearchParams(value), 'key'), /INVALID_BOUNDS/);
  }
});

test('missing credentials give a clear local error without leaking or sending a key', async () => {
  await withServer({ fetchImpl: () => { throw new Error('must not fetch'); } }, async (base) => {
    assert.equal((await (await fetch(`${base}/safemap/status`)).json()).code, 'MISSING_KEY');
    const response = await fetch(`${base}/safemap/wms?${query}`);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'MISSING_KEY');
  });
});

test('valid PNG passes through unchanged and repeated bounds use a bounded cache', async () => {
  let calls = 0;
  await withServer({ serviceKey: 'private-key', fetchImpl: async () => { calls++; return new Response(png); } }, async (base) => {
    for (let i = 0; i < 2; i++) {
      const response = await fetch(`${base}/safemap/wms?${query}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'image/png');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    }
    assert.equal(calls, 1);
    assert.equal(JSON.stringify(await (await fetch(`${base}/safemap/status`)).json()).includes('private-key'), false);
  });
});

test('HTTP-200 service exceptions are errors, not blank safe areas; upstream details stay private', async () => {
  await withServer({ serviceKey: 'private-key', fetchImpl: async () => new Response('<ServiceException>private-key denied</ServiceException>') }, async (base) => {
    const response = await fetch(`${base}/safemap/wms?${query}`);
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { code: 'NOT_AN_IMAGE' });
  });
});

test('geographic raster follows the overlay projection and cleans up its node', () => {
  const transforms = [];
  let attached = false;
  const ctx = { save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, clip() {}, drawImage() {},
    transform(...matrix) { assert.ok(matrix.every(Number.isFinite)); transforms.push(matrix); } };
  const canvas = { style: {}, setAttribute() {}, getContext: () => ctx, remove: () => { attached = false; } };
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => canvas };
  const projection = { pointFromCoords: ({ lat, lng }) => ({ x: (lng - 126) * 1000 + (38 - lat) * 5, y: (38 - lat) * 1000 }) };
  function AbstractOverlay() {}
  AbstractOverlay.prototype.getPanels = () => ({ overlayLayer: { appendChild: () => { attached = true; } } });
  AbstractOverlay.prototype.getProjection = () => projection;
  class LatLng { constructor(lat, lng) { this.lat = lat; this.lng = lng; } }
  try {
    const overlay = createCrimeOverlay({ maps: { AbstractOverlay, LatLng } }, { width: 256, height: 256 }, [126, 37, 127, 38], 0.65);
    overlay.onAdd(); overlay.draw();
    assert.equal(attached, true);
    assert.equal(canvas.style.pointerEvents, 'none');
    assert.equal(canvas.style.opacity, '0.65');
    assert.equal(transforms.length, 12 * 12 * 2);
    const [a, b, c, d, e, f] = transforms[0];
    assert.ok(Math.abs(a * 256 + e - 1000) < 1e-7); // east
    assert.ok(Math.abs(b * 256 + f) < 1e-7);
    assert.ok(Math.abs(c * 256 + e - 5) < 1e-7); // south includes projection shear
    assert.ok(Math.abs(d * 256 + f - 1000) < 1e-7);
    overlay.onRemove(); assert.equal(attached, false);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
