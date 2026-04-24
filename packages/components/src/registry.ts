export { LcButton, ButtonMeta } from './basic/Button';
export { LcInput, InputMeta } from './basic/Input';
export { LcText, TextMeta } from './basic/Text';
export { LcImage, ImageMeta } from './basic/Image';
export { LcContainer, ContainerMeta } from './layout/Container';
export { LcSpace, SpaceMeta } from './layout/Space';
export { LcCard, CardMeta } from './business/Card';
export { LcTable, TableMeta } from './business/Table';

import type { ComponentMeta } from '@lowcode/types';
import { LcButton } from './basic/Button';
import { LcInput } from './basic/Input';
import { LcText } from './basic/Text';
import { LcImage } from './basic/Image';
import { LcContainer } from './layout/Container';
import { LcSpace } from './layout/Space';
import { LcCard } from './business/Card';
import { LcTable } from './business/Table';

export const componentMetas: ComponentMeta[] = [
  LcButton.meta,
  LcInput.meta,
  LcText.meta,
  LcImage.meta,
  LcContainer.meta,
  LcSpace.meta,
  LcCard.meta,
  LcTable.meta,
];

export function getComponentMeta(name: string): ComponentMeta | undefined {
  return componentMetas.find((meta) => meta.name === name);
}

export function getComponentsByCategory(category: ComponentMeta['category']): ComponentMeta[] {
  return componentMetas.filter((meta) => meta.category === category);
}
