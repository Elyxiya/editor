import React from 'react';
import { Button as AntButton, ButtonProps } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { ButtonMeta } from './Button.meta';

export { ButtonMeta };

export function getButtonStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    margin: (props.margin as string) || '0',
    padding: (props.padding as string) || '0',
  };
}

interface LcButtonProps extends ComponentProps {
  text?: string;
  btnType?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: 'large' | 'middle' | 'small';
  shape?: 'circle' | 'round';
  danger?: boolean;
  ghost?: boolean;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

export const LcButton = Object.assign(
  (props: LcButtonProps) => {
    const {
      text = '按钮',
      btnType = 'primary',
      size = 'middle',
      shape,
      danger = false,
      ghost = false,
      disabled = false,
      loading = false,
      block = false,
      icon,
      onClick,
      style,
      className,
      ...rest
    } = props;

    return (
      <AntButton
        type={btnType === 'default' ? undefined : btnType as ButtonProps['type']}
        size={size as ButtonProps['size']}
        shape={shape}
        danger={danger}
        ghost={ghost}
        disabled={disabled}
        loading={loading}
        block={block}
        icon={icon as ButtonProps['icon']}
        onClick={onClick}
        style={{ ...getButtonStyles(props), width: '100%', ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      >
        {text}
      </AntButton>
    );
  },
  { meta: ButtonMeta }
);
