import React, { useState, useCallback, useContext, createContext, useMemo, useEffect, useRef } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Switch, Radio, Checkbox, Upload, Button, message } from 'antd';
import { UploadOutlined, PlusOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { FormItemMeta } from './FormItem.meta';

export { FormItemMeta };

export function getFormItemStyles(_props: Record<string, unknown>): React.CSSProperties {
  return {};
}

const { TextArea } = Input;
const { Dragger } = Upload;

// ============================================================
// 条件显示上下文
// ============================================================

interface FormValuesContextType {
  getFieldValue: (name: string) => unknown;
  setFieldValue: (name: string, value: unknown) => void;
}

export const FormValuesContext = createContext<FormValuesContextType>({
  getFieldValue: () => undefined,
  setFieldValue: () => {},
});

export function useFormValues() {
  return useContext(FormValuesContext);
}

// ============================================================
// 条件显示判断
// ============================================================

interface ShowWhenConfig {
  field: string;
  operator: '===' | '!==' | '>' | '<' | '>=' | '<=' | 'includes' | 'regex';
  value: unknown;
}

function evaluateShowWhen(config: ShowWhenConfig | undefined, getFieldValue: (name: string) => unknown): boolean {
  if (!config || !config.field) return true;
  const fieldValue = getFieldValue(config.field);

  switch (config.operator) {
    case '===':
      return fieldValue === config.value;
    case '!==':
      return fieldValue !== config.value;
    case '>':
      return Number(fieldValue) > Number(config.value);
    case '<':
      return Number(fieldValue) < Number(config.value);
    case '>=':
      return Number(fieldValue) >= Number(config.value);
    case '<=':
      return Number(fieldValue) <= Number(config.value);
    case 'includes':
      return String(fieldValue).includes(String(config.value));
    case 'regex':
      try {
        return new RegExp(String(config.value)).test(String(fieldValue));
      } catch {
        return true;
      }
    default:
      return true;
  }
}

// ============================================================
// 文件上传组件
// ============================================================

interface UploadFieldProps {
  value?: string[];
  onChange?: (fileList: string[]) => void;
  uploadConfig?: {
    action?: string;
    accept?: string;
    maxSize?: number;
    maxCount?: number;
    multiple?: boolean;
    listType?: 'text' | 'picture' | 'picture-card';
  };
}

const UploadField: React.FC<UploadFieldProps> = ({ value = [], onChange, uploadConfig }) => {
  const config = uploadConfig || {};
  const action = config.action || '/api/upload';
  const accept = config.accept || '*/*';
  const maxCount = config.maxCount || 1;
  const multiple = config.multiple ?? (maxCount > 1);

  const handleUploadChange: UploadProps['onChange'] = (info) => {
    const newFileList = info.fileList
      .filter(f => f.status === 'done' || f.originFileObj)
      .map(f => f.response?.url || f.name || '');
    if (onChange) {
      onChange(newFileList);
    }
  };

  const listType = config.listType || 'picture-card';

  return (
    <Dragger
      name="file"
      action={action}
      accept={accept}
      multiple={multiple}
      maxCount={maxCount}
      onChange={handleUploadChange}
      defaultFileList={value.map((url, i) => ({
        uid: `-${i}`,
        name: url.split('/').pop() || url,
        status: 'done' as const,
        url,
      }))}
      style={{ width: '100%' }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
      <p className="ant-upload-hint">
        {accept !== '*/*' ? `支持 ${accept} 格式` : '支持所有格式'}
        {maxCount > 1 ? `，最多 ${maxCount} 个文件` : ''}
      </p>
    </Dragger>
  );
};

// ============================================================
// 富文本编辑器（轻量实现）
// ============================================================

interface RichTextFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readonly?: boolean;
}

const RichTextField: React.FC<RichTextFieldProps> = ({
  value = '',
  onChange,
  placeholder = '请输入内容...',
  readonly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync value to editor
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const toolbarItems = [
    { icon: 'B', title: '加粗', cmd: 'bold' },
    { icon: 'I', title: '斜体', cmd: 'italic' },
    { icon: 'U', title: '下划线', cmd: 'underline' },
    { icon: 'H1', title: '标题1', cmd: 'formatBlock', value: '<h1>' },
    { icon: 'H2', title: '标题2', cmd: 'formatBlock', value: '<h2>' },
    { icon: '¶', title: '段落', cmd: 'formatBlock', value: '<p>' },
    { icon: '•', title: '无序列表', cmd: 'insertUnorderedList' },
    { icon: '1.', title: '有序列表', cmd: 'insertOrderedList' },
    { icon: '→', title: '缩进', cmd: 'indent' },
    { icon: '←', title: '取消缩进', cmd: 'outdent' },
  ];

  return (
    <div
      style={{
        border: `1px solid ${isFocused ? '#1677ff' : '#d9d9d9'}`,
        borderRadius: 6,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {!readonly && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            padding: '4px 8px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          {toolbarItems.map((item) => (
            <button
              key={item.cmd}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                execCommand(item.cmd, item.value);
              }}
              title={item.title}
              style={{
                padding: '2px 8px',
                border: '1px solid transparent',
                borderRadius: 4,
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: item.icon.length === 1 && item.icon === item.icon.toUpperCase() ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.background = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readonly}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        data-placeholder={placeholder}
        style={{
          minHeight: 120,
          padding: '8px 12px',
          outline: 'none',
          lineHeight: 1.8,
          fontSize: 14,
          cursor: readonly ? 'default' : 'text',
        } as React.CSSProperties}
      />
    </div>
  );
};

// ============================================================
// 主组件
// ============================================================

interface LcFormItemProps extends ComponentProps {
  label?: string;
  name?: string;
  required?: boolean;
  hidden?: boolean;
  hasFeedback?: boolean;
  valuePropName?: string;
  trigger?: string;
  children?: React.ReactNode;
  fieldType?: 'input' | 'textarea' | 'select' | 'datePicker' | 'inputNumber' | 'switch' | 'radio' | 'checkbox' | 'upload' | 'richText' | 'custom';
  placeholder?: string;
  options?: { label: string; value: unknown }[];
  showWhen?: ShowWhenConfig;
  uploadConfig?: Record<string, unknown>;
  richTextConfig?: Record<string, unknown>;
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
      showWhen,
      style,
      className,
      ...rest
    } = props;

    const { getFieldValue, setFieldValue } = useFormValues();

    // Evaluate conditional display
    const isVisible = useMemo(() => {
      if (!showWhen || !showWhen.field) return !hidden;
      return evaluateShowWhen(showWhen, getFieldValue);
    }, [showWhen, getFieldValue, hidden]);

    const renderField = () => {
      switch (fieldType) {
        case 'textarea':
          return <TextArea placeholder={placeholder} rows={4} />;
        case 'select':
          return (
            <Select placeholder={placeholder} allowClear>
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
        case 'upload':
          return (
            <UploadField
              uploadConfig={props.uploadConfig as any}
            />
          );
        case 'richText':
          return (
            <RichTextField
              placeholder={placeholder}
            />
          );
        default:
          return <Input placeholder={placeholder} />;
      }
    };

    if (!isVisible) return null;

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

export { UploadField, RichTextField, evaluateShowWhen };
export type { ShowWhenConfig };
