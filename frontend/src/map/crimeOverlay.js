// Warp the geographic WMS raster onto Kakao's projection in small triangles.
// Merely stretching an EPSG:4326 image between two corners causes misalignment.
function paintTriangle(ctx, image, source, target) {
  const [s0, s1, s2] = source;
  const [p0, p1, p2] = target;
  const sx1 = s1.x - s0.x, sy1 = s1.y - s0.y;
  const sx2 = s2.x - s0.x, sy2 = s2.y - s0.y;
  const det = sx1 * sy2 - sx2 * sy1;
  const a = ((p1.x - p0.x) * sy2 - (p2.x - p0.x) * sy1) / det;
  const c = ((p2.x - p0.x) * sx1 - (p1.x - p0.x) * sx2) / det;
  const b = ((p1.y - p0.y) * sy2 - (p2.y - p0.y) * sy1) / det;
  const d = ((p2.y - p0.y) * sx1 - (p1.y - p0.y) * sx2) / det;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
  ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, d, p0.x - a * s0.x - c * s0.y, p0.y - b * s0.x - d * s0.y);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

export function createCrimeOverlay(kakao, image, bbox, opacity) {
  const [west, south, east, north] = bbox;
  function CrimeOverlay() {
    this.node = document.createElement('canvas');
    Object.assign(this.node.style, { position: 'absolute', pointerEvents: 'none', zIndex: '1', opacity: String(opacity) });
    this.node.setAttribute('aria-hidden', 'true');
  }
  CrimeOverlay.prototype = new kakao.maps.AbstractOverlay();
  CrimeOverlay.prototype.onAdd = function () { this.getPanels().overlayLayer.appendChild(this.node); };
  CrimeOverlay.prototype.onRemove = function () { this.node.remove(); };
  CrimeOverlay.prototype.draw = function () {
    const projection = this.getProjection();
    const divisions = 12;
    const points = [];
    for (let y = 0; y <= divisions; y++) {
      for (let x = 0; x <= divisions; x++) {
        points.push(projection.pointFromCoords(new kakao.maps.LatLng(
          north - (north - south) * y / divisions, west + (east - west) * x / divisions,
        )));
      }
    }
    const left = Math.floor(Math.min(...points.map((p) => p.x)));
    const top = Math.floor(Math.min(...points.map((p) => p.y)));
    const width = Math.ceil(Math.max(...points.map((p) => p.x))) - left;
    const height = Math.ceil(Math.max(...points.map((p) => p.y))) - top;
    if (width < 1 || height < 1 || width > 4096 || height > 4096) { this.node.style.display = 'none'; return; }
    Object.assign(this.node.style, { display: 'block', left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    this.node.width = width; this.node.height = height;
    const ctx = this.node.getContext('2d');
    const point = (x, y) => { const p = points[y * (divisions + 1) + x]; return { x: p.x - left, y: p.y - top }; };
    const pixel = (x, y) => ({ x: x * image.width / divisions, y: y * image.height / divisions });
    for (let y = 0; y < divisions; y++) {
      for (let x = 0; x < divisions; x++) {
        paintTriangle(ctx, image, [pixel(x, y), pixel(x + 1, y), pixel(x, y + 1)], [point(x, y), point(x + 1, y), point(x, y + 1)]);
        paintTriangle(ctx, image, [pixel(x + 1, y), pixel(x + 1, y + 1), pixel(x, y + 1)], [point(x + 1, y), point(x + 1, y + 1), point(x, y + 1)]);
      }
    }
  };
  return new CrimeOverlay();
}
