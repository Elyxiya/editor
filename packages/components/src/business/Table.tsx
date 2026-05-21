import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Table as AntTable, Button, Space, Input, message, Tooltip } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { TableMeta } from './Table.meta';
import type { ComponentProps } from '@lowcode/types';

export { TableMeta };

export function getTableStyles(_props: Record<string, unknown>): React.CSSProperties {
  return {};
}

interface Column {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  filters?: { text: string; value: string }[];
  editable?: boolean;
  render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode;
}

interface LcTableProps extends ComponentProps {
  columns?: Column[];
  dataSource?: Record<string, unknown>[];
  rowKey?: string;
  bordered?: boolean;
  pagination?: boolean | TableProps<Record<string, unknown>>['pagination'];
  pageSize?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showHeader?: boolean;
  size?: 'large' | 'middle' | 'small';
  scroll?: TableProps<Record<string, unknown>>['scroll'];
  rowSelection?: boolean | TableProps<Record<string, unknown>>['rowSelection'];
  loading?: boolean;
  exportCSV?: boolean;
  showRefresh?: boolean;
  dataSourceId?: string;
  tableName?: string;
  onRefresh?: () => void;
  onExportCSV?: () => void;
  onChange?: TableProps<Record<string, unknown>>['onChange'];
  onRowClick?: (record: Record<string, unknown>, index: number) => void;
  onSelectChange?: (selectedRowKeys: React.Key[], selectedRows: Record<string, unknown>[]) => void;
  onCellSave?: (record: Record<string, unknown>, column: Column, value: unknown) => void;
  striped?: boolean;
}

// Inline editable cell
const EditableCell: React.FC<{
  value: unknown;
  record: Record<string, unknown>;
  column: Column;
  onSave: (record: Record<string, unknown>, column: Column, value: unknown) => void;
}> = ({ value, record, column, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleDoubleClick = useCallback(() => {
    setEditing(true);
    setInputValue(String(value ?? ''));
  }, [value]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (inputValue !== String(value ?? '')) {
      onSave(record, column, inputValue);
    }
  }, [inputValue, value, record, column, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setInputValue(String(value ?? ''));
      setEditing(false);
    }
  }, [value]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          border: '1px solid #1677ff',
          borderRadius: 4,
          padding: '2px 8px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{ minHeight: 22, cursor: 'pointer', padding: '2px 0' }}
      title="双击编辑"
    >
      {value !== null && value !== undefined ? String(value) : '-'}
    </div>
  );
};

export const LcTable = Object.assign(
  (props: LcTableProps) => {
    const {
      columns = [],
      dataSource = [],
      rowKey = 'id',
      pagination = true,
      pageSize = 20,
      showSizeChanger = true,
      showQuickJumper = true,
      showHeader = true,
      size = 'middle',
      scroll,
      rowSelection,
      loading = false,
      exportCSV = false,
      showRefresh = false,
      onRefresh,
      onExportCSV,
      onChange,
      onRowClick,
      onSelectChange,
      onCellSave,
      striped,
      style,
      className,
      ...rest
    } = props;

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const handleRow: TableProps<Record<string, unknown>>['onRow'] = (record, index) => ({
      onClick: () => onRowClick?.(record, index as number),
    });

    const handleSelectionChange = rowSelection
      ? {
          selectedRowKeys,
          onChange: (keys: React.Key[], rows: Record<string, unknown>[]) => {
            setSelectedRowKeys(keys);
            onSelectChange?.(keys, rows);
          },
        }
      : undefined;

    const processedColumns = columns.map((col) => {
      const colDef: any = {
        ...col,
        key: col.key || col.dataIndex,
        sorter: col.sortable ? (a: any, b: any) => {
          const va = a[col.dataIndex];
          const vb = b[col.dataIndex];
          if (typeof va === 'number' && typeof vb === 'number') return va - vb;
          return String(va).localeCompare(String(vb));
        } : undefined,
      };

      // Inline edit column
      if (col.editable && onCellSave) {
        colDef.render = (val: unknown, record: Record<string, unknown>, index: number) => (
          <EditableCell
            value={val}
            record={record}
            column={col}
            onSave={onCellSave}
          />
        );
      }

      return colDef;
    });

    const paginationConfig = pagination
      ? {
          pageSize,
          showSizeChanger,
          showQuickJumper,
          showTotal: (total: number) => `共 ${total} 条`,
          ...(typeof pagination === 'object' ? pagination : {}),
        }
      : false;

    const handleExportCSV = useCallback(() => {
      if (onExportCSV) {
        onExportCSV();
        return;
      }
      if (!columns.length || !dataSource.length) {
        message.warning('无数据可导出');
        return;
      }
      const headers = columns.map(c => c.title);
      const rows = dataSource.map(row =>
        columns.map(c => `"${String(row[c.dataIndex] ?? '').replace(/"/g, '""')}"`)
      );
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success('CSV 导出成功');
    }, [columns, dataSource, onExportCSV]);

    return (
      <div style={{ width: '100%' }}>
        {(exportCSV || showRefresh) && (
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              {showRefresh && (
                <Tooltip title="刷新数据">
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => { onRefresh?.(); message.loading({ content: '刷新中...', key: 'refresh' }); }}
                  >
                    刷新
                  </Button>
                </Tooltip>
              )}
              {exportCSV && (
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleExportCSV}
                >
                  导出 CSV
                </Button>
              )}
            </Space>
          </div>
        )}
        <AntTable
          columns={processedColumns}
          dataSource={dataSource}
          rowKey={rowKey}
          pagination={paginationConfig}
          showHeader={showHeader}
          size={size}
          scroll={scroll || { x: 'max-content' }}
          rowSelection={handleSelectionChange}
          loading={loading}
          onChange={onChange}
          onRow={handleRow}
          style={{ ...getTableStyles(props), ...(style as React.CSSProperties) }}
          className={className as string | undefined}
          rowClassName={striped ? (_, index) => index % 2 === 0 ? 'ant-table-row-even' : '' : undefined}
          {...rest}
        />
      </div>
    );
  },
  { meta: TableMeta }
);
