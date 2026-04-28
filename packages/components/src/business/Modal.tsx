import React from 'react';
import { Modal as AntModal, ModalProps } from 'antd';
import { ModalMeta } from './Modal.meta';
import type { ComponentProps } from '@lowcode/types';

export { ModalMeta };

export function getModalStyles(_props: Record<string, unknown>): React.CSSProperties {
  return {};
}

interface LcModalProps extends ComponentProps {
  open?: boolean;
  title?: string;
  width?: number | string;
  closable?: boolean;
  maskClosable?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  onCancel?: () => void;
  onOk?: () => void;
}

export const LcModal = Object.assign(
  (props: LcModalProps) => {
    const {
      open = false,
      title,
      width = 520,
      closable = true,
      maskClosable = true,
      footer,
      children,
      onCancel,
      onOk,
      style,
      className,
      ...rest
    } = props;

    return (
      <AntModal
        open={open}
        title={title}
        width={width as ModalProps['width']}
        closable={closable}
        maskClosable={maskClosable}
        footer={footer}
        onCancel={onCancel}
        onOk={onOk}
        style={{ ...getModalStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        {...rest}
      >
        {children}
      </AntModal>
    );
  },
  { meta: ModalMeta }
);
