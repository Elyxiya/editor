import React from 'react';
import { Button as AntButton } from 'antd';
import { ButtonOutlined } from '@ant-design/icons';
import type { ComponentProps } from '@lowcode/types';
import { ButtonMeta, getButtonStyles } from './Button.meta';

export { ButtonMeta };

interface LcButtonProps extends ComponentProps {
  text?: string;
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
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

export const LcButton: React.FC<LcButtonProps> = (props) => {
  const {
    text = '按钮',
    type = 'primary',
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
      type={type === 'default' ? undefined : type as AntButtonProps['type']}
      size={size}
      shape={shape}
      danger={danger}
      ghost={ghost}
      disabled={disabled}
      loading={loading}
      block={block}
      icon={icon as AntButtonProps['icon']}
      onClick={onClick}
      style={{ ...getButtonStyles(props), ...(style as React.CSSProperties) }}
      className={className}
      {...rest}
    >
      {text}
    </AntButton>
  );
};

LcButton.meta = ButtonMeta;

type AntButtonProps = {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link' | undefined;
  size?: AntButtonProps['size'];
  shape?: 'circle' | 'round' | undefined;
  icon?: React.ReactNode;
};
