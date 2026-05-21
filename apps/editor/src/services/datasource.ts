import { api } from './api';
import type { DataSource } from '@lowcode/types';

const API_BASE = 'http://localhost:4000';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function rawPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

async function rawGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getAuthHeaders() });
  return res.json() as Promise<T>;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
}

export interface TableInfo {
  name: string;
  comment: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string | null;
  comment: string;
  maxLength: number | null;
}

export async function testConnection(config: {
  type: string; host: string; port: number; database: string; user: string; password: string;
}): Promise<ConnectionResult> {
  return rawPost(`${API_BASE}/api/datasource/test-connection/raw`, config);
}

export async function getTables(config: {
  type: string; host: string; port: number; database: string; user: string; password: string;
}): Promise<{ success: boolean; data: TableInfo[] }> {
  const params = new URLSearchParams(config as any);
  return rawGet(`${API_BASE}/api/datasource/tables?${params}`);
}

export async function getTableSchema(
  config: {
    type: string; host: string; port: number; database: string; user: string; password: string;
  },
  table: string
): Promise<{ success: boolean; data: ColumnInfo[] }> {
  const params = new URLSearchParams({ ...config, table });
  return rawGet(`${API_BASE}/api/datasource/table-schema?${params}`);
}

export async function createDataSource(data: {
  name: string; type: string; config: any; pageId?: string;
}) {
  return api.post<DataSource>('/datasource', data);
}

export async function getDataSources(pageId?: string) {
  const query = pageId ? `?pageId=${pageId}` : '';
  return api.get<DataSource[]>(`/datasource${query}`);
}

export function generateTableSchemaFromColumns(
  tableName: string,
  columns: ColumnInfo[],
  labelField?: string
) {
  const columnConfigs = columns.map((col) => ({
    key: col.name,
    title: col.comment || col.name,
    dataIndex: col.name,
    width: col.type.includes('char') || col.type.includes('text') ? 200 : 120,
    sortable: true,
    filterable: true,
  }));

  return {
    componentType: 'Table',
    label: `${tableName} 表格`,
    props: {
      columns: columnConfigs,
      pageSize: 20,
      showSizeChanger: true,
      showQuickJumper: true,
      exportCSV: true,
      bordered: true,
      dataSourceId: `ds_${Date.now()}`,
      tableName: tableName,
    },
  };
}
