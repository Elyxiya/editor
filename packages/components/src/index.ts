import React from 'react';
import type { ComponentMeta, ComponentProps } from '@lowcode/types';
import { LcButton } from './basic/Button';
import { LcInput } from './basic/Input';
import { LcText } from './basic/Text';
import { LcImage } from './basic/Image';
import { LcContainer } from './layout/Container';
import { LcSpace } from './layout/Space';
import { LcCard } from './business/Card';
import { LcTable } from './business/Table';

export * from './basic/Button';
export * from './basic/Input';
export * from './basic/Text';
export * from './basic/Image';
export * from './layout/Container';
export * from './layout/Space';
export * from './business/Card';
export * from './business/Table';
export * from './registry';

export const componentRegistry: Map<string, ComponentMeta> = new Map();

const allComponents: Array<{ meta: ComponentMeta; component: React.ComponentType<ComponentProps> }> = [
  { meta: LcButton.meta, component: LcButton },
  { meta: LcInput.meta, component: LcInput },
  { meta: LcText.meta, component: LcText },
  { meta: LcImage.meta, component: LcImage },
  { meta: LcContainer.meta, component: LcContainer },
  { meta: LcSpace.meta, component: LcSpace },
  { meta: LcCard.meta, component: LcCard },
  { meta: LcTable.meta, component: LcTable },
];

allComponents.forEach(({ meta }) => {
  componentRegistry.set(meta.name, meta);
});

export function getComponent(name: string): React.ComponentType<ComponentProps> | undefined {
  const entry = allComponents.find(({ meta }) => meta.name === name);
  return entry?.component;
}

export function getComponentMeta(name: string): ComponentMeta | undefined {
  return componentRegistry.get(name);
}

export function getAllComponentMetas(): ComponentMeta[] {
  return Array.from(componentRegistry.values());
}

export function getComponentsByCategory(category: ComponentMeta['category']): ComponentMeta[] {
  return Array.from(componentRegistry.values()).filter((meta) => meta.category === category);
}

export function registerComponent(meta: ComponentMeta, component: React.ComponentType<ComponentProps>): void {
  componentRegistry.set(meta.name, meta);
  allComponents.push({ meta, component });
}

export { type ComponentMeta, type ComponentProps };
