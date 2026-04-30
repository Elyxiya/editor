import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Empty } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import { SortableComponent } from './SortableComponent';
import { DEVICE_WIDTHS } from '@lowcode/utils';
import styles from './Canvas.module.css';

export const Canvas: React.FC = () => {
  const { schema, selectedId, device, selectComponent } = useEditorStore();
  const { setNodeRef: setCanvasRef, isOver: isCanvasOver } = useDroppable({ id: 'canvas' });

  const componentIds = useMemo(
    () => schema.page.components.map((c) => c.id),
    [schema.page.components]
  );

  const canvasWidth = DEVICE_WIDTHS[device];

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains(styles.canvasBody)) {
      selectComponent(null);
    }
  };

  return (
    <div className={styles.canvasWrapper}>
      <div
        ref={setCanvasRef}
        className={`${styles.canvas} ${isCanvasOver ? styles.dragOver : ''}`}
        style={{
          width: canvasWidth,
          minHeight: 600,
        }}
      >
        <div className={styles.canvasHeader}>
          <span className={styles.canvasTitle}>{schema.page.title}</span>
          <span className={styles.canvasSize}>{canvasWidth}px</span>
        </div>

        <div className={styles.canvasBody} onClick={handleCanvasClick}>
          {schema.page.components.length === 0 ? (
            <Empty
              className={styles.empty}
              description="从左侧拖拽组件到这里"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <SortableContext
              items={componentIds}
              strategy={verticalListSortingStrategy}
            >
              {schema.page.components.map((component) => (
                <SortableComponent
                  key={component.id}
                  component={component}
                  isSelected={selectedId === component.id}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
};
