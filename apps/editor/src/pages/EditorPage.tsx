import React, { useEffect, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, CollisionDetection, closestCenter, pointerWithin } from '@dnd-kit/core';
import { EditorToolbar } from '@/components/EditorToolbar';
import { EditorStatusBar } from '@/components/EditorStatusBar';
import { ComponentLibrary } from '@/components/ComponentLibrary';
import { Canvas } from '@/components/Canvas';
import { PropertyPanel } from '@/components/PropertyPanel';
import { useEditorStore } from '@/store/editorStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCanvasZoom } from '@/hooks/useCanvasZoom';
import { getComponentMeta } from '@lowcode/components';
import styles from './EditorPage.module.css';

/**
 * Collision detection: prefer the most specific (smallest) element under the pointer.
 * Canvas (1440×600) must never win over a small sortable component.
 */
const smartCollisionDetection: CollisionDetection = (args) => {
  // pointerWithin: finds all droppable containers under the pointer
  const collisions = pointerWithin(args);
  if (collisions.length === 0) return closestCenter(args);

  // Sort by area ascending → smallest element wins (most specific)
  const sorted = [...collisions].sort((a, b) => {
    const ra = ((a as any).rect?.rect) ?? { width: Infinity, height: Infinity };
    const rb = ((b as any).rect?.rect) ?? { width: Infinity, height: Infinity };
    return (ra.width * ra.height) - (rb.width * rb.height);
  });

  return [sorted[0]];
};

export const EditorPage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>();
  const setSchema = useEditorStore((s) => s.setSchema);
  const addComponent = useEditorStore((s) => s.addComponent);
  const moveComponent = useEditorStore((s) => s.moveComponent);
  const setActiveId = useEditorStore((s) => s.setActiveId);
  const overContainerId = useEditorStore((s) => s.overContainerId);
  const setOverContainerId = useEditorStore((s) => s.setOverContainerId);
  const device = useEditorStore((s) => s.device);
  const [activeDragData, setActiveDragData] = useState<{ type: string; componentType?: string; componentId?: string } | null>(null);
  const [dragPreviewComponent, setDragPreviewComponent] = useState<{ label: string } | null>(null);

  useKeyboardShortcuts();
  useCanvasZoom();

  const loadPage = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/pages/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSchema(data.schema);
      }
    } catch (error) {
      console.error('Failed to load page:', error);
    }
  }, [setSchema]);

  useEffect(() => {
    if (pageId) {
      loadPage(pageId);
    }
  }, [pageId, loadPage]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const data = event.active.data.current as { type: string; componentType?: string; componentId?: string } | undefined;
    setActiveDragData(data ?? null);

    // Capture current component info for preview
    if (data?.type === 'move') {
      const currentSchema = useEditorStore.getState().schema;
      const comp = currentSchema.page.components.find((c) => c.id === data.componentId);
      setDragPreviewComponent(comp ? { label: comp.label ?? '' } : null);
    } else if (data?.type === 'component') {
      const meta = getComponentMeta(data.componentType ?? '');
      setDragPreviewComponent(meta ? { label: meta.label ?? '' } : null);
    } else {
      setDragPreviewComponent(null);
    }
  }, [setActiveId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    setActiveDragData(null);
    setDragPreviewComponent(null);
    setOverContainerId(null);

    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const resolveTarget = (): { targetId: string | null; position: 'before' | 'after' | 'inside' } => {
      const overId = String(over.id);

      // Pointer was inside a container drop zone (tracked by SortableComponent via useDroppable)
      if (overContainerId) return { targetId: overContainerId, position: 'inside' };

      // Dropped directly on a container's drop zone droppable
      if (overData?.type === 'dropZone') {
        return { targetId: overData.containerId, position: 'inside' };
      }

      // Dropped on the canvas background → append to root level
      if (overId === 'canvas') return { targetId: null, position: 'after' };

      // Dropped on a non-container sortable → insert after it (sibling)
      if (overData?.type !== 'container') {
        return { targetId: overId, position: 'after' };
      }

      // Dropped directly on a container (not inside its drop zone) → insert as sibling after it
      return { targetId: overId, position: 'after' };
    };

    const { targetId, position } = resolveTarget();

    if (activeData?.type === 'component') {
      addComponent(activeData.componentType, targetId, position);
    } else if (activeData?.type === 'move') {
      if (String(active.id) !== String(over.id)) {
        moveComponent(activeData.componentId, targetId, position);
      }
    }
  }, [addComponent, moveComponent, setActiveId, setOverContainerId, overContainerId]);

  const renderDragPreview = () => {
    if (!dragPreviewComponent) return null;

    const isMove = activeDragData?.type === 'move';
    return (
      <div style={{
        padding: '8px 16px',
        background: isMove ? '#e6f4ff' : '#fff',
        border: '1px solid #1677ff',
        borderRadius: 4,
        color: '#1677ff',
        fontSize: 14,
        opacity: 0.8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        {dragPreviewComponent.label}
      </div>
    );
  };

  const deviceFrameClass =
    device === 'mobile'
      ? styles.deviceMobile
      : device === 'tablet'
        ? styles.deviceTablet
        : styles.deviceDesktop;

  return (
    <DndContext
      collisionDetection={smartCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <EditorToolbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ width: 240, background: '#fff', borderRight: '1px solid #f0f0f0', overflowY: 'auto', flexShrink: 0 }}>
            <ComponentLibrary />
          </div>
          <div
            className={`${styles.canvasArea} ${deviceFrameClass}`}
            style={{ flex: 1, overflow: 'auto', position: 'relative' }}
          >
            <div className={`${styles.deviceFrame} ${device === 'mobile' ? styles.mobileFrame : device === 'tablet' ? styles.tabletFrame : ''}`}>
              <Canvas />
            </div>
          </div>
          <div style={{ width: 360, background: '#fff', borderLeft: '1px solid #f0f0f0', overflowY: 'auto', flexShrink: 0 }}>
            <PropertyPanel />
          </div>
        </div>
        <EditorStatusBar />
      </div>
      <DragOverlay>
        {renderDragPreview()}
      </DragOverlay>
    </DndContext>
  );
};
