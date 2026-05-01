import React, { useMemo, useEffect, memo } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CopyOutlined, ScissorOutlined, DeleteOutlined, VerticalAlignTopOutlined, VerticalAlignBottomOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useEditorStore } from '@/store/editorStore';
import { DynamicComponent } from './DynamicComponent';
import type { PageComponent } from '@lowcode/types';
import styles from './SortableComponent.module.css';

interface SortableComponentProps {
  component: PageComponent;
  isSelected: boolean;
}

interface LayerActions {
  bringToTop: () => void;
  sendToBottom: () => void;
  moveUp: () => void;
  moveDown: () => void;
  removeComponent: (id: string) => void;
  copyComponent: (id: string) => void;
  cutComponent: (id: string) => void;
  setOverContainerId: (id: string | null) => void;
  overContainerId: string | null;
}

const useLayerActions = (): LayerActions => {
  const bringToTop = useEditorStore((s) => s.bringToTop);
  const sendToBottom = useEditorStore((s) => s.sendToBottom);
  const moveUp = useEditorStore((s) => s.moveUp);
  const moveDown = useEditorStore((s) => s.moveDown);
  const removeComponent = useEditorStore((s) => s.removeComponent);
  const copyComponent = useEditorStore((s) => s.copyComponent);
  const cutComponent = useEditorStore((s) => s.cutComponent);
  const setOverContainerId = useEditorStore((s) => s.setOverContainerId);
  const overContainerId = useEditorStore((s) => s.overContainerId);
  return { bringToTop, sendToBottom, moveUp, moveDown, removeComponent, copyComponent, cutComponent, setOverContainerId, overContainerId };
};

interface SelectionActions {
  selectComponent: (id: string | null) => void;
  toggleComponentSelection: (id: string) => void;
  selectedId: string | null;
}

const useSelectionActions = (): SelectionActions => {
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const toggleComponentSelection = useEditorStore((s) => s.toggleComponentSelection);
  const selectedId = useEditorStore((s) => s.selectedId);
  return { selectComponent, toggleComponentSelection, selectedId };
};

const SortableComponentInner: React.FC<SortableComponentProps> = ({
  component,
  isSelected,
}) => {
  const { bringToTop, sendToBottom, moveUp, moveDown, removeComponent, copyComponent, cutComponent, setOverContainerId, overContainerId } = useLayerActions();
  const { selectComponent, toggleComponentSelection } = useSelectionActions();

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

  const { selectedId: selId } = useEditorStore();
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

  const handleBringToTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    bringToTop();
  };

  const handleSendToBottom = (e: React.MouseEvent) => {
    e.stopPropagation();
    sendToBottom();
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveUp();
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    moveDown();
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
            <Tooltip title="置顶" mouseEnterDelay={0.3}>
              <button className={styles.actionBtn} onClick={handleBringToTop}>
                <VerticalAlignTopOutlined />
              </button>
            </Tooltip>
            <Tooltip title="上移" mouseEnterDelay={0.3}>
              <button className={styles.actionBtn} onClick={handleMoveUp}>
                <ArrowUpOutlined />
              </button>
            </Tooltip>
            <Tooltip title="下移" mouseEnterDelay={0.3}>
              <button className={styles.actionBtn} onClick={handleMoveDown}>
                <ArrowDownOutlined />
              </button>
            </Tooltip>
            <Tooltip title="置底" mouseEnterDelay={0.3}>
              <button className={styles.actionBtn} onClick={handleSendToBottom}>
                <VerticalAlignBottomOutlined />
              </button>
            </Tooltip>
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
                isSelected={selId === child.id}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};

export const SortableComponent = memo(SortableComponentInner, (prev, next) => {
  return (
    prev.component.id === next.component.id &&
    prev.isSelected === next.isSelected &&
    prev.component.label === next.component.label
  );
});
