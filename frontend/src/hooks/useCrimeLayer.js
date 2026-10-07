import { useEffect, useRef } from 'react';
import { createCrimeOverlay } from '../map/crimeOverlay';

export function useCrimeLayer(map, containerRef, enabled, opacity = 0.65, onStatus) {
  const overlayRef = useRef(null);
  const opacityRef = useRef(opacity);
  useEffect(() => {
    opacityRef.current = opacity;
    if (overlayRef.current) overlayRef.current.node.style.opacity = String(opacity);
  }, [opacity]);

  useEffect(() => {
    if (!map || !enabled) return undefined;
    const { kakao } = window;
    let controller;
    let timer;
    let generation = 0;
    let disposed = false;
    let bitmap;
    const clear = () => {
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
      bitmap?.close(); bitmap = null;
    };
    const load = async () => {
      const current = ++generation;
      controller?.abort();
      controller = new AbortController();
      const { signal } = controller;
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
      const bbox = [sw.getLng(), sw.getLat(), ne.getLng(), ne.getLat()];
      if (map.getLevel() > 7 || bbox[2] - bbox[0] > 0.3 || bbox[3] - bbox[1] > 0.3) {
        clear(); onStatus?.('zoom'); return;
      }
      if (bbox[0] < 120 || bbox[2] > 135 || bbox[1] < 30 || bbox[3] > 44) {
        clear(); onStatus?.('outside'); return;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;
      const scale = Math.min(1, 1024 / rect.width, 1024 / rect.height);
      const params = new URLSearchParams({ bbox: bbox.join(','), width: String(Math.max(1, Math.round(rect.width * scale))), height: String(Math.max(1, Math.round(rect.height * scale))) });
      onStatus?.('loading');
      try {
        const response = await fetch(`/safemap/wms?${params}`, { signal });
        if (!response.ok || !response.headers.get('content-type')?.includes('image/png')) {
          const detail = await response.json().catch(() => ({}));
          if (!disposed && current === generation) { clear(); onStatus?.(detail.code === 'MISSING_KEY' ? 'missing-key' : 'error'); }
          return;
        }
        const nextBitmap = await createImageBitmap(await response.blob());
        if (disposed || signal.aborted || current !== generation) { nextBitmap.close(); return; }
        clear();
        bitmap = nextBitmap;
        overlayRef.current = createCrimeOverlay(kakao, bitmap, bbox, opacityRef.current);
        overlayRef.current.setMap(map);
        // A transparent result is not proof that an area is safe.
        onStatus?.('ok');
      } catch (error) {
        if (!disposed && current === generation && error.name !== 'AbortError') { clear(); onStatus?.('error'); }
      }
    };
    const schedule = () => {
      // Invalidate before the debounce so a previous view cannot finish late.
      generation++; controller?.abort(); clearTimeout(timer);
      timer = setTimeout(load, 250);
    };
    const onZoom = () => { generation++; controller?.abort(); clearTimeout(timer); clear(); };
    kakao.maps.event.addListener(map, 'idle', schedule);
    kakao.maps.event.addListener(map, 'zoom_start', onZoom);
    const observer = new ResizeObserver(schedule);
    if (containerRef.current) observer.observe(containerRef.current);
    schedule();
    return () => {
      disposed = true; generation++; clearTimeout(timer); controller?.abort(); observer.disconnect();
      kakao.maps.event.removeListener(map, 'idle', schedule);
      kakao.maps.event.removeListener(map, 'zoom_start', onZoom);
      clear();
    };
  }, [map, containerRef, enabled, onStatus]);
}
