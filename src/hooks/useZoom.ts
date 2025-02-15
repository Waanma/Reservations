import { useEffect, useRef, useState } from 'react';

export function useZoom(
  initialZoom: number = 1,
  minZoom: number = 0.5,
  maxZoom: number = 3,
  zoomFactor: number = 0.1
) {
  const [zoom, setZoom] = useState(initialZoom);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newZoom = e.deltaY < 0 ? zoom + zoomFactor : zoom - zoomFactor;
      setZoom(Math.max(minZoom, Math.min(newZoom, maxZoom)));
    };

    const svgEl = svgRef.current;
    if (svgEl) {
      svgEl.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (svgEl) {
        svgEl.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom, zoomFactor, minZoom, maxZoom]);

  return { zoom, setZoom, svgRef };
}
