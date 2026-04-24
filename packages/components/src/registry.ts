export { LcButton, ButtonMeta } from './basic/Button';
export { LcInput, InputMeta } from './basic/Input';
export { LcText, TextMeta } from './basic/Text';
export { LcImage, ImageMeta } from './basic/Image';
export { LcForm, FormMeta } from './basic/Form';
export { LcFormItem, FormItemMeta } from './basic/FormItem';
export { LcSelect, SelectMeta } from './basic/Select';
export { LcContainer, ContainerMeta } from './layout/Container';
export { LcSpace, SpaceMeta } from './layout/Space';
export { LcCard, CardMeta } from './business/Card';
export { LcTable, TableMeta } from './business/Table';
export { LcModal, ModalMeta } from './business/Modal';
export { LcTabs, TabsMeta } from './business/Tabs';
export { LcDivider, DividerMeta } from './business/Divider';

import type { ComponentMeta } from '@lowcode/types';
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

type ComponentWithMeta = {
  meta: ComponentMeta;
};

export const componentMetas: ComponentMeta[] = [
  (LcButton as unknown as ComponentWithMeta).meta,
  (LcInput as unknown as ComponentWithMeta).meta,
  (LcText as unknown as ComponentWithMeta).meta,
  (LcImage as unknown as ComponentWithMeta).meta,
  (LcForm as unknown as ComponentWithMeta).meta,
  (LcFormItem as unknown as ComponentWithMeta).meta,
  (LcSelect as unknown as ComponentWithMeta).meta,
  (LcContainer as unknown as ComponentWithMeta).meta,
  (LcSpace as unknown as ComponentWithMeta).meta,
  (LcCard as unknown as ComponentWithMeta).meta,
  (LcTable as unknown as ComponentWithMeta).meta,
  (LcModal as unknown as ComponentWithMeta).meta,
  (LcTabs as unknown as ComponentWithMeta).meta,
  (LcDivider as unknown as ComponentWithMeta).meta,
];

export function getComponentMeta(name: string): ComponentMeta | undefined {
  return componentMetas.find((meta) => meta.name === name);
}

export function getComponentsByCategory(category: ComponentMeta['category']): ComponentMeta[] {
  return componentMetas.filter((meta) => meta.category === category);
}
