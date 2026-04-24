import React from 'react';
import { Table as AntTable } from 'antd';
import type { TableProps } from 'antd';
import type { ComponentProps } from '@lowcode/types';
import { TableMeta } from './Table.meta';

export { TableMeta };

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
}

export const LcTable: React.FC<LcTableProps> = (props) => {
  const {
    columns = [],
    dataSource = [],
    rowKey = 'id',
    bordered = false,
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

  const tableStyle: React.CSSProperties = {
    ...(style as React.CSSProperties),
  };

  return (
    <AntTable
      columns={processedColumns}
      dataSource={dataSource}
      rowKey={rowKey}
      bordered={bordered}
      pagination={pagination ? { pageSize, ...(typeof pagination === 'object' ? pagination : {}) } : false}
      showHeader={showHeader}
      size={size}
      scroll={scroll}
      rowSelection={handleSelectionChange}
      loading={loading}
      onChange={onChange}
      onRow={handleRow}
      style={tableStyle}
      className={className}
      rowClassName={props.striped ? 'ant-table-striped' : undefined}
      {...rest}
    />
  );
};

LcTable.meta = TableMeta;
