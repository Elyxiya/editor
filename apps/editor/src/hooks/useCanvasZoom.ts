import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export function useCanvasZoom() {
  const { zoom, setZoom } = useEditorStore() as {
    zoom: number;
    setZoom: (z: number) => void;
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;

    e.preventDefault();

    const delta = -e.deltaY;
    let newZoom: number;

    if (delta > 0) {
      newZoom = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
    } else {
      newZoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
    }

    const clamped = Math.round(newZoom * 10) / 10;
    if (clamped !== zoom) {
      setZoom(clamped);
    }
  }, [zoom, setZoom]);

  useEffect(() => {
    const canvasArea = document.querySelector('[class*="canvasArea"]');
    if (canvasArea) {
      canvasArea.addEventListener('wheel', handleWheel as EventListener, { passive: false });
      return () => canvasArea.removeEventListener('wheel', handleWheel as EventListener);
    }

    window.addEventListener('wheel', handleWheel as EventListener, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel as EventListener);
  }, [handleWheel]);
}
