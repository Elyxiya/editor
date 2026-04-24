import React from 'react';
import { Space as AntSpace } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { SpaceMeta } from './Space.meta';

export { SpaceMeta };

interface LcSpaceProps extends ComponentProps {
  children?: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'middle' | 'large' | number;
  align?: 'start' | 'center' | 'end' | 'baseline';
  wrap?: boolean;
  block?: boolean;
}

export const LcSpace: React.FC<LcSpaceProps> = (props) => {
  const {
    children,
    direction = 'horizontal',
    size = 'small',
    align = 'start',
    wrap = false,
    block = false,
    style,
    className,
    ...rest
  } = props;

  return (
    <AntSpace
      direction={direction}
      size={size}
      align={align}
      wrap={wrap}
      block={block}
      style={style as React.CSSProperties}
      className={className}
      {...rest}
    >
      {children}
    </AntSpace>
  );
};

LcSpace.meta = SpaceMeta;
