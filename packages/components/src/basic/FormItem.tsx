import React from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Switch, Radio, Checkbox } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { FormItemMeta } from './FormItem.meta';

export { FormItemMeta };

export function getFormItemStyles(_props: Record<string, unknown>): React.CSSProperties {
  return {};
}

const { TextArea } = Input;

interface LcFormItemProps extends ComponentProps {
  label?: string;
  name?: string;
  required?: boolean;
  hidden?: boolean;
  hasFeedback?: boolean;
  valuePropName?: string;
  trigger?: string;
  children?: React.ReactNode;
  fieldType?: 'input' | 'textarea' | 'select' | 'datePicker' | 'inputNumber' | 'switch' | 'radio' | 'checkbox' | 'custom';
  placeholder?: string;
  options?: { label: string; value: unknown }[];
}

export const LcFormItem = Object.assign(
  (props: LcFormItemProps) => {
    const {
      label,
      name,
      required = false,
      hidden = false,
      hasFeedback = true,
      children,
      fieldType = 'input',
      placeholder,
      options = [],
      style,
      className,
      ...rest
    } = props;

    const renderField = () => {
      switch (fieldType) {
        case 'textarea':
          return <TextArea placeholder={placeholder} />;
        case 'select':
          return (
            <Select placeholder={placeholder}>
              {options.map((opt) => (
                <Select.Option key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          );
        case 'datePicker':
          return <DatePicker style={{ width: '100%' }} placeholder={placeholder} />;
        case 'inputNumber':
          return <InputNumber style={{ width: '100%' }} placeholder={placeholder} />;
        case 'switch':
          return <Switch />;
        case 'radio':
          return (
            <Radio.Group>
              {options.map((opt) => (
                <Radio key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </Radio>
              ))}
            </Radio.Group>
          );
        case 'checkbox':
          return (
            <Checkbox.Group>
              {options.map((opt) => (
                <Checkbox key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          );
        default:
          return <Input placeholder={placeholder} />;
      }
    };

    return (
      <Form.Item
        label={label}
        name={name}
        required={required}
        hidden={hidden}
        hasFeedback={hasFeedback && fieldType !== 'switch' && fieldType !== 'checkbox'}
        style={{ ...getFormItemStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      >
        {children || renderField()}
      </Form.Item>
    );
  },
  { meta: FormItemMeta }
);
