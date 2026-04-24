import React from 'react';
import { Input as AntInput } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { InputMeta } from './Input.meta';

export { InputMeta };

interface LcInputProps extends ComponentProps {
  value?: string;
  defaultValue?: string;
  type?: 'text' | 'password' | 'number' | 'email' | 'search' | 'url' | 'tel';
  placeholder?: string;
  size?: 'large' | 'middle' | 'small';
  disabled?: boolean;
  allowClear?: boolean;
  showCount?: boolean;
  maxLength?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const LcInput: React.FC<LcInputProps> = (props) => {
  const {
    value,
    defaultValue,
    type = 'text',
    placeholder = '请输入',
    size = 'middle',
    disabled = false,
    allowClear = true,
    showCount = false,
    maxLength,
    prefix,
    suffix,
    onChange,
    onPressEnter,
    onFocus,
    onBlur,
    style,
    className,
    ...rest
  } = props;

  return (
    <AntInput
      value={value}
      defaultValue={defaultValue}
      type={type}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      allowClear={allowClear}
      showCount={showCount}
      maxLength={maxLength}
      prefix={prefix as React.ReactNode}
      suffix={suffix as React.ReactNode}
      onChange={onChange}
      onPressEnter={onPressEnter}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{ width: '100%', ...(style as React.CSSProperties) }}
      className={className}
      {...rest}
    />
  );
};

LcInput.meta = InputMeta;
