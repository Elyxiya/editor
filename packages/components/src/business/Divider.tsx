import React from 'react';
import { Divider as AntDivider, DividerProps } from 'antd';
import { DividerMeta } from './Divider.meta';
import type { ComponentProps } from '@lowcode/types';

export { DividerMeta };

export function getDividerStyles(_props: Record<string, unknown>): React.CSSProperties {
  return {};
}

interface LcDividerProps extends ComponentProps {
  type?: 'horizontal' | 'vertical';
  orientation?: 'left' | 'center' | 'right';
  orientationMargin?: number | 'left' | 'right';
  plain?: boolean;
  dashed?: boolean;
  children?: React.ReactNode;
}

export const LcDivider = Object.assign(
  (props: LcDividerProps) => {
    const {
      type = 'horizontal',
      orientation = 'center',
      orientationMargin,
      plain = false,
      dashed = false,
      children,
      style,
      className,
      ...rest
    } = props;

    return (
      <AntDivider
        type={type as DividerProps['type']}
        orientation={orientation as DividerProps['orientation']}
        orientationMargin={orientationMargin as DividerProps['orientationMargin']}
        plain={plain}
        dashed={dashed}
        style={{ ...getDividerStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      >
        {children}
      </AntDivider>
    );
  },
  { meta: DividerMeta }
);
