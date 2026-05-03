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
  isPublished: boolean;
  clipboard: PageComponent | null;
  pages: Array<{
    id: string;
    title: string;
    name: string;
    version: number;
    isPublished: boolean;
    updatedAt: string;
  }>;
  pageSchemas: Record<string, PageSchema>;
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
  setPublished: (published: boolean) => void;
  switchPage: (pageId: string) => Promise<void>;
  createPage: (title: string) => void;
  renamePage: (pageId: string, title: string) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  setPagePublished: (pageId: string, published: boolean) => void;
  loadPageList: () => Promise<void>;
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
    isPublished: false,
    clipboard: null,
    pages: [{
      id: 'default',
      title: '未命名页面',
      name: '未命名页面',
      version: 1,
      isPublished: false,
      updatedAt: new Date().toISOString(),
    }],
    pageSchemas: {},
    history: {
      past: [],
      present: createEmptyPageSchema('未命名页面'),
      future: [],
    },

    setSchema: (schema) =>
      set((state) => {
        state.schema = JSON.parse(JSON.stringify(schema));
        state.isDirty = true;
        state.history = {
          past: [],
          present: JSON.parse(JSON.stringify(schema)),
          future: [],
        };
        state.selectedId = null;
        state.selectedIds = [];
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
        const newPast = [...past, JSON.parse(JSON.stringify(present))].slice(-MAX_HISTORY);
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
        state.selectedIds = [newComponent.id];
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
        state.selectedIds = state.selectedIds.filter(sid => sid !== id);
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
        state.selectedIds = state.selectedIds.filter(sid => sid !== id);
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
          // Deep-clone the style object to avoid shared reference mutations
          const p: Record<string, unknown> = { ...((comp.props?.style || {}) as Record<string, unknown>) };
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
          comp.props.style = { ...p } as Record<string, string | number>;
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
      const token = localStorage.getItem('token');

      try {
        const response = await fetch(`/api/pages/${pageId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
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
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/api/pages/${id}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load page');
        }
        const data = await response.json();
        set((state) => {
          state.schema = { ...data.schema, page: { ...data.schema.page, id } };
          state.history = {
            past: [],
            present: JSON.parse(JSON.stringify(data.schema)),
            future: [],
          };
          state.isDirty = false;
          state.selectedId = null;
          state.selectedIds = [];
        });
      } catch (error) {
        console.error('Load failed:', error);
        throw error;
      }
    },

    setPublished: (published) =>
      set((state) => {
        state.isPublished = published;
      }),

    switchPage: async (pageId) => {
      const currentPageId = get().schema.page.id;
      if (currentPageId === pageId) return;
      const { pageSchemas } = get();
      if (pageSchemas[pageId]) {
        set((state) => {
          state.schema = JSON.parse(JSON.stringify(pageSchemas[pageId]));
          state.isDirty = false;
          state.history = {
            past: [],
            present: JSON.parse(JSON.stringify(pageSchemas[pageId])),
            future: [],
          };
          state.selectedId = null;
          state.selectedIds = [];
        });
      } else {
        await get().loadPage(pageId);
      }
    },

    createPage: (title) => {
      const newId = `page_${Date.now()}`;
      const newSchema = createEmptyPageSchema(title);
      newSchema.page.id = newId;
      set((state) => {
        state.pages.push({
          id: newId,
          title,
          name: title,
          version: 1,
          isPublished: false,
          updatedAt: new Date().toISOString(),
        });
        state.pageSchemas[newId] = newSchema;
        state.schema = JSON.parse(JSON.stringify(newSchema));
        state.isDirty = false;
        state.isPublished = false;
        state.history = {
          past: [],
          present: JSON.parse(JSON.stringify(newSchema)),
          future: [],
        };
        state.selectedId = null;
        state.selectedIds = [];
      });
    },

    renamePage: (pageId, title) => {
      set((state) => {
        const page = state.pages.find(p => p.id === pageId);
        if (page) {
          page.title = title;
          page.name = title;
          page.updatedAt = new Date().toISOString();
        }
        if (state.schema.page.id === pageId) {
          state.schema.page.title = title;
        }
        if (state.pageSchemas[pageId]) {
          state.pageSchemas[pageId].page.title = title;
        }
      });
    },

    deletePage: (pageId) => {
      set((state) => {
        state.pages = state.pages.filter(p => p.id !== pageId);
        delete state.pageSchemas[pageId];
        if (state.schema.page.id === pageId && state.pages.length > 0) {
          const firstPage = state.pages[0];
          state.schema = JSON.parse(JSON.stringify(state.pageSchemas[firstPage.id] || createEmptyPageSchema(firstPage.title)));
          state.schema.page.id = firstPage.id;
          state.isDirty = false;
          state.history = {
            past: [],
            present: JSON.parse(JSON.stringify(state.schema)),
            future: [],
          };
          state.selectedId = null;
          state.selectedIds = [];
        }
      });
    },

    duplicatePage: (pageId) => {
      const page = get().pages.find(p => p.id === pageId);
      const pageSchema = get().pageSchemas[pageId];
      if (!page) return;
      const newId = `page_${Date.now()}`;
      const newSchema = pageSchema
        ? JSON.parse(JSON.stringify(pageSchema))
        : createEmptyPageSchema(`${page.title} (副本)`);
      newSchema.page.id = newId;
      newSchema.page.title = `${page.title} (副本)`;
      set((state) => {
        state.pages.push({
          id: newId,
          title: `${page.title} (副本)`,
          name: page.name,
          version: 1,
          isPublished: false,
          updatedAt: new Date().toISOString(),
        });
        state.pageSchemas[newId] = newSchema;
      });
    },

    setPagePublished: (pageId, published) => {
      set((state) => {
        const page = state.pages.find(p => p.id === pageId);
        if (page) {
          page.isPublished = published;
        }
      });
    },

    loadPageList: async () => {
      try {
        const response = await fetch('/api/pages', {
          headers: {
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}),
          },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          set((state) => {
            state.pages = data.data.map((p: any) => ({
              id: p.id,
              title: p.title,
              name: p.name,
              version: p.version,
              isPublished: p.isPublished,
              updatedAt: p.updatedAt,
            }));
          });
        }
      } catch (e) {
        console.error('Failed to load page list:', e);
      }
    },
  }))
);

export const canUndo = (state: EditorState) => state.history.past.length > 0;
export const canRedo = (state: EditorState) => state.history.future.length > 0;
