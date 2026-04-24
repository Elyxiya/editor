import React from 'react';
import { Typography } from 'antd';
import { TextMeta, getTextStyles } from './Text.meta';
import type { ComponentProps } from '@lowcode/types';

export { TextMeta };

const { Text: AntText } = Typography;

interface LcTextProps extends ComponentProps {
  text?: string;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  mark?: boolean;
  code?: boolean;
  keyboard?: boolean;
  underline?: boolean;
  delete?: boolean;
  strong?: boolean;
  italic?: boolean;
}

export const LcText = Object.assign(
  (props: LcTextProps) => {
    const {
      text = '文本',
      type,
      disabled = false,
      mark = false,
      code = false,
      keyboard = false,
      underline = false,
      delete: del = false,
      strong = false,
      italic = false,
      style,
      className,
      ...rest
    } = props;

    const typeMap: Record<string, 'secondary' | 'success' | 'warning' | 'danger'> = {
      primary: 'secondary',
      secondary: 'secondary',
      success: 'success',
      warning: 'warning',
      danger: 'danger',
    };

    return (
      <AntText
        type={type ? typeMap[type] : undefined}
        disabled={disabled}
        mark={mark}
        code={code}
        keyboard={keyboard}
        underline={underline}
        delete={del}
        strong={strong}
        italic={italic}
        style={{ ...getTextStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      >
        {text}
      </AntText>
    );
  },
  { meta: TextMeta }
);
