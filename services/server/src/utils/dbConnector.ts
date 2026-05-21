import mysql from 'mysql2/promise';
import pg from 'pg';

export interface ConnectionConfig {
  type: 'mysql' | 'postgresql';
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface TableInfo {
  name: string;
  comment: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string | null;
  comment: string;
  maxLength: number | null;
}

export async function testConnection(config: ConnectionConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (config.type === 'mysql') {
      const conn = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectTimeout: 10000,
      });
      await conn.end();
    } else {
      const pool = new pg.Pool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectionTimeoutMillis: 10000,
      });
      const client = await pool.connect();
      client.release();
      await pool.end();
    }
    return { success: true, message: '连接成功' };
  } catch (error: any) {
    return { success: false, message: error.message || '连接失败' };
  }
}

export async function getTables(config: ConnectionConfig): Promise<TableInfo[]> {
  if (config.type === 'mysql') {
    const conn = await mysql.createConnection({
      host: config.host, port: config.port, user: config.user,
      password: config.password, database: config.database,
    });
    const [rows] = await conn.query(
      `SELECT TABLE_NAME as name, TABLE_COMMENT as comment
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [config.database]
    );
    await conn.end();
    return (rows as any[]).map(r => ({ name: r.name, comment: r.comment || '' }));
  } else {
    const pool = new pg.Pool({
      host: config.host, port: config.port, user: config.user,
      password: config.password, database: config.database,
    });
    const res = await pool.query(
      `SELECT tablename as name, obj_description(relfilenode, 'pg_class') as comment
       FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    await pool.end();
    return res.rows.map(r => ({ name: r.name, comment: r.comment || '' }));
  }
}

export async function getTableSchema(config: ConnectionConfig, table: string): Promise<ColumnInfo[]> {
  if (config.type === 'mysql') {
    const conn = await mysql.createConnection({
      host: config.host, port: config.port, user: config.user,
      password: config.password, database: config.database,
    });
    const [rows] = await conn.query(
      `SELECT c.COLUMN_NAME as name, c.DATA_TYPE as type,
              c.IS_NULLABLE = 'YES' as nullable,
              c.COLUMN_KEY = 'PRI' as isPrimaryKey,
              c.COLUMN_DEFAULT as defaultValue,
              c.COLUMN_COMMENT as comment,
              c.CHARACTER_MAXIMUM_LENGTH as maxLength
       FROM INFORMATION_SCHEMA.COLUMNS c
       WHERE c.TABLE_SCHEMA = ? AND c.TABLE_NAME = ?
       ORDER BY c.ORDINAL_POSITION`,
      [config.database, table]
    );
    await conn.end();
    return (rows as any[]).map(r => ({
      name: r.name, type: r.type, nullable: !!r.nullable,
      isPrimaryKey: !!r.isPrimaryKey, defaultValue: r.defaultValue,
      comment: r.comment || '', maxLength: r.maxLength,
    }));
  } else {
    const pool = new pg.Pool({
      host: config.host, port: config.port, user: config.user,
      password: config.password, database: config.database,
    });
    const res = await pool.query(
      `SELECT c.column_name as name, c.data_type as type,
              c.is_nullable = 'YES' as nullable,
              COALESCE(tc.constraint_type = 'PRIMARY KEY', false) as isPrimaryKey,
              c.column_default as defaultValue,
              COALESCE(pgd.description, '') as comment,
              c.character_maximum_length as maxLength
       FROM information_schema.columns c
       LEFT JOIN information_schema.key_column_usage kcu
         ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
         AND kcu.table_schema = 'public'
       LEFT JOIN information_schema.table_constraints tc
         ON kcu.constraint_name = tc.constraint_name
         AND tc.table_schema = 'public'
       LEFT JOIN pg_catalog.pg_statio_all_tables st
         ON c.table_name = st.relname
       LEFT JOIN pg_catalog.pg_description pgd
         ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
       WHERE c.table_schema = 'public' AND c.table_name = $1
       ORDER BY c.ordinal_position`,
      [table]
    );
    await pool.end();
    return res.rows.map(r => ({
      name: r.name, type: r.type, nullable: r.nullable,
      isPrimaryKey: r.isprimarykey || false, defaultValue: r.defaultvalue,
      comment: r.comment || '', maxLength: r.maxlength,
    }));
  }
}

export async function queryData(
  config: ConnectionConfig,
  table: string,
  options: {
    page?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, string>;
  } = {}
): Promise<{ list: Record<string, any>[]; total: number; page: number; pageSize: number }> {
  const page = options.page || 1;
  const pageSize = Math.min(options.pageSize || 20, 100);
  const offset = (page - 1) * pageSize;

  const escapedTable = config.type === 'mysql'
    ? `\`${table}\``
    : `"${table}"`;

  let whereClause = '';
  const params: any[] = [];

  if (options.filters) {
    const conditions: string[] = [];
    for (const [key, value] of Object.entries(options.filters)) {
      if (!value) continue;
      const escapedKey = config.type === 'mysql' ? `\`${key}\`` : `"${key}"`;
      conditions.push(`${escapedKey} LIKE ?`.replace('?', config.type === 'mysql' ? '?' : `$${params.length + 1}`));
      params.push(`%${value}%`);
    }
    if (conditions.length > 0) {
      whereClause = ' WHERE ' + conditions.join(' AND ');
    }
  }

  let orderClause = '';
  if (options.sortField) {
    const dir = options.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const escapedField = config.type === 'mysql' ? `\`${options.sortField}\`` : `"${options.sortField}"`;
    orderClause = ` ORDER BY ${escapedField} ${dir}`;
  }

  if (config.type === 'mysql') {
    const conn = await mysql.createConnection({
      host: config.host, port: config.port, user: config.user,
      password: config.password, database: config.database,
    });

    const countSql = `SELECT COUNT(*) as total FROM ${escapedTable}${whereClause}`;
    const [countRows] = await conn.query(countSql, params);
    const total = (countRows as any[])[0].total;

    const dataSql = `SELECT * FROM ${escapedTable}${whereClause}${orderClause} LIMIT ${pageSize} OFFSET ${offset}`;
    const [dataRows] = await conn.query(dataSql, params);

    await conn.end();
    return { list: dataRows as any[], total: Number(total), page, pageSize };
  } else {
    const pool = new pg.Pool({
      host: config.host, port: config.port, user: config.user,
      password: config.password, database: config.database,
    });

    const countSql = `SELECT COUNT(*) as total FROM ${escapedTable}${whereClause}`;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const dataSql = `SELECT * FROM ${escapedTable}${whereClause}${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const dataRes = await pool.query(dataSql, [...params, pageSize, offset]);

    await pool.end();
    return { list: dataRes.rows, total, page, pageSize };
  }
}
