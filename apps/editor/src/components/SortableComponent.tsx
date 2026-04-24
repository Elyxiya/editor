import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const { selectComponent, removeComponent } = useEditorStore();
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: component.id,
      data: {
        type: 'move',
        componentId: component.id,
      },
    });

  const style: React.CSSProperties = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }),
    [transform, transition, isDragging]
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(component.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeComponent(component.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.component} ${isSelected ? styles.selected : ''} ${
        isDragging ? styles.dragging : ''
      }`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      {isSelected && (
        <div className={styles.toolbar}>
          <span className={styles.label}>{component.label}</span>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            ×
          </button>
        </div>
      )}
      <div className={styles.content}>
        <DynamicComponent component={component} />
      </div>
    </div>
  );
};
