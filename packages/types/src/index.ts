// Component Types
export interface ComponentProps {
  [key: string]: unknown;
}

export interface ComponentEvent {
  name: string;
  label: string;
  description?: string;
}

export interface PropSchema {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'dataSource' | 'expression' | 'array' | 'object';
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
  dataSourceType?: 'api' | 'mock' | 'variable';
  validation?: ValidationRule[];
  tooltip?: string;
  group?: 'basic' | 'style' | 'data' | 'event';
  min?: number;
  max?: number;
  step?: number;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'phone' | 'custom';
  message?: string;
  value?: unknown;
  validator?: string;
}

export interface StyleSchema {
  name: string;
  label: string;
  type: 'string' | 'number' | 'color' | 'select';
  options?: { label: string; value: string }[];
  defaultValue?: string;
}

export interface ComponentMeta {
  name: string;
  label: string;
  icon?: string;
  category: 'layout' | 'basic' | 'business' | 'chart' | 'custom';
  defaultProps: ComponentProps;
  propSchema: PropSchema[];
  eventSchema: ComponentEvent[];
  styleSchema: StyleSchema[];
  requiredDeps?: string[];
  isContainer?: boolean;
  childNames?: string[];
}

// Page Schema Types
export interface PageComponent {
  id: string;
  type: string;
  label?: string;
  props: ComponentProps;
  children?: PageComponent[];
  events?: Record<string, string>;
  style?: Record<string, string>;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'mock' | 'variable';
  config: DataSourceConfig;
}

export interface DataSourceConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: unknown;
  authType?: 'none' | 'bearer' | 'basic' | 'apiKey';
  transform?: string;
  mockData?: unknown;
}

export interface LogicNode {
  id: string;
  type: 'trigger' | 'action' | 'logic' | 'data';
  subtype: string;
  label: string;
  config: Record<string, unknown>;
  inputs?: string[];
  outputs?: string[];
}

export interface LogicFlow {
  id: string;
  name: string;
  trigger: string;
  nodes: LogicNode[];
  connections: LogicConnection[];
}

export interface LogicConnection {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  condition?: string;
}

export interface PageSchema {
  version: string;
  page: {
    id?: string;
    title: string;
    description?: string;
    layout: 'flex' | 'grid' | 'absolute';
    props: {
      width?: number | string;
      height?: number | string;
      padding?: number;
      background?: string;
      [key: string]: unknown;
    };
    components: PageComponent[];
  };
  dataSources: Record<string, DataSource>;
  logic: Record<string, LogicFlow>;
}

// Editor Types
export interface EditorState {
  schema: PageSchema;
  selectedId: string | null;
  hoveredId: string | null;
  clipboard: PageComponent | null;
  zoom: number;
  device: 'pc' | 'tablet' | 'mobile';
  isDragging: boolean;
  isPreview: boolean;
}

export interface HistoryState {
  past: PageSchema[];
  present: PageSchema;
  future: PageSchema[];
}

export interface CanvasDropResult {
  targetId: string | null;
  position: 'before' | 'after' | 'inside';
  index?: number;
}

// API Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface Page {
  id: string;
  name: string;
  title: string;
  description?: string;
  schema: PageSchema;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  pages: Page[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'developer' | 'guest';
  tenantId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// Drag and Drop Types
export interface DragItem {
  id: string;
  type: 'component' | 'container';
  componentType?: string;
  componentMeta?: ComponentMeta;
  label?: string;
}

export interface DropZone {
  id: string;
  parentId: string | null;
  index: number;
  rect: DOMRect;
}

// Component Registry
export interface ComponentRegistry {
  components: Map<string, ComponentMeta>;
  register(meta: ComponentMeta): void;
  unregister(name: string): void;
  get(name: string): ComponentMeta | undefined;
  getAll(): ComponentMeta[];
  getByCategory(category: ComponentMeta['category']): ComponentMeta[];
}

// Event System
export interface DynamicEventContext {
  pageId: string;
  componentId: string;
  eventName: string;
  payload?: unknown;
}

export interface EventHandler {
  (context: DynamicEventContext): void | Promise<void>;
}
