import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Drawer, Button, Space, Tooltip, Spin } from 'antd';
import {
  CloseOutlined, ReloadOutlined, DesktopOutlined, TabletOutlined, MobileOutlined,
} from '@ant-design/icons';
import type { PageSchema } from '@lowcode/types';
import { DEVICE_WIDTHS } from '@lowcode/utils';

interface PreviewPanelProps {
  open: boolean;
  schema: PageSchema;
  onClose: () => void;
}

type Device = 'pc' | 'tablet' | 'mobile';

const DEVICE_ICONS: Record<Device, React.ReactNode> = {
  pc: <DesktopOutlined />,
  tablet: <TabletOutlined />,
  mobile: <MobileOutlined />,
};

const DEVICE_LABELS: Record<Device, string> = {
  pc: 'PC',
  tablet: '平板',
  mobile: '手机',
};

const MAX_POST_MESSAGE_SIZE = 1_000_000;

function encodeSchemaForTransfer(schema: PageSchema): { compressed: string; method: 'raw' | 'base64' } {
  const raw = JSON.stringify(schema);
  if (raw.length <= MAX_POST_MESSAGE_SIZE) {
    return { compressed: raw, method: 'raw' };
  }
  const encoded = btoa(encodeURIComponent(raw));
  return { compressed: encoded, method: 'base64' };
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ open, schema, onClose }) => {
  const [device, setDevice] = useState<Device>('pc');
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const deviceWidth = DEVICE_WIDTHS[device];

  const buildPreviewUrl = useCallback(() => {
    return `http://localhost:3001/preview?previewMode=true`;
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setIframeKey(k => k + 1);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setIframeKey(k => k + 1);
  }, [open]);

  useEffect(() => {
    if (!open || !schema) return;
    const timeoutId = setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        const { compressed, method } = encodeSchemaForTransfer(schema);
        iframeRef.current.contentWindow.postMessage(
          { type: 'preview-schema', schema: compressed, method, dataSources: schema.dataSources },
          '*'
        );
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [open, schema, iframeKey]);

  return (
    <Drawer
      title={
        <Space>
          <span>页面预览</span>
          <Space size="small">
            {(Object.keys(DEVICE_ICONS) as Device[]).map((d) => (
              <Tooltip key={d} title={`${DEVICE_LABELS[d]} (${DEVICE_WIDTHS[d]}px)`}>
                <Button
                  type={device === d ? 'primary' : 'text'}
                  size="small"
                  icon={DEVICE_ICONS[d]}
                  onClick={() => setDevice(d)}
                />
              </Tooltip>
            ))}
          </Space>
        </Space>
      }
      placement="right"
      width={deviceWidth + 120}
      open={open}
      onClose={onClose}
      maskClosable={false}
      closable={false}
      extra={
        <Space>
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
          </Tooltip>
          <Tooltip title="关闭">
            <Button icon={<CloseOutlined />} onClick={onClose} />
          </Tooltip>
        </Space>
      }
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        wrapper: { top: 64 },
      }}
    >
      <div
        style={{
          position: 'relative',
          width: deviceWidth,
          minHeight: 600,
          margin: '0 auto',
          background: '#f5f5f5',
          flex: 1,
          overflow: 'auto',
          transition: 'width 0.2s ease',
        }}
      >
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.8)',
              zIndex: 10,
            }}
          >
            <Spin size="large" tip="渲染页面中..." />
          </div>
        )}
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={buildPreviewUrl()}
          title="页面预览"
          style={{
            width: '100%',
            height: '100%',
            minHeight: 600,
            border: 'none',
            background: '#fff',
            display: 'block',
          }}
          onLoad={handleIframeLoad}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </Drawer>
  );
};
