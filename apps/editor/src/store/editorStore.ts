import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PageSchema, PageComponent } from '@lowcode/types';
import { createEmptyPageSchema, generateComponentId, insertComponent, removeComponentById, updateComponentProps, moveComponent as moveComponentHelper, findComponentById, cloneComponent } from '@lowcode/schema';
import { getComponentMeta } from '@lowcode/components';

interface HistoryState {
  past: PageSchema[];
  present: PageSchema;
  future: PageSchema[];
}

interface EditorState {
  schema: PageSchema;
  selectedId: string | null;
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
