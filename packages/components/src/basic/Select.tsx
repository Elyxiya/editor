import React from 'react';
import { Select as AntSelect, SelectProps } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { SelectMeta } from './Select.meta';

export { SelectMeta };

export function getSelectStyles(props: Record<string, unknown>): React.CSSProperties {
  return {
    width: (props.width as string) || '200px',
  };
}

interface LcSelectProps extends ComponentProps {
  placeholder?: string;
  mode?: 'multiple' | 'tags';
  allowClear?: boolean;
  showSearch?: boolean;
  disabled?: boolean;
  options?: { label: string; value: unknown }[];
  maxTagCount?: number | 'responsive';
}

export const LcSelect = Object.assign(
  (props: LcSelectProps) => {
    const {
      placeholder = '请选择',
      mode,
      allowClear = false,
      showSearch = false,
      disabled = false,
      options = [],
      maxTagCount,
      style,
      className,
      ...rest
    } = props;

    return (
      <AntSelect
        mode={mode as SelectProps['mode']}
        placeholder={placeholder}
        allowClear={allowClear}
        showSearch={showSearch}
        disabled={disabled}
        maxTagCount={maxTagCount as SelectProps['maxTagCount']}
        style={{ width: '100%', ...getSelectStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      >
        {options.map((opt) => (
          <AntSelect.Option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </AntSelect.Option>
        ))}
      </AntSelect>
    );
  },
  { meta: SelectMeta }
);
