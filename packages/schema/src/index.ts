import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { PageSchema, PageComponent } from '@lowcode/types';

// JSON Schema for page schema validation
const pageSchemaDefinition = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    page: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        layout: { type: 'string', enum: ['flex', 'grid', 'absolute'] },
        props: { type: 'object' },
        components: { type: 'array' },
      },
      required: ['title', 'layout', 'components'],
    },
    dataSources: { type: 'object' },
    logic: { type: 'object' },
  },
  required: ['version', 'page'],
};

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export class SchemaValidator {
  private validator;

  constructor() {
    this.validator = ajv.compile(pageSchemaDefinition);
  }

  validate(schema: unknown): { valid: boolean; errors?: string[] } {
    const valid = this.validator(schema);
    if (!valid && this.validator.errors) {
      return {
        valid: false,
        errors: this.validator.errors.map(
          (e) => `${e.instancePath || '/'}: ${e.message}`
        ),
      };
    }
    return { valid: true };
  }
}

export function generateComponentId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function findComponentById(
  components: PageComponent[],
  id: string
): PageComponent | null {
  for (const component of components) {
    if (component.id === id) {
      return component;
    }
    if (component.children) {
      const found = findComponentById(component.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findComponentIndex(
  components: PageComponent[],
  id: string
): number {
  return components.findIndex((c) => c.id === id);
}

export function removeComponentById(
  components: PageComponent[],
  id: string
): PageComponent[] {
  return components
    .filter((c) => c.id !== id)
    .map((c) => ({
      ...c,
      children: c.children ? removeComponentById(c.children, id) : undefined,
    }));
}

export function insertComponent(
  components: PageComponent[],
  targetId: string | null,
  component: PageComponent,
  position: 'before' | 'after' | 'inside' = 'inside',
  index?: number
): PageComponent[] {
  if (!targetId) {
    if (position === 'inside' || position === 'before') {
      return [component, ...components];
    }
    return [...components, component];
  }

  const result: PageComponent[] = [];

  for (const comp of components) {
    if (comp.id === targetId) {
      if (position === 'before') {
        result.push(component, comp);
      } else if (position === 'after') {
        result.push(comp, component);
      } else if (position === 'inside' && comp.children !== undefined) {
        const insertIndex = index ?? comp.children.length;
        const newChildren = [
          ...comp.children.slice(0, insertIndex),
          component,
          ...comp.children.slice(insertIndex),
        ];
        result.push({ ...comp, children: newChildren });
      } else {
        result.push(comp);
      }
    } else if (comp.children) {
      result.push({
        ...comp,
        children: insertComponent(
          comp.children,
          targetId,
          component,
          position,
          index
        ),
      });
    } else {
      result.push(comp);
    }
  }

  return result;
}

export function updateComponentProps(
  components: PageComponent[],
  id: string,
  props: Partial<PageComponent['props']>
): PageComponent[] {
  return components.map((c) => {
    if (c.id === id) {
      return { ...c, props: { ...c.props, ...props } };
    }
    if (c.children) {
      return { ...c, children: updateComponentProps(c.children, id, props) };
    }
    return c;
  });
}

export function cloneComponent(component: PageComponent): PageComponent {
  const newId = generateComponentId();
  const cloneProps = (props: Record<string, unknown>): Record<string, unknown> => {
    const cloned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (Array.isArray(value)) {
        cloned[key] = value.map((item) =>
          typeof item === 'object' && item !== null ? cloneProps(item as Record<string, unknown>) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        cloned[key] = cloneProps(value as Record<string, unknown>);
      } else {
        cloned[key] = value;
      }
    }
    return cloned;
  };

  const cloned: PageComponent = {
    ...component,
    id: newId,
    props: cloneProps(component.props),
    label: component.label ? `${component.label} (copy)` : undefined,
  };

  if (component.children) {
    cloned.children = component.children.map(cloneComponent);
  }

  return cloned;
}

export function moveComponent(
  components: PageComponent[],
  sourceId: string,
  targetId: string | null,
  position: 'before' | 'after' | 'inside',
  index?: number
): PageComponent[] {
  const source = findComponentById(components, sourceId);
  if (!source) return components;

  const withoutSource = removeComponentById(components, sourceId);
  const movedSource = { ...source };

  return insertComponent(withoutSource, targetId, movedSource, position, index);
}

export function flattenComponents(
  components: PageComponent[]
): PageComponent[] {
  const result: PageComponent[] = [];

  function traverse(comps: PageComponent[]) {
    for (const comp of comps) {
      result.push(comp);
      if (comp.children) {
        traverse(comp.children);
      }
    }
  }

  traverse(components);
  return result;
}

export function createEmptyPageSchema(title: string = '未命名页面'): PageSchema {
  return {
    version: '1.0.0',
    page: {
      title,
      layout: 'flex',
      props: {
        padding: 16,
        background: '#ffffff',
      },
      components: [],
    },
    dataSources: {},
    logic: {},
  };
}

export function validateSchemaVersion(schema: PageSchema): boolean {
  const currentVersion = schema.version;
  const [major] = currentVersion.split('.').map(Number);

  if (major > 1) {
    console.warn(`Schema version ${currentVersion} may not be fully compatible`);
    return true;
  }
  return true;
}

export { pageSchemaDefinition };
