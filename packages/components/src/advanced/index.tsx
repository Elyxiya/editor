/**
 * Advanced Components for LowCode Platform
 * 
 * 高级组件 - 提供更丰富的业务组件
 */

import React from 'react';
import { Badge, Tag, Avatar, Progress, Statistic, Skeleton } from 'antd';
import type { ComponentProps } from '@lowcode/types';

// ============================================================
// Badge 徽章组件
// ============================================================

interface LcBadgeProps extends ComponentProps {
  count?: number;
  showZero?: boolean;
  dot?: boolean;
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning';
  text?: string;
  overflowCount?: number;
}

export const LcBadge = Object.assign(
  (props: LcBadgeProps) => {
    const {
      count = 0,
      showZero = false,
      dot = false,
      status,
      text,
      overflowCount = 99,
      style,
      className,
      ...rest
    } = props;

    return (
      <Badge
        count={count}
        showZero={showZero}
        dot={dot}
        status={status as any}
        text={text}
        overflowCount={overflowCount}
        style={style as any}
        className={className as string}
        {...rest}
      />
    );
  },
  {
    meta: {
      name: 'Badge',
      label: '徽章',
      icon: 'NotificationOutlined',
      category: 'business',
      defaultProps: {
        count: 0,
        showZero: false,
        dot: false,
        overflowCount: 99,
      },
      propSchema: [
        {
          name: 'count',
          label: '数量',
          type: 'number',
          defaultValue: 0,
          group: 'basic',
        },
        {
          name: 'showZero',
          label: '显示零',
          type: 'boolean',
          defaultValue: false,
          group: 'basic',
        },
        {
          name: 'dot',
          label: '圆点样式',
          type: 'boolean',
          defaultValue: false,
          group: 'basic',
        },
        {
          name: 'status',
          label: '状态',
          type: 'select',
          options: [
            { label: '无', value: undefined },
            { label: '成功', value: 'success' },
            { label: '进行中', value: 'processing' },
            { label: '默认', value: 'default' },
            { label: '错误', value: 'error' },
            { label: '警告', value: 'warning' },
          ],
          defaultValue: undefined,
          group: 'basic',
        },
        {
          name: 'text',
          label: '状态文字',
          type: 'string',
          defaultValue: '',
          group: 'basic',
        },
        {
          name: 'overflowCount',
          label: '溢出计数',
          type: 'number',
          defaultValue: 99,
          group: 'basic',
        },
      ],
      eventSchema: [],
      styleSchema: [],
    },
  }
);

// ============================================================
// Tag 标签组件
// ============================================================

interface LcTagProps extends ComponentProps {
  color?: string;
  closable?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const LcTag = Object.assign(
  (props: LcTagProps) => {
    const {
      color = 'blue',
      closable = false,
      onClose,
      children = '标签',
      style,
      className,
      ...rest
    } = props;

    return (
      <Tag
        color={color}
        closable={closable}
        onClose={onClose}
        style={style as any}
        className={className as string}
        {...rest}
      >
        {children}
      </Tag>
    );
  },
  {
    meta: {
      name: 'Tag',
      label: '标签',
      icon: 'TagOutlined',
      category: 'business',
      defaultProps: {
        color: 'blue',
        closable: false,
      },
      propSchema: [
        {
          name: 'color',
          label: '颜色',
          type: 'select',
          options: [
            { label: '蓝色', value: 'blue' },
            { label: '绿色', value: 'green' },
            { label: '橙色', value: 'orange' },
            { label: '红色', value: 'red' },
            { label: '紫色', value: 'purple' },
            { label: '灰色', value: 'gray' },
          ],
          defaultValue: 'blue',
          group: 'basic',
        },
        {
          name: 'closable',
          label: '可关闭',
          type: 'boolean',
          defaultValue: false,
          group: 'basic',
        },
      ],
      eventSchema: [
        { name: 'onClose', label: '关闭', description: '标签关闭时触发' },
      ],
      styleSchema: [],
    },
  }
);

// ============================================================
// Avatar 头像组件
// ============================================================

interface LcAvatarProps extends ComponentProps {
  src?: string;
  icon?: string;
  shape?: 'circle' | 'square';
  size?: number | 'small' | 'default' | 'large';
  alt?: string;
  children?: React.ReactNode;
}

export const LcAvatar = Object.assign(
  (props: LcAvatarProps) => {
    const {
      src,
      icon,
      shape = 'circle',
      size = 'default',
      alt,
      children,
      style,
      className,
      ...rest
    } = props;

    return (
      <Avatar
        src={src}
        icon={icon as any}
        shape={shape as any}
        size={size as any}
        alt={alt}
        style={style as any}
        className={className as string}
        {...rest}
      >
        {children}
      </Avatar>
    );
  },
  {
    meta: {
      name: 'Avatar',
      label: '头像',
      icon: 'UserOutlined',
      category: 'business',
      defaultProps: {
        shape: 'circle',
        size: 'default',
      },
      propSchema: [
        {
          name: 'src',
          label: '图片地址',
          type: 'string',
          defaultValue: '',
          group: 'basic',
        },
        {
          name: 'icon',
          label: '图标',
          type: 'string',
          defaultValue: '',
          group: 'basic',
        },
        {
          name: 'shape',
          label: '形状',
          type: 'select',
          options: [
            { label: '圆形', value: 'circle' },
            { label: '方形', value: 'square' },
          ],
          defaultValue: 'circle',
          group: 'basic',
        },
        {
          name: 'size',
          label: '尺寸',
          type: 'select',
          options: [
            { label: '小', value: 'small' },
            { label: '默认', value: 'default' },
            { label: '大', value: 'large' },
          ],
          defaultValue: 'default',
          group: 'basic',
        },
      ],
      eventSchema: [],
      styleSchema: [],
    },
  }
);

// ============================================================
// Progress 进度条组件
// ============================================================

interface LcProgressProps extends ComponentProps {
  percent?: number;
  status?: 'success' | 'exception' | 'normal' | 'active';
  showInfo?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  size?: 'small' | 'default';
  type?: 'line' | 'circle' | 'dashboard';
}

export const LcProgress = Object.assign(
  (props: LcProgressProps) => {
    const {
      percent = 0,
      status,
      showInfo = true,
      strokeColor,
      strokeWidth,
      size = 'default',
      type = 'line',
      style,
      className,
      ...rest
    } = props;

    return (
      <Progress
        percent={percent}
        status={status as any}
        showInfo={showInfo}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        size={size as any}
        type={type as any}
        style={style as any}
        className={className as string}
        {...rest}
      />
    );
  },
  {
    meta: {
      name: 'Progress',
      label: '进度条',
      icon: 'LoadingOutlined',
      category: 'business',
      defaultProps: {
        percent: 0,
        showInfo: true,
        size: 'default',
        type: 'line',
      },
      propSchema: [
        {
          name: 'percent',
          label: '进度',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 100,
          group: 'basic',
        },
        {
          name: 'status',
          label: '状态',
          type: 'select',
          options: [
            { label: '正常', value: 'normal' },
            { label: '成功', value: 'success' },
            { label: '异常', value: 'exception' },
            { label: '进行中', value: 'active' },
          ],
          defaultValue: 'normal',
          group: 'basic',
        },
        {
          name: 'showInfo',
          label: '显示信息',
          type: 'boolean',
          defaultValue: true,
          group: 'basic',
        },
        {
          name: 'strokeColor',
          label: '进度条颜色',
          type: 'color',
          defaultValue: '#1890ff',
          group: 'style',
        },
        {
          name: 'type',
          label: '类型',
          type: 'select',
          options: [
            { label: '线性', value: 'line' },
            { label: '圆形', value: 'circle' },
            { label: '仪表盘', value: 'dashboard' },
          ],
          defaultValue: 'line',
          group: 'basic',
        },
      ],
      eventSchema: [],
      styleSchema: [],
    },
  }
);

// ============================================================
// Statistic 统计组件
// ============================================================

interface LcStatisticProps extends ComponentProps {
  title?: string;
  value?: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  precision?: number;
  decimalSeparator?: string;
  formatter?: (value: number | string) => React.ReactNode;
}

export const LcStatistic = Object.assign(
  (props: LcStatisticProps) => {
    const {
      title = '统计值',
      value = 0,
      prefix,
      suffix,
      precision,
      decimalSeparator,
      formatter,
      style,
      className,
      ...rest
    } = props;

    return (
      <Statistic
        title={title}
        value={value}
        prefix={prefix as any}
        suffix={suffix}
        precision={precision}
        decimalSeparator={decimalSeparator}
        formatter={formatter as any}
        style={style as any}
        className={className as string}
        {...rest}
      />
    );
  },
  {
    meta: {
      name: 'Statistic',
      label: '统计数值',
      icon: 'BarChartOutlined',
      category: 'business',
      defaultProps: {
        title: '统计值',
        value: 0,
      },
      propSchema: [
        {
          name: 'title',
          label: '标题',
          type: 'string',
          defaultValue: '统计值',
          group: 'basic',
        },
        {
          name: 'value',
          label: '数值',
          type: 'number',
          defaultValue: 0,
          group: 'basic',
        },
        {
          name: 'suffix',
          label: '后缀',
          type: 'string',
          defaultValue: '',
          group: 'basic',
        },
        {
          name: 'precision',
          label: '小数位数',
          type: 'number',
          defaultValue: 0,
          min: 0,
          max: 6,
          group: 'basic',
        },
      ],
      eventSchema: [],
      styleSchema: [],
    },
  }
);

// ============================================================
// Skeleton 骨架屏组件
// ============================================================

interface LcSkeletonProps extends ComponentProps {
  active?: boolean;
  avatar?: boolean;
  loading?: boolean;
  paragraph?: boolean | { rows?: number; width?: number | string };
  title?: boolean | { width?: number | string };
}

export const LcSkeleton = Object.assign(
  (props: LcSkeletonProps) => {
    const {
      active = true,
      avatar = false,
      loading = true,
      paragraph = true,
      title = true,
      style,
      className,
      ...rest
    } = props;

    return (
      <Skeleton
        active={active}
        avatar={avatar}
        loading={loading}
        paragraph={paragraph as any}
        title={title as any}
        style={style as any}
        className={className as string}
        {...rest}
      />
    );
  },
  {
    meta: {
      name: 'Skeleton',
      label: '骨架屏',
      icon: 'BlockOutlined',
      category: 'business',
      defaultProps: {
        active: true,
        avatar: false,
        loading: true,
        paragraph: true,
        title: true,
      },
      propSchema: [
        {
          name: 'active',
          label: '动画',
          type: 'boolean',
          defaultValue: true,
          group: 'basic',
        },
        {
          name: 'avatar',
          label: '头像占位',
          type: 'boolean',
          defaultValue: false,
          group: 'basic',
        },
        {
          name: 'loading',
          label: '加载状态',
          type: 'boolean',
          defaultValue: true,
          group: 'basic',
        },
        {
          name: 'paragraph',
          label: '段落占位',
          type: 'boolean',
          defaultValue: true,
          group: 'basic',
        },
        {
          name: 'title',
          label: '标题占位',
          type: 'boolean',
          defaultValue: true,
          group: 'basic',
        },
      ],
      eventSchema: [],
      styleSchema: [],
    },
  }
);
