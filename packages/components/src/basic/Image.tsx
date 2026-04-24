import React from 'react';
import { Image as AntImage, ImageProps } from 'antd';
import { ImageMeta, getImageStyles } from './Image.meta';
import type { ComponentProps } from '@lowcode/types';

export { ImageMeta };

interface LcImageProps extends ComponentProps {
  src?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  fallback?: string;
  preview?: boolean | { visible?: boolean; onVisibleChange?: (visible: boolean) => void };
  placeholder?: React.ReactNode;
  onError?: () => void;
  draggable?: boolean;
}

export const LcImage = Object.assign(
  (props: LcImageProps) => {
    const {
      src,
      alt = '图片',
      width,
      height,
      fallback,
      preview = false,
      placeholder,
      onError,
      draggable,
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
        fallback={fallback}
        preview={preview as ImageProps['preview']}
        placeholder={placeholder}
        onError={onError}
        draggable={draggable}
        style={{ ...getImageStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      />
    );
  },
  { meta: ImageMeta }
);
