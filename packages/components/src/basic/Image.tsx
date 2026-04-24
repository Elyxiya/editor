import React from 'react';
import { Image as AntImage } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { ImageMeta } from './Image.meta';

export { ImageMeta };

interface LcImageProps extends ComponentProps {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  preview?: boolean;
  fallback?: string;
  placeholder?: React.ReactNode;
  onClick?: () => void;
}

export const LcImage: React.FC<LcImageProps> = (props) => {
  const {
    src = 'https://picsum.photos/200',
    alt = '图片',
    width = 200,
    height,
    fit = 'cover',
    preview = true,
    fallback,
    placeholder,
    onClick,
    style,
    className,
    ...rest
  } = props;

  return (
    <AntImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={{ objectFit: fit, ...(style as React.CSSProperties) }}
      className={className}
      preview={preview}
      fallback={fallback}
      placeholder={placeholder as boolean}
      onClick={onClick}
      {...rest}
    />
  );
};

LcImage.meta = ImageMeta;
