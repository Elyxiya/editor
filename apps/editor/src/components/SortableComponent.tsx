import React, { useMemo, useEffect } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CopyOutlined, ScissorOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import { DynamicComponent } from './DynamicComponent';
import type { PageComponent } from '@lowcode/types';
import styles from './SortableComponent.module.css';

interface SortableComponentProps {
  component: PageComponent;
  isSelected: boolean;
}

export const SortableComponent: React.FC<SortableComponentProps> = ({
  component,
  isSelected,
}) => {
  const {
    selectComponent,
    toggleComponentSelection,
    removeComponent,
    copyComponent,
    cutComponent,
    selectedId,
    setOverContainerId,
    overContainerId,
  } = useEditorStore();

  const isContainer = component.children !== undefined;

  const {
    setNodeRef,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: component.id,
    data: {
      type: isContainer ? 'container' : 'move',
      componentId: component.id,
    },
  });

  const dropZoneId = `${component.id}-drop-zone`;
  const {
    setNodeRef: setDropZoneRef,
    isOver: isOverDropZone,
  } = useDroppable({
    id: dropZoneId,
    data: { type: 'dropZone', containerId: component.id },
  });

  useEffect(() => {
    if (isOverDropZone && isContainer) {
      setOverContainerId(component.id);
    } else if (!isOverDropZone && !isDragging) {
      if (overContainerId === component.id) {
        setOverContainerId(null);
      }
    }
  }, [isOverDropZone, isContainer, component.id, isDragging, overContainerId]);

  const style: React.CSSProperties = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isSelected ? 100 : 1,
    }),
    [transform, transition, isDragging, isSelected]
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      toggleComponentSelection(component.id);
    } else {
      selectComponent(component.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeComponent(component.id);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyComponent(component.id);
  };

  const handleCut = (e: React.MouseEvent) => {
    e.stopPropagation();
    cutComponent(component.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.component} ${isSelected ? styles.selected : ''} ${
        isDragging ? styles.dragging : ''
      } ${isOver ? styles.dragOver : ''}`}
      onClick={handleClick}
    >
      {isSelected && (
        <div className={styles.toolbar}>
          <span className={styles.label} style={{ cursor: 'grab' }} {...listeners}>
            {component.label}
          </span>
          <div className={styles.actions}>
            <Tooltip title="复制" mouseEnterDelay={0.3}>
              <button className={styles.actionBtn} onClick={handleCopy}>
                <CopyOutlined />
              </button>
            </Tooltip>
            <Tooltip title="剪切" mouseEnterDelay={0.3}>
              <button className={styles.actionBtn} onClick={handleCut}>
                <ScissorOutlined />
              </button>
            </Tooltip>
            <Tooltip title="删除" mouseEnterDelay={0.3}>
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={handleDelete}
              >
                <DeleteOutlined />
              </button>
            </Tooltip>
          </div>
        </div>
      )}
      <div className={styles.content}>
        <DynamicComponent component={component} />
      </div>
      {isContainer && (
        <div
          ref={setDropZoneRef}
          className={`${styles.dropZone} ${isOverDropZone ? styles.dropZoneActive : ''}`}
        >
          <SortableContext
            items={component.children?.map((c) => c.id) || []}
            strategy={verticalListSortingStrategy}
          >
            {component.children?.map((child) => (
              <SortableComponent
                key={child.id}
                component={child}
                isSelected={selectedId === child.id}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};
