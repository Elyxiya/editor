import React from 'react';
import { Typography } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { TextMeta } from './Text.meta';

export { TextMeta };

const { Text: AntText } = Typography;

interface LcTextProps extends ComponentProps {
  content?: string;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'disabled';
  level?: number;
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  delete?: boolean;
  mark?: boolean;
  code?: boolean;
  color?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export const LcText: React.FC<LcTextProps> = (props) => {
  const {
    content = '这是一段文本',
    type = 'secondary',
    level = 0,
    strong = false,
    italic = false,
    underline = false,
    delete: isDelete = false,
    mark = false,
    code = false,
    color,
    fontSize,
    textAlign = 'left',
    style,
    className,
    ...rest
  } = props;

  const getTypographyType = (): 'secondary' | 'success' | 'warning' | 'danger' | 'disabled' | undefined => {
    if (['secondary', 'success', 'warning', 'danger', 'disabled'].includes(type)) {
      return type as 'secondary' | 'success' | 'warning' | 'danger' | 'disabled';
    }
    return undefined;
  };

  const TitleElement = `h${Math.min(Math.max(level, 1), 6)}` as keyof JSX.IntrinsicElements;

  if (level > 0) {
    return React.createElement(
      TitleElement,
      {
        style: { textAlign, color, fontSize, ...(style as React.CSSProperties) },
        className,
        ...rest,
      },
      content
    );
  }

  return (
    <AntText
      type={getTypographyType()}
      strong={strong}
      italic={italic}
      underline={underline}
      delete={isDelete}
      mark={mark}
      code={code}
      style={{ textAlign, color, fontSize, ...(style as React.CSSProperties) }}
      className={className}
      {...rest}
    >
      {content}
    </AntText>
  );
};

LcText.meta = TextMeta;
