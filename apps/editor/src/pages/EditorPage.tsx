import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from '@dnd-kit/core';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ComponentLibrary } from '@/components/ComponentLibrary';
import { Canvas } from '@/components/Canvas';
import { PropertyPanel } from '@/components/PropertyPanel';
import { useEditorStore } from '@/store/editorStore';
import { getComponentMeta } from '@lowcode/components';

export const EditorPage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>();
  const { schema, setSchema, addComponent, moveComponent, activeId, setActiveId } = useEditorStore() as any;

  useEffect(() => {
    if (pageId) {
      loadPage(pageId);
    }
  }, [pageId]);

  const loadPage = async (id: string) => {
    try {
      const res = await fetch(`/api/pages/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSchema(data.schema);
      }
    } catch (error) {
      console.error('Failed to load page:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'component') {
      const componentType = activeData.componentType;
      const targetId = over.id === 'canvas' ? null : (over.id as string);
      const position = overData?.position || 'inside';
      addComponent(componentType, targetId, position);
    } else if (activeData?.type === 'move') {
      const sourceId = activeData.componentId;
      const targetId = over.id === 'canvas' ? null : (over.id as string);
      const position = overData?.position || 'inside';
      moveComponent(sourceId, targetId, position);
    }
  };

  return (
    <DndContext collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <EditorToolbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: 240, background: '#fff', borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}>
            <ComponentLibrary />
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#f5f5f5' }}>
            <Canvas />
          </div>
          <div style={{ width: 300, background: '#fff', borderLeft: '1px solid #f0f0f0', overflowY: 'auto' }}>
            <PropertyPanel />
          </div>
        </div>
      </div>
    </DndContext>
  );
};
