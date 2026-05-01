import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PageSchema, PageComponent } from '@lowcode/types';
import { createEmptyPageSchema, generateComponentId, insertComponent, removeComponentById, updateComponentProps, moveComponent as moveComponentHelper, findComponentById, cloneComponent, swapInSiblings, moveToStartOfSiblings, moveToEndOfSiblings, updateComponentInTree } from '@lowcode/schema';
import { getComponentMeta } from '@lowcode/components';

interface HistoryState {
  past: PageSchema[];
  present: PageSchema;
  future: PageSchema[];
}

interface EditorState {
  schema: PageSchema;
  selectedId: string | null;
  selectedIds: string[];
  hoveredId: string | null;
  activeId: string | null;
  overContainerId: string | null;
  zoom: number;
  device: 'pc' | 'tablet' | 'mobile';
  isDragging: boolean;
  isPreview: boolean;
  history: HistoryState;
  isDirty: boolean;
  clipboard: PageComponent | null;
}

interface EditorActions {
  setSchema: (schema: PageSchema) => void;
  updatePageTitle: (title: string) => void;
  selectComponent: (id: string | null) => void;
  toggleComponentSelection: (id: string) => void;
  clearSelection: () => void;
  hoverComponent: (id: string | null) => void;
  setActiveId: (id: string | null) => void;
  setOverContainerId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setDevice: (device: 'pc' | 'tablet' | 'mobile') => void;
  setDragging: (isDragging: boolean) => void;
  setPreview: (isPreview: boolean) => void;

  addComponent: (componentType: string, targetId: string | null, position: 'before' | 'after' | 'inside') => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, props: Record<string, unknown>) => void;
  moveComponent: (sourceId: string, targetId: string | null, position: 'before' | 'after' | 'inside', index?: number) => void;
  duplicateComponent: (id: string) => void;
  pasteComponent: () => void;
  copyComponent: (id: string) => void;
  cutComponent: (id: string) => void;

  alignComponents: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeComponents: (direction: 'horizontal' | 'vertical') => void;
  bringToTop: () => void;
  sendToBottom: () => void;
  moveUp: () => void;
  moveDown: () => void;

  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
  savePage: () => Promise<void>;
  loadPage: (id: string) => Promise<void>;
}

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorState & EditorActions>()(
  immer((set, get) => ({
    schema: createEmptyPageSchema('未命名页面'),
    selectedId: null,
    selectedIds: [],
    hoveredId: null,
    activeId: null,
    overContainerId: null,
    zoom: 1,
    device: 'pc',
    isDragging: false,
    isPreview: false,
    isDirty: false,
    clipboard: null,
    history: {
      past: [],
      present: createEmptyPageSchema('未命名页面'),
      future: [],
    },

    setSchema: (schema) =>
      set((state) => {
        state.schema = schema;
        state.isDirty = true;
      }),

    updatePageTitle: (title) =>
      set((state) => {
        state.schema.page.title = title;
        state.isDirty = true;
      }),

    selectComponent: (id) =>
      set((state) => {
        state.selectedId = id;
        state.selectedIds = id ? [id] : [];
      }),

    toggleComponentSelection: (id) =>
      set((state) => {
        const idx = state.selectedIds.indexOf(id);
        if (idx >= 0) {
          state.selectedIds.splice(idx, 1);
        } else {
          state.selectedIds.push(id);
        }
        state.selectedIds = [...state.selectedIds];
        state.selectedId = state.selectedIds.length > 0 ? state.selectedIds[state.selectedIds.length - 1] : null;
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedId = null;
        state.selectedIds = [];
      }),

    hoverComponent: (id) =>
      set((state) => {
        state.hoveredId = id;
      }),

    setActiveId: (id) =>
      set((state) => {
        state.activeId = id;
      }),

    setOverContainerId: (id) =>
      set((state) => {
        state.overContainerId = id;
      }),

    setZoom: (zoom) =>
      set((state) => {
        state.zoom = zoom;
      }),

    setDevice: (device) =>
      set((state) => {
        state.device = device;
      }),

    setDragging: (isDragging) =>
      set((state) => {
        state.isDragging = isDragging;
      }),

    setPreview: (isPreview) =>
      set((state) => {
        state.isPreview = isPreview;
      }),

    saveSnapshot: () =>
      set((state) => {
        const { past, present } = state.history;
        const newPast = [...past, present].slice(-MAX_HISTORY);
        state.history = {
          past: newPast,
          present: JSON.parse(JSON.stringify(state.schema)),
          future: [],
        };
      }),

    undo: () =>
      set((state) => {
        const { past, present, future } = state.history;
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        const newPast = past.slice(0, -1);

        state.schema = JSON.parse(JSON.stringify(previous));
        state.history = {
          past: newPast,
          present: previous,
          future: [present, ...future],
        };
      }),

    redo: () =>
      set((state) => {
        const { past, present, future } = state.history;
        if (future.length === 0) return;

        const next = future[0];
        const newFuture = future.slice(1);

        state.schema = JSON.parse(JSON.stringify(next));
        state.history = {
          past: [...past, present],
          present: next,
          future: newFuture,
        };
      }),

    addComponent: (componentType, targetId, position) => {
      const meta = getComponentMeta(componentType);
      if (!meta) return;

      const newComponent: PageComponent = {
        id: generateComponentId(),
        type: componentType,
        label: meta.label,
        props: { ...meta.defaultProps },
        children: meta.isContainer ? [] : undefined,
      };

      get().saveSnapshot();

      set((state) => {
        state.schema.page.components = insertComponent(
          state.schema.page.components,
          targetId,
          newComponent,
          position
        );
        state.selectedId = newComponent.id;
        state.isDirty = true;
      });
    },

    removeComponent: (id) => {
      get().saveSnapshot();

      set((state) => {
        state.schema.page.components = removeComponentById(
          state.schema.page.components,
          id
        );
        if (state.selectedId === id) {
          state.selectedId = null;
        }
        state.isDirty = true;
      });
    },

    updateComponent: (id, props) => {
      get().saveSnapshot();

      set((state) => {
        state.schema.page.components = updateComponentProps(
          state.schema.page.components,
          id,
          props
        );
        state.isDirty = true;
      });
    },

    moveComponent: (sourceId, targetId, position, index) => {
      get().saveSnapshot();

      set((state) => {
        state.schema.page.components = moveComponentHelper(
          state.schema.page.components,
          sourceId,
          targetId,
          position,
          index
        );
        state.isDirty = true;
      });
    },

    duplicateComponent: (id) => {
      const component = findComponentById(get().schema.page.components, id);
      if (!component) return;

      get().saveSnapshot();

      const cloned = cloneComponent(component);
      set((state) => {
        state.schema.page.components = insertComponent(
          state.schema.page.components,
          id,
          cloned,
          'after'
        );
        state.selectedId = cloned.id;
        state.isDirty = true;
      });
    },

    pasteComponent: () => {
      const { clipboard, selectedId } = get();
      if (!clipboard) return;

      get().saveSnapshot();

      const cloned = cloneComponent(clipboard);
      set((state) => {
        state.schema.page.components = insertComponent(
          state.schema.page.components,
          selectedId,
          cloned,
          selectedId ? 'after' : 'inside'
        );
        state.selectedId = cloned.id;
        state.isDirty = true;
      });
    },

    copyComponent: (id) => {
      const component = findComponentById(get().schema.page.components, id);
      if (!component) return;
      set({ clipboard: JSON.parse(JSON.stringify(component)) });
    },

    cutComponent: (id) => {
      const component = findComponentById(get().schema.page.components, id);
      if (!component) return;

      get().saveSnapshot();

      set((state) => {
        state.clipboard = JSON.parse(JSON.stringify(component));
        state.schema.page.components = removeComponentById(
          state.schema.page.components,
          id
        );
        if (state.selectedId === id) {
          state.selectedId = null;
        }
        state.isDirty = true;
      });
    },

    alignComponents: (direction) => {
      const { selectedIds } = get();
      if (selectedIds.length < 2) return;

      get().saveSnapshot();

      const components = selectedIds
        .map((id) => findComponentById(get().schema.page.components, id))
        .filter(Boolean) as PageComponent[];

      const props = components.map((c) => (c.props?.style || {}) as Record<string, number>);
      const widths = props.map((p) => p['width'] || 120);
      const heights = props.map((p) => (p.height as number) || 40);

      let targetValue: number;
      switch (direction) {
        case 'left':
          targetValue = Math.min(...props.map((p) => (p.marginLeft as number) || 0));
          break;
        case 'right':
          targetValue = Math.max(...props.map((p, i) => ((p.marginLeft as number) || 0) + widths[i]));
          break;
        case 'center':
          targetValue = props.reduce((sum, p, i) => sum + ((p.marginLeft as number) || 0) + widths[i] / 2, 0) / props.length;
          break;
        case 'top':
          targetValue = Math.min(...props.map((p) => (p.marginTop as number) || 0));
          break;
        case 'bottom':
          targetValue = Math.max(...props.map((p, i) => ((p.marginTop as number) || 0) + heights[i]));
          break;
        case 'middle':
          targetValue = props.reduce((sum, p, i) => sum + ((p.marginTop as number) || 0) + heights[i] / 2, 0) / props.length;
          break;
        default:
          return;
      }

      set((state) => {
        selectedIds.forEach((id, i) => {
          const comp = findComponentById(state.schema.page.components, id);
          if (!comp) return;
          const p = comp.props?.style || {};
          switch (direction) {
            case 'left':
              Object.assign(p, { marginLeft: targetValue });
              break;
            case 'right':
              Object.assign(p, { marginLeft: targetValue - widths[i] });
              break;
            case 'center':
              Object.assign(p, { marginLeft: targetValue - widths[i] / 2 });
              break;
            case 'top':
              Object.assign(p, { marginTop: targetValue });
              break;
            case 'bottom':
              Object.assign(p, { marginTop: targetValue - heights[i] });
              break;
            case 'middle':
              Object.assign(p, { marginTop: targetValue - heights[i] / 2 });
              break;
          }
          if (!comp.props) comp.props = {};
          comp.props.style = { ...p };
        });
        state.isDirty = true;
      });
    },

    distributeComponents: (direction) => {
      const { selectedIds } = get();
      if (selectedIds.length < 3) return;

      get().saveSnapshot();

      const components = selectedIds
        .map((id) => findComponentById(get().schema.page.components, id))
        .filter(Boolean) as PageComponent[];

      const props = components.map((c) => (c.props?.style || {}) as Record<string, number>);
      const sizes = direction === 'horizontal'
        ? props.map((p) => p['marginLeft'] || 0)
        : props.map((p) => p['marginTop'] || 0);
      const dims = direction === 'horizontal'
        ? props.map((p) => p['width'] || 120)
        : props.map((p) => p['height'] || 40);

      const sortedIndices = sizes
        .map((v, i) => ({ v, i }))
        .sort((a, b) => a.v - b.v)
        .map((x) => x.i);

      const totalSpace = sizes[sortedIndices[sortedIndices.length - 1]] + dims[sortedIndices[sortedIndices.length - 1]] - sizes[sortedIndices[0]];
      const totalComponentSize = dims.reduce((s, d) => s + d, 0);
      const gap = (totalSpace - totalComponentSize) / (selectedIds.length - 1);

      const newPositions = new Array(selectedIds.length);
      let current = sizes[sortedIndices[0]];
      for (const idx of sortedIndices) {
        newPositions[idx] = direction === 'horizontal'
          ? { marginLeft: current }
          : { marginTop: current };
        current += dims[idx] + gap;
      }

      set((state) => {
        selectedIds.forEach((id, i) => {
          const comp = findComponentById(state.schema.page.components, id);
          if (!comp) return;
          if (!comp.props) comp.props = {};
          const existingStyle = comp.props.style || {};
          comp.props.style = { ...existingStyle, ...newPositions[i] };
        });
        state.isDirty = true;
      });
    },

    bringToTop: () => {
      const { selectedId } = get();
      if (!selectedId) return;

      get().saveSnapshot();

      set((state) => {
        state.schema.page.components = updateComponentInTree(
          state.schema.page.components,
          selectedId,
          (siblings) => moveToStartOfSiblings(siblings, selectedId)
        );
        state.isDirty = true;
      });
    },

    sendToBottom: () => {
      const { selectedId } = get();
      if (!selectedId) return;

      get().saveSnapshot();

      set((state) => {
        state.schema.page.components = updateComponentInTree(
          state.schema.page.components,
          selectedId,
          (siblings) => moveToEndOfSiblings(siblings, selectedId)
        );
        state.isDirty = true;
      });
    },

    moveUp: () => {
      const { selectedId } = get();
      if (!selectedId) return;

      get().saveSnapshot();

      set((state) => {
        state.schema.page.components = updateComponentInTree(
          state.schema.page.components,
          selectedId,
          (siblings) => swapInSiblings(siblings, selectedId, 'up')
        );
        state.isDirty = true;
      });
    },

    moveDown: () => {
      const { selectedId } = get();
      if (!selectedId) return;

      get().saveSnapshot();

      set((state) => {
        state.schema.page.components = updateComponentInTree(
          state.schema.page.components,
          selectedId,
          (siblings) => swapInSiblings(siblings, selectedId, 'down')
        );
        state.isDirty = true;
      });
    },

    savePage: async () => {
      const { schema } = get();
      const pageId = schema.page.id || 'new';

      try {
        const response = await fetch(`/api/pages/${pageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schema }),
        });

        if (!response.ok) {
          throw new Error('Failed to save page');
        }

        set((state) => {
          state.isDirty = false;
        });
      } catch (error) {
        console.error('Save failed:', error);
        throw error;
      }
    },

    loadPage: async (id) => {
      try {
        const response = await fetch(`/api/pages/${id}`);
        if (!response.ok) {
          throw new Error('Failed to load page');
        }
        const data = await response.json();
        set((state) => {
          state.schema = data.schema;
          state.schema.page.id = id;
        });
      } catch (error) {
        console.error('Load failed:', error);
        throw error;
      }
    },
  }))
);

export const canUndo = (state: EditorState) => state.history.past.length > 0;
export const canRedo = (state: EditorState) => state.history.future.length > 0;
