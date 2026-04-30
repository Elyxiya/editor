/**
 * Advanced Components for LowCode Platform
 *
 * 高级组件 - 提供更丰富的业务组件
 */

import React from 'react';
import { Badge, Tag, Avatar, Progress, Statistic, Skeleton } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { BadgeMeta } from './Badge.meta';
import { TagMeta } from './Tag.meta';
import { AvatarMeta } from './Avatar.meta';
import { ProgressMeta } from './Progress.meta';
import { StatisticMeta } from './Statistic.meta';
import { SkeletonMeta } from './Skeleton.meta';

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
  { meta: BadgeMeta }
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
  { meta: TagMeta }
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
  { meta: AvatarMeta }
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
  { meta: ProgressMeta }
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
  { meta: StatisticMeta }
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
  { meta: SkeletonMeta }
);
