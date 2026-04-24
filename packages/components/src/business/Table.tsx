import React from 'react';
import { Table as AntTable, TableProps } from 'antd';
import { TableMeta } from './Table.meta';
import type { ComponentProps } from '@lowcode/types';

export { TableMeta };

export function getTableStyles(props: Record<string, unknown>): React.CSSProperties {
  return {};
}

interface Column {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filters?: { text: string; value: string }[];
  render?: (value: unknown, record: Record<string, unknown>, index: number) => React.ReactNode;
}

interface LcTableProps extends ComponentProps {
  columns?: Column[];
  dataSource?: Record<string, unknown>[];
  rowKey?: string;
  bordered?: boolean;
  pagination?: boolean | TableProps<Record<string, unknown>>['pagination'];
  pageSize?: number;
  showHeader?: boolean;
  size?: 'large' | 'middle' | 'small';
  scroll?: TableProps<Record<string, unknown>>['scroll'];
  rowSelection?: TableProps<Record<string, unknown>>['rowSelection'];
  loading?: boolean;
  onChange?: TableProps<Record<string, unknown>>['onChange'];
  onRowClick?: (record: Record<string, unknown>, index: number) => void;
  onSelectChange?: (selectedRowKeys: React.Key[], selectedRows: Record<string, unknown>[]) => void;
  striped?: boolean;
}

export const LcTable = Object.assign(
  (props: LcTableProps) => {
    const {
      columns = [],
      dataSource = [],
      rowKey = 'id',
      variant = 'outlined',
      pagination = true,
      pageSize = 10,
      showHeader = true,
      size = 'middle',
      scroll,
      rowSelection,
      loading = false,
      onChange,
      onRowClick,
      onSelectChange,
      striped,
      style,
      className,
      ...rest
    } = props;

    const handleRow: TableProps<Record<string, unknown>>['onRow'] = (record, index) => ({
      onClick: () => onRowClick?.(record, index as number),
    });

    const handleSelectionChange: TableProps<Record<string, unknown>>['rowSelection'] = rowSelection
      ? {
          ...rowSelection,
          onChange: (selectedRowKeys, selectedRows) => {
            onSelectChange?.(selectedRowKeys as React.Key[], selectedRows);
          },
        }
      : undefined;

    const processedColumns = columns.map((col) => ({
      ...col,
      key: col.key || col.dataIndex,
    }));

    return (
      <AntTable
        columns={processedColumns}
        dataSource={dataSource}
        rowKey={rowKey}
        variant={variant}
        pagination={pagination ? { pageSize, ...(typeof pagination === 'object' ? pagination : {}) } : false}
        showHeader={showHeader}
        size={size as TableProps<Record<string, unknown>>['size']}
        scroll={scroll}
        rowSelection={handleSelectionChange}
        loading={loading}
        onChange={onChange}
        onRow={handleRow}
        style={{ ...getTableStyles(props), ...(style as React.CSSProperties) }}
        className={className as string | undefined}
        rowClassName={striped ? 'ant-table-striped' : undefined}
        {...rest}
      />
    );
  },
  { meta: TableMeta }
);
