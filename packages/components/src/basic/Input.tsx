import React from 'react';
import { Input as AntInput, InputProps } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { InputMeta } from './Input.meta';

export { InputMeta };

export function getInputStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    margin: (props.margin as string) || '0',
  };
}

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

export const LcInput = Object.assign(
  (props: LcInputProps) => {
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
        type={type as InputProps['type']}
        placeholder={placeholder}
        size={size as InputProps['size']}
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
        style={{ ...getInputStyles(props), width: '100%', ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      />
    );
  },
  { meta: InputMeta }
);
