import React from 'react';
import { Card as AntCard, Typography } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { CardMeta } from './Card.meta';

export { CardMeta };

const { Text, Paragraph } = Typography;

interface LcCardProps extends ComponentProps {
  children?: React.ReactNode;
  title?: string;
  subTitle?: string;
  description?: string;
  bordered?: boolean;
  hoverable?: boolean;
  size?: 'default' | 'small';
  cover?: React.ReactNode;
  actions?: React.ReactNode[];
  onClick?: () => void;
}

export const LcCard: React.FC<LcCardProps> = (props) => {
  const {
    children,
    title,
    subTitle,
    description,
    bordered = true,
    hoverable = false,
    size = 'default',
    cover,
    actions,
    onClick,
    style,
    className,
    ...rest
  } = props;

  const renderExtra = () => {
    if (!subTitle && !description) return null;
    return (
      <div>
        {subTitle && <Text type="secondary">{subTitle}</Text>}
        {description && (
          <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
            {description}
          </Paragraph>
        )}
      </div>
    );
  };

  return (
    <AntCard
      title={title}
      bordered={bordered}
      hoverable={hoverable}
      size={size}
      cover={cover}
      actions={actions}
      onClick={onClick}
      style={style as React.CSSProperties}
      className={className}
      extra={renderExtra()}
      {...rest}
    >
      {children}
    </AntCard>
  );
};

LcCard.meta = CardMeta;
