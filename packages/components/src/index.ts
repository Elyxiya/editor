import React from 'react';
import type { ComponentMeta, ComponentProps } from '@lowcode/types';
import { LcButton } from './basic/Button';
import { LcInput } from './basic/Input';
import { LcText } from './basic/Text';
import { LcImage } from './basic/Image';
import { LcForm } from './basic/Form';
import { LcFormItem } from './basic/FormItem';
import { LcSelect } from './basic/Select';
import { LcContainer } from './layout/Container';
import { LcSpace } from './layout/Space';
import { LcCard } from './business/Card';
import { LcTable } from './business/Table';
import { LcModal } from './business/Modal';
import { LcTabs } from './business/Tabs';
import { LcDivider } from './business/Divider';
import { LcBadge, LcTag, LcAvatar, LcProgress, LcStatistic, LcSkeleton } from './advanced';

export * from './basic/Button';
export * from './basic/Input';
export * from './basic/Text';
export * from './basic/Image';
export * from './basic/Form';
export * from './basic/FormItem';
export * from './basic/Select';
export * from './layout/Container';
export * from './layout/Space';
export * from './business/Card';
export * from './business/Table';
export * from './business/Modal';
export * from './business/Tabs';
export * from './business/Divider';
export * from './advanced';
export * from './registry';

type ComponentWithMeta = {
  meta: ComponentMeta;
};

export const componentRegistry: Map<string, ComponentMeta> = new Map();

const allComponents: Array<{ meta: ComponentMeta; component: React.ComponentType<ComponentProps> }> = [
  { meta: (LcButton as unknown as ComponentWithMeta).meta, component: LcButton },
  { meta: (LcInput as unknown as ComponentWithMeta).meta, component: LcInput },
  { meta: (LcText as unknown as ComponentWithMeta).meta, component: LcText },
  { meta: (LcImage as unknown as ComponentWithMeta).meta, component: LcImage },
  { meta: (LcForm as unknown as ComponentWithMeta).meta, component: LcForm },
  { meta: (LcFormItem as unknown as ComponentWithMeta).meta, component: LcFormItem },
  { meta: (LcSelect as unknown as ComponentWithMeta).meta, component: LcSelect },
  { meta: (LcContainer as unknown as ComponentWithMeta).meta, component: LcContainer },
  { meta: (LcSpace as unknown as ComponentWithMeta).meta, component: LcSpace },
  { meta: (LcCard as unknown as ComponentWithMeta).meta, component: LcCard },
  { meta: (LcTable as unknown as ComponentWithMeta).meta, component: LcTable },
  { meta: (LcModal as unknown as ComponentWithMeta).meta, component: LcModal },
  { meta: (LcTabs as unknown as ComponentWithMeta).meta, component: LcTabs },
  { meta: (LcDivider as unknown as ComponentWithMeta).meta, component: LcDivider },
  // 高级组件
  { meta: (LcBadge as unknown as ComponentWithMeta).meta, component: LcBadge },
  { meta: (LcTag as unknown as ComponentWithMeta).meta, component: LcTag },
  { meta: (LcAvatar as unknown as ComponentWithMeta).meta, component: LcAvatar },
  { meta: (LcProgress as unknown as ComponentWithMeta).meta, component: LcProgress },
  { meta: (LcStatistic as unknown as ComponentWithMeta).meta, component: LcStatistic },
  { meta: (LcSkeleton as unknown as ComponentWithMeta).meta, component: LcSkeleton },
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
