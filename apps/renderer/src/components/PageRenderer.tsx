/**
 * Enhanced Page Renderer
 *
 * 增强的页面渲染器 - 支持数据源绑定、事件处理和动态属性
 * 使用 @lowcode/events 的 ActionExecutor 和 EventEmitter 进行动作执行
 * 使用 @lowcode/datasource 的 DataSourceManager 进行数据源管理
 * 使用 @lowcode/logic-engine 的 LogicExecutor 执行逻辑流程
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';
import { ConfigProvider, Spin, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { getComponent } from '@lowcode/components';
import type {
  PageSchema,
  PageComponent,
  DataSource as DataSourceType,
  ComponentProps,
  LogicFlow,
} from '@lowcode/types';
import {
  EventEmitter,
  ActionExecutor,
  createActionFactory,
  type Action,
} from '@lowcode/events';
import {
  DataSourceManager,
  type DataSourceState,
} from '@lowcode/datasource';
import {
  LogicExecutor,
  type TriggerInfo,
} from '@lowcode/logic-engine';

// ============================================================
// 类型定义
// ============================================================

interface PageRendererProps {
  schema: PageSchema;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

interface RenderContextValue {
  dataSources: Map<string, DataSourceState>;
  variables: Record<string, unknown>;
  setVariable: (name: string, value: unknown) => void;
  eventEmitter: EventEmitter;
  actionExecutor: ActionExecutor;
  reloadDataSource: (name: string) => Promise<void>;
}

// ============================================================
// 上下文
// ============================================================

const RenderContext = createContext<RenderContextValue | null>(null);

function useRenderContext(): RenderContextValue {
  const context = useContext(RenderContext);
  if (!context) {
    throw new Error('useRenderContext must be used within PageRenderer');
  }
  return context;
}

// ============================================================
// 表单条件上下文
// ============================================================

import { FormValuesContext, evaluateShowWhen } from '@lowcode/components';
import { usePermission, checkComponentPermission, checkPagePermission } from '../hooks/usePermission';
import { DebugPanel, createDebugLog } from './DebugPanel';
import type { DebugLog } from './DebugPanel';

// ============================================================
// 表格组件数据源包装
// ============================================================

function useTableData(
  dataSourceId: string | undefined,
  componentId: string
) {
  const context = useRenderContext();
  const [tableParams, setTableParams] = useState<{
    page: number;
    pageSize: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, string>;
  }>({ page: 1, pageSize: 20 });

  const dsState = dataSourceId ? context.dataSources.get(dataSourceId) : undefined;

  const data = dsState?.data as { list?: any[]; total?: number } | undefined;
  const loading = dsState?.loading ?? false;

  const reload = useCallback(() => {
    if (!dataSourceId) return;
    const params: Record<string, unknown> = {
      page: tableParams.page,
      pageSize: tableParams.pageSize,
    };
    if (tableParams.sortField) params.sortField = tableParams.sortField;
    if (tableParams.sortOrder) params.sortOrder = tableParams.sortOrder;
    if (tableParams.filters) {
      Object.entries(tableParams.filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
    }
    context.reloadDataSource(dataSourceId);
  }, [dataSourceId, tableParams, context]);

  const handleTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    const newParams: typeof tableParams = {
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 20,
    };
    if (sorter.field) {
      newParams.sortField = sorter.field;
      newParams.sortOrder = sorter.order === 'descend' ? 'desc' : 'asc';
    }
    // Collect text filters
    const textFilters: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && Array.isArray(value) && value.length > 0) {
          textFilters[key] = value[0] as string;
        }
      });
    }
    if (Object.keys(textFilters).length > 0) {
      newParams.filters = textFilters;
    }
    setTableParams(newParams);
  }, []);

  // Reload when params change
  useEffect(() => {
    if (!dataSourceId) return;
    const params: Record<string, unknown> = {
      page: tableParams.page,
      pageSize: tableParams.pageSize,
    };
    if (tableParams.sortField) params.sortField = tableParams.sortField;
    if (tableParams.sortOrder) params.sortOrder = tableParams.sortOrder;
    if (tableParams.filters) {
      Object.entries(tableParams.filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
    }
    // Trigger reload via the data source manager
    context.reloadDataSource(dataSourceId);
  }, [tableParams, dataSourceId, context]);

  const handleRefresh = useCallback(() => {
    reload();
    message.loading({ content: '刷新中...', key: `refresh_${componentId}` });
    setTimeout(() => message.destroy(`refresh_${componentId}`), 2000);
  }, [reload, componentId]);

  return {
    dataSource: data?.list ?? [],
    total: data?.total ?? 0,
    loading,
    handleTableChange,
    handleRefresh,
    tableParams,
  };
}

const TableWithDataSource: React.FC<{
  component: PageComponent;
  resolvedProps: ComponentProps;
}> = ({ component, resolvedProps }) => {
  const dataSourceId = resolvedProps.dataSourceId as string | undefined;
  const tableName = resolvedProps.tableName as string | undefined;
  const tableData = useTableData(dataSourceId, component.id);
  const context = useRenderContext();
  const Component = getComponent(component.type)!;

  // If no data source binding, render with static data
  if (!dataSourceId || !tableName) {
    return <Component {...resolvedProps as any} />;
  }

  const mergedProps: ComponentProps = {
    ...resolvedProps,
    dataSource: tableData.dataSource,
    loading: tableData.loading,
    total: tableData.total,
    onChange: (pagination: any, filters: any, sorter: any) => {
      tableData.handleTableChange(pagination, filters, sorter);
    },
    onRefresh: () => tableData.handleRefresh(),
    pagination: {
      current: tableData.tableParams.page,
      pageSize: tableData.tableParams.pageSize,
      total: tableData.total,
    },
  };

  return <Component {...mergedProps as any} />;
};

// ============================================================
// 数据源管理
// ============================================================

function usePageDataSources(dataSources: Record<string, DataSourceType>) {
  const [states, setStates] = useState<Map<string, DataSourceState>>(() => new Map());
  const managerRef = useRef<DataSourceManager | null>(null);
  const dataSourcesRef = useRef<Record<string, DataSourceType>>(dataSources);

  // Keep ref in sync
  useEffect(() => {
    dataSourcesRef.current = dataSources;
  }, [dataSources]);

  // Initialize or update manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new DataSourceManager({
        debug: false,
        cacheConfig: { storage: 'memory', defaultExpire: 5 * 60 * 1000 },
        interceptors: [
          {
            onRequest: async (config) => {
              const token = localStorage.getItem('token');
              if (token) {
                config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
              }
              return config;
            },
          },
        ],
      });

      managerRef.current.subscribe((newStates) => {
        setStates(new Map(newStates));
      });
    }

    const manager = managerRef.current;

    // Register all data sources from schema
    Object.values(dataSources).forEach((ds) => {
      if (!manager.getDataSource(ds.name)) {
        try {
          manager.register({
            id: ds.id,
            name: ds.name,
            type: ds.type,
            description: ds.description,
            autoLoad: ds.autoLoad,
            loadDelay: ds.loadDelay,
            config: ds.config as any,
          });
        } catch (err) {
          console.warn(`Failed to register data source "${ds.name}":`, err);
        }
      }
    });

    // Load all autoLoad data sources
    Object.values(dataSources).forEach((ds) => {
      if (ds.autoLoad) {
        manager.load(ds.name).catch((err) => {
          console.warn(`Failed to load data source "${ds.name}":`, err);
        });
      }
    });

    // Sync initial states
    setStates(new Map(manager.getStates()));

    return () => {
      // Cleanup: unregister data sources that no longer exist
      const currentNames = new Set(Object.keys(dataSources));
      manager.getAllDataSources().forEach((ds) => {
        if (!currentNames.has(ds.name)) {
          manager.unregister(ds.name);
        }
      });
    };
  }, [dataSources]);

  const reload = useCallback(async (name: string) => {
    if (managerRef.current) {
      await managerRef.current.load(name);
    }
  }, []);

  return { states, reload };
}

// ============================================================
// 动态属性解析
// ============================================================

interface ActionContextValue {
  dataSources: Map<string, DataSourceState>;
  variables: Record<string, unknown>;
  eventEmitter: EventEmitter;
}

function resolvePropValue(value: unknown, context: ActionContextValue): unknown {
  if (typeof value !== 'string') return value;

  const variableMatch = value.match(/^\{\{(\w+)\}\}$/);
  if (variableMatch) {
    return context.variables[variableMatch[1]];
  }

  const dataSourceMatch = value.match(/^\{\{(\w+)\.(\w+)\}\}$/);
  if (dataSourceMatch) {
    const [, dsName, field] = dataSourceMatch;
    const dsState = context.dataSources.get(dsName);
    if (dsState?.data && typeof dsState.data === 'object') {
      return (dsState.data as Record<string, unknown>)[field];
    }
  }

  return value;
}

function resolveProps(props: ComponentProps, context: ActionContextValue): ComponentProps {
  const resolved: ComponentProps = {};
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = resolvePropValue(value, context);
  }
  return resolved;
}

// ============================================================
// 组件渲染器
// ============================================================

interface RenderComponentProps {
  component: PageComponent;
}

const RenderComponent: React.FC<RenderComponentProps> = ({ component }) => {
  const context = useRenderContext();
  const Component = getComponent(component.type);

  if (!Component) {
    return (
      <div
        style={{
          padding: 16,
          background: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: 4,
        }}
      >
        未知组件: {component.type}
      </div>
    );
  }

  const resolvedProps = useMemo(
    () => resolveProps(component.props || {}, context),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [component.props, context.variables, context.dataSources]
  );

  const handleEvent = useCallback(
    (eventName: string, nativeEvent: Event) => {
      context.eventEmitter.emit(eventName, {
        componentId: component.id,
        componentType: component.type,
        nativeEvent,
        target: nativeEvent.target as HTMLElement | null,
        bubbles: nativeEvent.bubbles,
        cancelable: nativeEvent.cancelable,
        timestamp: nativeEvent.timeStamp,
        data: {},
      });
    },
    [component.id, component.type, context.eventEmitter]
  );

  const mergedProps = useMemo(() => {
    const props: ComponentProps = { ...resolvedProps };

    if (component.events) {
      Object.entries(component.events).forEach(([eventName, actionList]) => {
        if (Array.isArray(actionList)) {
          (props as ComponentProps)[eventName] = (e: React.SyntheticEvent) => {
            handleEvent(eventName, e.nativeEvent);
            const actions: Action[] = actionList.map((a) =>
              typeof a === 'string'
                ? createActionFactory().createExpression(a)
                : a
            );
            context.actionExecutor.executeBatch(actions);
          };
        }
      });
    }

    return props;
  }, [resolvedProps, component.events, handleEvent, context.actionExecutor]);

  return <Component {...mergedProps} />;
};

// ============================================================
// 表单条件字段包装
// ============================================================

const FormWithContext: React.FC<{
  component: PageComponent;
  resolvedProps: ComponentProps;
}> = ({ component, resolvedProps }) => {
  const children = component.children ?? [];
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const getFieldValue = useCallback((name: string): unknown => {
    return formValues[name];
  }, [formValues]);

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const formContextValue = useMemo(() => ({ getFieldValue, setFieldValue }), [getFieldValue, setFieldValue]);

  const handleFormFinish = useCallback((values: Record<string, unknown>) => {
    setFormValues(values);
    if (resolvedProps.onFinish) {
      (resolvedProps.onFinish as (v: Record<string, unknown>) => void)(values);
    }
  }, [resolvedProps.onFinish]);

  const handleValuesChange = useCallback((changedValues: Record<string, unknown>) => {
    setFormValues(prev => ({ ...prev, ...changedValues }));
  }, []);

  return (
    <FormValuesContext.Provider value={formContextValue}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleFormFinish(formValues);
        }}
        style={{
          width: '100%',
          ...(resolvedProps.style as React.CSSProperties),
        }}
        className={resolvedProps.className as string}
      >
        {children?.map((child) => (
          <RenderContainer key={child.id} component={child} />
        ))}
      </form>
    </FormValuesContext.Provider>
  );
};

// ============================================================
// 容器渲染器
// ============================================================

const RenderContainer: React.FC<{ component: PageComponent }> = ({ component }) => {
  const context = useRenderContext();
  const { user } = usePermission();
  const componentProps = component.props ?? ({} as ComponentProps);
  const children = component.children ?? [];
  const { ...props } = componentProps;

  // Check component-level permission
  if (!checkComponentPermission(user, component.permissionExpression)) {
    return null;
  }

  const resolvedProps = useMemo(
    () => resolveProps(props, context),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props, context.variables, context.dataSources]
  );

  if (component.type === 'Container') {
    const padding = resolvedProps.padding as React.CSSProperties['padding'];
    const bg =
      (resolvedProps.backgroundColor as string | undefined) ||
      (resolvedProps.background as string | undefined) ||
      '#ffffff';
    const br = resolvedProps.borderRadius as React.CSSProperties['borderRadius'];
    const mh = resolvedProps.minHeight as React.CSSProperties['minHeight'];
    const fd = resolvedProps.flexDirection as React.CSSProperties['flexDirection'];
    const jc = resolvedProps.justifyContent as React.CSSProperties['justifyContent'];
    const ai = resolvedProps.alignItems as React.CSSProperties['alignItems'];
    const gap = resolvedProps.gap as React.CSSProperties['gap'];
    const fw = resolvedProps.flexWrap as React.CSSProperties['flexWrap'];

    const handleClick = (e: React.MouseEvent) => {
      context.eventEmitter.emit('click', {
        componentId: component.id,
        componentType: component.type,
        nativeEvent: e.nativeEvent,
        target: e.target as HTMLElement,
        bubbles: e.bubbles,
        cancelable: e.cancelable,
        timestamp: e.timeStamp,
        data: {},
      });
      if (resolvedProps.onClick) {
        (resolvedProps.onClick as (e: React.MouseEvent) => void)(e);
      }
    };

    return (
      <div
        style={{
          display: 'flex',
          padding: padding ?? 16,
          background: bg,
          borderRadius: br ?? 0,
          minHeight: mh ?? 'auto',
          flexDirection: fd ?? 'column',
          justifyContent: jc ?? 'flex-start',
          alignItems: ai ?? 'stretch',
          gap: gap ?? 0,
          flexWrap: fw ?? 'wrap',
          maxWidth: '100%',
          overflow: 'hidden',
          ...(resolvedProps.style as React.CSSProperties),
        }}
        className={resolvedProps.className as string}
        onClick={handleClick}
      >
        {children?.map((child) => (
          <RenderContainer key={child.id} component={child} />
        ))}
      </div>
    );
  }

  if (component.type === 'Space') {
    const gapMap: Record<string, number> = { small: 8, middle: 16, large: 24 };
    const size = resolvedProps.size;
    const gap = typeof size === 'string' ? gapMap[size] || 8 : ((size as number) ?? 8);
    const dir = resolvedProps.direction as string;
    const align = resolvedProps.align as string;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: dir === 'vertical' ? 'column' : 'row',
          gap,
          alignItems:
            align === 'center' ? 'center' : align === 'end' ? 'flex-end' : 'flex-start',
          maxWidth: '100%',
          overflow: 'hidden',
          flexWrap: 'wrap',
          ...(resolvedProps.style as React.CSSProperties),
        }}
        className={resolvedProps.className as string}
      >
        {children?.map((child) => (
          <RenderContainer key={child.id} component={child} />
        ))}
      </div>
    );
  }

  // Form with conditional field support
  if (component.type === 'Form') {
    return (
      <FormWithContext component={component} resolvedProps={resolvedProps} />
    );
  }

  if (component.type === 'Card') {
    const pad = resolvedProps.padding as React.CSSProperties['padding'];
    const bg = (resolvedProps.backgroundColor as string | undefined) || '#ffffff';
    const br = resolvedProps.borderRadius as React.CSSProperties['borderRadius'];
    const sh = resolvedProps.shadow as string;
    const ttl = resolvedProps.title;
    const ttlColor = resolvedProps.titleColor as string;

    return (
      <div
        style={{
          padding: pad ?? 16,
          background: bg,
          borderRadius: br ?? 8,
          boxShadow: sh ?? '0 1px 2px rgba(0,0,0,0.1)',
          maxWidth: '100%',
          overflow: 'hidden',
          ...(resolvedProps.style as React.CSSProperties),
        }}
        className={resolvedProps.className as string}
      >
        {ttl && (
          <div
            style={{
              marginBottom: 16,
              fontSize: 16,
              fontWeight: 500,
              color: ttlColor || '#000',
            }}
          >
            {ttl}
          </div>
        )}
        {children?.map((child) => (
          <RenderContainer key={child.id} component={child} />
        ))}
      </div>
    );
  }

  if (component.type === 'Tag') {
    const tagProps = { ...resolvedProps };
    delete (tagProps as Record<string, unknown>).style;
    return (
      <span
        style={resolvedProps.style as React.CSSProperties}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: tagProps }} />
      </span>
    );
  }

  if (component.type === 'Badge') {
    const badgeProps = { ...resolvedProps };
    delete (badgeProps as Record<string, unknown>).style;
    return (
      <span
        style={resolvedProps.style as React.CSSProperties}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: badgeProps }} />
      </span>
    );
  }

  if (component.type === 'Avatar') {
    const avatarProps = { ...resolvedProps };
    delete (avatarProps as Record<string, unknown>).style;
    return (
      <span
        style={resolvedProps.style as React.CSSProperties}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: avatarProps }} />
      </span>
    );
  }

  if (component.type === 'Progress') {
    const progressProps = { ...resolvedProps };
    delete (progressProps as Record<string, unknown>).style;
    return (
      <div
        style={{ width: '100%', ...(resolvedProps.style as React.CSSProperties) }}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: progressProps }} />
      </div>
    );
  }

  if (component.type === 'Statistic') {
    const statProps = { ...resolvedProps };
    delete (statProps as Record<string, unknown>).style;
    return (
      <span
        style={resolvedProps.style as React.CSSProperties}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: statProps }} />
      </span>
    );
  }

  if (component.type === 'Skeleton') {
    const skelProps = { ...resolvedProps };
    delete (skelProps as Record<string, unknown>).style;
    return (
      <div
        style={{ width: '100%', ...(resolvedProps.style as React.CSSProperties) }}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: skelProps }} />
      </div>
    );
  }

  if (component.type === 'DataTable' || component.type === 'Table') {
    return <TableWithDataSource component={component} resolvedProps={resolvedProps} />;
  }

  if (
    component.type === 'LineChart' ||
    component.type === 'BarChart' ||
    component.type === 'PieChart'
  ) {
    const chartProps = { ...resolvedProps };
    delete (chartProps as Record<string, unknown>).style;
    return (
      <div
        style={{ width: '100%', ...(resolvedProps.style as React.CSSProperties) }}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: chartProps }} />
      </div>
    );
  }

  return (
    <>
      {children?.map((child) => (
        <RenderContainer key={child.id} component={child} />
      ))}
    </>
  );
};

// ============================================================
// 主渲染器
// ============================================================

export const PageRenderer: React.FC<PageRendererProps> = ({
  schema,
  onError,
  onLoad,
}) => {
  const { page } = schema;

  const { user, canViewPage } = usePermission();
  const eventEmitter = useMemo(() => new EventEmitter({ debug: false }), []);
  const actionExecutor = useMemo(() => new ActionExecutor(), []);
  const logicExecutor = useMemo(() => new LogicExecutor({ enableLogging: false }), []);

  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const { states: dataSourceStates, reload: reloadDataSource } = usePageDataSources(
    schema.dataSources
  );

  // Debug panel state
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      setDebugVisible(true);
    }
  }, []);

  const addDebugLog = useCallback((type: DebugLog['type'], message: string, detail?: string) => {
    setDebugLogs((prev) => [...prev.slice(-500), createDebugLog(type, message, detail)]);
  }, []);

  // Log variable changes
  const prevVariablesRef = useRef(variables);
  useEffect(() => {
    const prev = prevVariablesRef.current;
    const changed: string[] = [];
    Object.entries(variables).forEach(([k, v]) => {
      if (prev[k] !== v) changed.push(k);
    });
    Object.keys(prev).forEach((k) => {
      if (!(k in variables)) changed.push(k);
    });
    if (changed.length > 0) {
      addDebugLog('variable', `变量变更: ${changed.join(', ')}`, JSON.stringify(variables, null, 2));
    }
    prevVariablesRef.current = variables;
  }, [variables, addDebugLog]);
  useEffect(() => {
    dataSourceStates.forEach((state, name) => {
      addDebugLog('variable', `数据源 [${name}] ${state.loading ? '加载中…' : state.error ? '加载失败' : '已更新'}`, state.error ? state.error.message : JSON.stringify(state.data, null, 2));
    });
  }, [dataSourceStates, addDebugLog]);

  // Execute logic flows from schema when component events fire
  useEffect(() => {
    const flows = schema.logic;
    if (!flows || Object.keys(flows).length === 0) return;

    const unsubscribers: Array<() => void> = [];

    Object.values(flows).forEach((flow: LogicFlow) => {
      const triggerNode = flow.nodes.find((n: any) => n.category === 'trigger');
      if (!triggerNode) return;

      const triggerType = triggerNode.type as string;
      const handler = async (event: any) => {
        try {
          const triggerInfo: TriggerInfo = {
            type: triggerType,
            source: event?.componentId,
            payload: event,
          };

          const mergedContext: Record<string, unknown> = { ...variables };
          dataSourceStates.forEach((state, name) => {
            mergedContext[name] = state.data;
          });

          addDebugLog('logic', `逻辑流 [${flow.name || flow.id}] 触发 (${triggerType})`, JSON.stringify({ trigger: triggerInfo, variables: mergedContext }, null, 2));

          const result = await logicExecutor.execute(flow as any, {
            variables: mergedContext,
            trigger: triggerInfo,
          });

          addDebugLog('logic', `逻辑流 [${flow.name || flow.id}] 执行完成`, JSON.stringify(result, null, 2));

          if (result.variables) {
            Object.entries(result.variables).forEach(([k, v]) => {
              if (k in (variables as object)) {
                setVariable(k, v);
              }
            });
          }
        } catch (err) {
          addDebugLog('logic', `逻辑流 [${flow.name || flow.id}] 执行失败`, err instanceof Error ? err.message : String(err));
          console.warn(`[LogicEngine] Flow ${flow.id} execution failed:`, err);
        }
      };

      eventEmitter.on(triggerType, handler as any);
      unsubscribers.push(() => eventEmitter.off(triggerType));
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.logic]);

  // Update action executor context when data sources or variables change
  useEffect(() => {
    const newContext: Record<string, unknown> = { ...variables };

    dataSourceStates.forEach((state, name) => {
      newContext[name] = state.data;
      newContext[`${name}_loading`] = state.loading;
      newContext[`${name}_error`] = state.error?.message ?? null;
    });

    actionExecutor.setContext(newContext);
  }, [variables, dataSourceStates, actionExecutor]);

  // Wrap reload with API logging
  const reloadWithLogging = useCallback(async (name: string) => {
    addDebugLog('api', `API 请求: ${name}`);
    const start = performance.now();
    try {
      await reloadDataSource(name);
      const duration = ((performance.now() - start) / 1000).toFixed(2);
      addDebugLog('api', `API 完成: ${name}`, `耗时 ${duration}s`);
    } catch (err) {
      const duration = ((performance.now() - start) / 1000).toFixed(2);
      addDebugLog('api', `API 错误: ${name}`, `${err} (${duration}s)`);
    }
  }, [reloadDataSource, addDebugLog]);

  const setVariable = useCallback(
    (name: string, value: unknown) => {
      setVariables((prev) => {
        const next = { ...prev, [name]: value };
        actionExecutor.setContext({
          ...actionExecutor.getContext(),
          ...next,
        });
        return next;
      });
    },
    [actionExecutor]
  );

  const loading = useMemo(() => {
    for (const state of dataSourceStates.values()) {
      if (state.loading) return true;
    }
    return false;
  }, [dataSourceStates]);

  const renderContext: RenderContextValue = useMemo(
    () => ({
      dataSources: dataSourceStates,
      variables,
      setVariable,
      eventEmitter,
      actionExecutor,
      reloadDataSource: reloadWithLogging,
    }),
    [dataSourceStates, variables, setVariable, eventEmitter, actionExecutor, reloadDataSource]
  );

  useEffect(() => {
    if (!loading && onLoad) {
      onLoad();
    }
  }, [loading, onLoad]);

  useEffect(() => {
    const hasError = Array.from(dataSourceStates.values()).some((s) => s.error);
    if (hasError && onError) {
      const firstError = Array.from(dataSourceStates.values()).find((s) => s.error);
      if (firstError?.error) {
        onError(firstError.error);
      }
    }
  }, [dataSourceStates, onError]);

  // Collect debug variables from data sources
  const debugVariables = useMemo(() => {
    const vars: Record<string, unknown> = { ...variables };
    dataSourceStates.forEach((state, name) => {
      vars[name] = state.data;
      vars[`${name}_loading`] = state.loading;
      vars[`${name}_error`] = state.error?.message ?? null;
    });
    return vars;
  }, [variables, dataSourceStates]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 12,
        }}
      >
        <Spin size="large" />
        <span style={{ color: '#666', fontSize: 14 }}>加载页面数据...</span>
      </div>
    );
  }

  // Check page-level permission
  if (!canViewPage(page.allowedRoles)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 12,
        }}
      >
        <span style={{ color: '#999', fontSize: 16 }}>权限不足，无法访问此页面</span>
      </div>
    );
  }

  return (
    <>
      <ConfigProvider locale={zhCN}>
        <RenderContext.Provider value={renderContext}>
          <div
            style={{
              minHeight: '100vh',
              background: (page.props.background as string) || '#ffffff',
              padding: (page.props.padding as number) || 0,
              maxWidth: '100%',
              overflowX: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {page.components.map((component) => (
              <RenderContainer key={component.id} component={component} />
            ))}
          </div>
        </RenderContext.Provider>
      </ConfigProvider>
      <DebugPanel
        variables={debugVariables}
        logs={debugLogs}
        isVisible={debugVisible}
        onToggle={() => setDebugVisible(!debugVisible)}
      />
    </>
  );
};

// ============================================================
// 导出
// ============================================================

export { useRenderContext };
export type { PageRendererProps, RenderContextValue, ActionContextValue };
