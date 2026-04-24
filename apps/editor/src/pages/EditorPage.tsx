import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ComponentLibrary } from '@/components/ComponentLibrary';
import { Canvas } from '@/components/Canvas';
import { PropertyPanel } from '@/components/PropertyPanel';
import { useEditorStore } from '@/store/editorStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getComponentMeta, getComponent } from '@lowcode/components';

export const EditorPage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>();
  const { schema, setSchema, addComponent, moveComponent, activeId, setActiveId } = useEditorStore() as any;
  const [activeDragData, setActiveDragData] = React.useState<any>(null);

  useKeyboardShortcuts();

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
    setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveDragData(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    // #region agent log
    console.log('[DEBUG dragEnd]', { activeId: String(active.id), overId: String(over.id), activeType: activeData?.type, overSortable: overData?.sortable, componentType: activeData?.componentType });
    // #endregion

    if (activeData?.type === 'component') {
      // 从组件库拖入
      const componentType = activeData.componentType;
      const targetId = over.id === 'canvas' ? null : (over.id as string);
      const position = overData?.sortable ? 'inside' : 'after';
      // #region agent log
      console.log('[DEBUG addComponent args]', { componentType, targetId, position });
      // #endregion
      addComponent(componentType, targetId, position);
    } else if (activeData?.type === 'move') {
      // 画布内移动组件
      if (active.id !== over.id) {
        const sourceId = activeData.componentId;
        const targetId = over.id === 'canvas' ? null : (over.id as string);
        const position = overData?.sortable ? 'inside' : 'after';
        moveComponent(sourceId, targetId, position);
      }
    }
  };

  // 渲染拖拽预览
  const renderDragPreview = () => {
    if (!activeDragData) return null;

    if (activeDragData.type === 'component') {
      // 组件库中的组件
      const meta = getComponentMeta(activeDragData.componentType);
      return (
        <div style={{
          padding: '8px 16px',
          background: '#fff',
          border: '1px dashed #1677ff',
          borderRadius: 4,
          color: '#1677ff',
          fontSize: 14,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {meta?.label || activeDragData.componentType}
        </div>
      );
    }

    if (activeDragData.type === 'move') {
      // 画布中的组件移动
      const component = schema.page.components.find((c: any) => c.id === activeDragData.componentId);
      if (component) {
        return (
          <div style={{
            padding: '8px 16px',
            background: '#e6f4ff',
            border: '1px solid #1677ff',
            borderRadius: 4,
            color: '#1677ff',
            fontSize: 14,
            opacity: 0.8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {component.label}
          </div>
        );
      }
    }

    return null;
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
      <DragOverlay>
        {renderDragPreview()}
      </DragOverlay>
    </DndContext>
  );
};
