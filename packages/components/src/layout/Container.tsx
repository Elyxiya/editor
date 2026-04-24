import React from 'react';
import { ContainerMeta, getContainerStyles } from './Container.meta';
import type { ComponentProps } from '@lowcode/types';

export { ContainerMeta };

interface LcContainerProps extends ComponentProps {
  children?: React.ReactNode;
  display?: 'block' | 'flex' | 'grid';
  padding?: number;
  margin?: string | number;
  backgroundColor?: string;
  borderRadius?: number;
  minHeight?: number;
  border?: string;
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  gap?: number;
}

export const LcContainer = Object.assign(
  (props: LcContainerProps) => {
    const {
      children,
      display = 'block',
      padding = 16,
      margin = 0,
      backgroundColor = '#ffffff',
      borderRadius = 8,
      minHeight = 100,
      border,
      flexDirection = 'row',
      justifyContent = 'flex-start',
      alignItems = 'flex-start',
      gap,
      style,
      className,
      ...rest
    } = props;

    const containerStyle: React.CSSProperties = {
      display,
      padding,
      margin,
      backgroundColor,
      borderRadius,
      minHeight,
      border,
      ...(display === 'flex' && {
        flexDirection,
        justifyContent,
        alignItems,
        gap,
      }),
      ...getContainerStyles(props),
      ...(style as React.CSSProperties),
    };

    return (
      <div style={containerStyle} className={className as string | undefined} {...rest}>
        {children}
      </div>
    );
  },
  { meta: ContainerMeta }
);
