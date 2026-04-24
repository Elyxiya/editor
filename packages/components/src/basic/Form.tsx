import React from 'react';
import { Form as AntForm, FormProps } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { FormMeta, getFormStyles } from './Form.meta';

export { FormMeta };

interface LcFormProps extends ComponentProps {
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelCol?: { span: number; offset?: number };
  wrapperCol?: { span: number; offset?: number };
  labelAlign?: 'left' | 'right';
  requiredMark?: boolean | 'optional';
  children?: React.ReactNode;
  onFinish?: (values: Record<string, unknown>) => void;
  onFinishFailed?: (errorInfo: unknown) => void;
}

export const LcForm = Object.assign(
  (props: LcFormProps) => {
    const {
      layout = 'vertical',
      labelCol,
      wrapperCol,
      labelAlign = 'left',
      requiredMark = true,
      children,
      onFinish,
      onFinishFailed,
      style,
      className,
      ...rest
    } = props;

    const formProps: FormProps = {
      layout,
      labelAlign,
      requiredMark,
      onFinish,
      onFinishFailed,
      style: { ...getFormStyles(props), width: '100%', ...(style as React.CSSProperties) },
      className: className as string | undefined,
      ...rest,
    };

    if (labelCol) formProps.labelCol = labelCol;
    if (wrapperCol) formProps.wrapperCol = wrapperCol;

    return <AntForm {...formProps}>{children}</AntForm>;
  },
  { meta: FormMeta }
);
