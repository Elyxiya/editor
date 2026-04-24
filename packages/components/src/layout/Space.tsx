import React from 'react';
import { Space as AntSpace, SpaceProps } from 'antd';
import { SpaceMeta } from './Space.meta';
import type { ComponentProps } from '@lowcode/types';

export { SpaceMeta };

export function getSpaceStyles(props: Record<string, unknown>): React.CSSProperties {
  return {};
}

interface LcSpaceProps extends ComponentProps {
  children?: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'middle' | 'large' | number;
  align?: 'start' | 'center' | 'end' | 'baseline';
  wrap?: boolean;
}

export const LcSpace = Object.assign(
  (props: LcSpaceProps) => {
    const {
      children,
      direction = 'horizontal',
      size = 'small',
      align = 'start',
      wrap = false,
      style,
      className,
      ...rest
    } = props;

    return (
      <AntSpace
        direction={direction as SpaceProps['direction']}
        size={size as SpaceProps['size']}
        align={align as SpaceProps['align']}
        wrap={wrap}
        style={{ ...getSpaceStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      >
        {children}
      </AntSpace>
    );
  },
  { meta: SpaceMeta }
);
