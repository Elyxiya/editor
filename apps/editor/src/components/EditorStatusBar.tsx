import React from 'react';
import { Badge, Tooltip } from 'antd';
import { DesktopOutlined, TabletOutlined, MobileOutlined } from '@ant-design/icons';
import { useEditorStore } from '@/store/editorStore';
import { DEVICE_WIDTHS, DEVICE_LABELS } from '@lowcode/utils';
import styles from './EditorStatusBar.module.css';

const deviceIcons: Record<string, React.ReactNode> = {
  pc: <DesktopOutlined />,
  tablet: <TabletOutlined />,
  mobile: <MobileOutlined />,
};

export const EditorStatusBar: React.FC = () => {
  const { schema, selectedId, device, zoom } = useEditorStore();

  const canvasWidth = DEVICE_WIDTHS[device];
  const componentCount = countComponents(schema.page.components);
  const deviceLabel = DEVICE_LABELS[device];

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        <Tooltip title="当前选中的组件">
          <span className={styles.item}>
            选中: <span className={styles.value}>{selectedId || '无'}</span>
          </span>
        </Tooltip>
        <span className={styles.divider} />
        <Tooltip title="当前页面中的组件数量">
          <span className={styles.item}>
            组件: <span className={styles.value}>{componentCount}</span>
          </span>
        </Tooltip>
      </div>

      <div className={styles.center}>
        <span className={styles.item}>
          Schema: <span className={styles.value}>{schema.page.id || '未保存'}</span>
        </span>
      </div>

      <div className={styles.right}>
        <Tooltip title="画布终端尺寸">
          <span className={styles.item}>
            {deviceIcons[device]} <span className={styles.value}>{deviceLabel}</span>
          </span>
        </Tooltip>
        <span className={styles.divider} />
        <Tooltip title="画布宽度">
          <span className={styles.item}>
            宽度: <span className={styles.value}>{canvasWidth}px</span>
          </span>
        </Tooltip>
        <span className={styles.divider} />
        <Tooltip title="画布缩放比例">
          <span className={styles.item}>
            缩放: <span className={styles.value}>{Math.round(zoom * 100)}%</span>
          </span>
        </Tooltip>
        <span className={styles.divider} />
        <span className={styles.item}>
          <Badge
            status={selectedId ? 'processing' : 'default'}
            text={<span className={styles.value}>{selectedId ? '编辑中' : '浏览模式'}</span>}
          />
        </span>
      </div>
    </div>
  );
};

function countComponents(components: any[]): number {
  let count = 0;
  for (const comp of components) {
    count += 1;
    if (comp.children && comp.children.length > 0) {
      count += countComponents(comp.children);
    }
  }
  return count;
}
