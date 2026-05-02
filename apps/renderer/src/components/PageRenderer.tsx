/**
 * Enhanced Page Renderer
 * 
 * 增强的页面渲染器 - 支持数据源绑定、事件处理和动态属性
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { ConfigProvider, Spin, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { getComponent, getComponentMeta } from '@lowcode/components';
import type { PageSchema, PageComponent, DataSource as DataSourceType, ComponentProps } from '@lowcode/types';
import { EventEmitter } from '@lowcode/events';
import { createCache } from '@lowcode/datasource';

// ============================================================
// 类型定义
// ============================================================

interface PageRendererProps {
  schema: PageSchema;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

interface DataSourceState {
  data: unknown;
  loading: boolean;
  error: Error | null;
}

interface RenderContextValue {
  dataSources: Map<string, DataSourceState>;
  variables: Record<string, unknown>;
  setVariable: (name: string, value: unknown) => void;
  executeAction: (actionType: string, config: Record<string, unknown>) => void;
  eventEmitter: EventEmitter;
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
// 数据源管理
// ============================================================

interface UseDataSourceOptions {
  autoLoad?: boolean;
  transform?: (data: unknown) => unknown;
}

function useDataSource(
  dataSource: DataSourceType | undefined,
  options: UseDataSourceOptions = {}
) {
  const [state, setState] = useState<DataSourceState>({
    data: null,
    loading: false,
    error: null,
  });

  const cache = useMemo(() => createCache({ storage: 'memory' }), []);
  const autoLoad = options.autoLoad ?? true;

  const load = useCallback(async () => {
    if (!dataSource) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      let result: unknown;

      if (dataSource.type === 'api') {
        const { url, method = 'GET', params, body, headers, authType } = dataSource.config;

        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(headers as Record<string, string>),
        };

        if (authType === 'bearer') {
          requestHeaders['Authorization'] = `Bearer ${localStorage.getItem('access_token') || ''}`;
        }

        const response = await fetch(url || '/api/data', {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        result = await response.json();
      } else if (dataSource.type === 'mock') {
        // 模拟延迟
        await new Promise((resolve) => setTimeout(resolve, 300));
        result = dataSource.config.mockData;
      } else {
        result = dataSource.config.mockData;
      }

      // 应用数据转换
      if (options.transform) {
        result = options.transform(result);
      }

      setState({ data: result, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [dataSource, options.transform]);

  useEffect(() => {
    if (autoLoad && dataSource) {
      load();
    }
  }, [autoLoad, dataSource, load]);

  return { ...state, reload: load };
}

// ============================================================
// 动态属性解析
// ============================================================

interface ActionContextValue {
  dataSources: Map<string, { data: unknown; loading: boolean; error: Error | null }>;
  variables: Record<string, unknown>;
  setVariable: (name: string, value: unknown) => void;
  eventEmitter: EventEmitter;
}

function resolvePropValue(value: unknown, context: ActionContextValue): unknown {
  if (typeof value !== 'string') return value;

  // 检查是否是变量引用 {{variableName}}
  const variableMatch = value.match(/^\{\{(\w+)\}\}$/);
  if (variableMatch) {
    return context.variables[variableMatch[1]];
  }

  // 检查是否是数据源引用 {{dataSourceName}}
  const dataSourceMatch = value.match(/^\{\{(\w+)\.(\w+)\}\}$/);
  if (dataSourceMatch) {
    const [, dsName, field] = dataSourceMatch;
    const dsState = context.dataSources.get(dsName);
    if (dsState?.data && typeof dsState.data === 'object') {
      return (dsState.data as Record<string, unknown>)[field];
    }
  }

  // 检查是否是三元表达式 {{condition ? value1 : value2}}
  const ternaryMatch = value.match(/^\{\{(.+)\?(.+):(.+)\}\}$/);
  if (ternaryMatch) {
    const [, condition, trueVal, falseVal] = ternaryMatch;
    try {
      const keys = Object.keys(context.variables);
      const values = Object.values(context.variables);
      const fn = new Function(...keys, `return ${condition}`);
      return fn(...values) ? trueVal.trim() : falseVal.trim();
    } catch {
      return value;
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
// 动作执行器
// ============================================================

function createActionExecutor(context: {
  dataSources: Map<string, { data: unknown; loading: boolean; error: Error | null }>;
  variables: Record<string, unknown>;
  setVariable: (name: string, value: unknown) => void;
  eventEmitter: EventEmitter;
}) {
  const executeAction = async (actionType: string, config: Record<string, unknown>) => {
    switch (actionType) {
      case 'showMessage': {
        const content = config['content'] as string | undefined;
        const type = (config['type'] as string) || 'info';
        (message as unknown as Record<string, (msg: string) => void>)[type]?.(content || '');
        break;
      }

      case 'navigate': {
        const path = config['path'] as string | undefined;
        const navParams = (config['params'] as Record<string, unknown>) || {};
        const queryString = new URLSearchParams(
          Object.entries(navParams).map(([k, v]) => [k, String(v)])
        ).toString();
        const finalPath = queryString ? `${path || ''}?${queryString}` : (path || '');
        window.location.href = finalPath;
        break;
      }

      case 'setValue': {
        const { variable, value } = config;
        context.setVariable(variable as string, resolvePropValue(value, context));
        break;
      }

      case 'callApi': {
        const { url, method = 'GET', body } = config;
        try {
          const response = await fetch(url as string, {
            method: method as string,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
          });
          const data = await response.json();
          context.setVariable('_api_response', data);
        } catch (error) {
          context.setVariable('_api_error', error);
        }
        break;
      }

      case 'download': {
        const { url, filename } = config;
        const link = document.createElement('a');
        link.href = url as string;
        if (filename) link.download = filename as string;
        link.click();
        break;
      }

      default:
        console.warn(`Unknown action type: ${actionType}`);
    }
  };

  return executeAction;
}

// ============================================================
// 组件渲染器
// ============================================================

interface RenderComponentProps {
  component: PageComponent;
  isSelected?: boolean;
}

const RenderComponent: React.FC<RenderComponentProps> = ({ component }) => {
  const context = useRenderContext();
  const meta = getComponentMeta(component.type);
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

  // 解析动态属性
  const resolvedProps = useMemo(
    () => resolveProps(component.props || {}, context),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [component.props, context.variables, context.dataSources]
  );

  // 处理事件绑定
  const handleEvent = useCallback(
    (eventName: string, event: React.SyntheticEvent) => {
      context.eventEmitter.emit(eventName as any, {
        componentId: component.id,
        componentType: component.type,
        nativeEvent: event.nativeEvent,
        target: event.target as HTMLElement,
      });
    },
    [component.id, component.type, context.eventEmitter]
  );

  // 处理组件事件
  const mergedProps = useMemo(() => {
    const props: ComponentProps = { ...resolvedProps };

    // 绑定组件事件
    if (component.events) {
      Object.entries(component.events).forEach(([eventName, handler]) => {
        (props as ComponentProps)[eventName] = (e: React.SyntheticEvent) => {
          handleEvent(eventName, e);

          // 执行自定义处理器
          if (handler && typeof handler === 'string') {
            try {
              const keys = Object.keys(context.variables);
              const values = Object.values(context.variables);
              const fn = new Function(...keys, handler);
              fn(...values);
            } catch (error) {
              console.error('Event handler error:', error);
            }
          }
        };
      });
    }

    return props;
  }, [resolvedProps, component.events, handleEvent, context.variables]);

  return <Component {...mergedProps} />;
};

// ============================================================
// 容器渲染器
// ============================================================

const RenderContainer: React.FC<{ component: PageComponent }> = ({ component }) => {
  const context = useRenderContext();
  const componentProps = component.props ?? ({} as ComponentProps);
  const children = component.children ?? [];
  const { ...props } = componentProps;

  // 解析容器属性
  const resolvedProps = useMemo(
    () => resolveProps(props, context),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props, context.variables, context.dataSources]
  );

  // Container 布局
  if (component.type === 'Container') {
    const padding = resolvedProps.padding as React.CSSProperties['padding'];
    const bg = resolvedProps.backgroundColor as string | undefined
      || resolvedProps.background as string | undefined
      || '#ffffff';
    const br = resolvedProps.borderRadius as React.CSSProperties['borderRadius'];
    const mh = resolvedProps.minHeight as React.CSSProperties['minHeight'];
    const fd = resolvedProps.flexDirection as React.CSSProperties['flexDirection'];
    const jc = resolvedProps.justifyContent as React.CSSProperties['justifyContent'];
    const ai = resolvedProps.alignItems as React.CSSProperties['alignItems'];
    const gap = resolvedProps.gap as React.CSSProperties['gap'];
    const fw = resolvedProps.flexWrap as React.CSSProperties['flexWrap'];
    return (
      <div
        style={{
          display: 'flex',
          padding: padding ?? 16,
          background: bg,
          borderRadius: br ?? 0,
          minHeight: mh ?? 'auto',
          flexDirection: fd ?? 'row',
          justifyContent: jc ?? 'flex-start',
          alignItems: ai ?? 'flex-start',
          gap: gap ?? 0,
          flexWrap: fw ?? 'nowrap',
          ...(resolvedProps.style as React.CSSProperties),
        }}
        className={resolvedProps.className as string}
        onClick={(e) => {
          if (resolvedProps.onClick) {
            context.eventEmitter.emit('click' as any, {
              componentId: component.id,
              componentType: component.type,
              nativeEvent: e.nativeEvent,
              target: e.target as HTMLElement,
            });
          }
        }}
      >
        {children?.map((child) => (
          <RenderContainer key={child.id} component={child} />
        ))}
      </div>
    );
  }

  // Space 布局
  if (component.type === 'Space') {
    const gapMap: Record<string, number> = { small: 8, middle: 16, large: 24 };
    const size = resolvedProps.size;
    const gap = typeof size === 'string'
      ? gapMap[size] || 8
      : (size as number ?? 8);
    const dir = resolvedProps.direction as string;
    const align = resolvedProps.align as string;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: dir === 'vertical' ? 'column' : 'row',
          gap,
          alignItems: align === 'center'
            ? 'center'
            : align === 'end'
            ? 'flex-end'
            : 'flex-start',
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

  // Card 布局
  if (component.type === 'Card') {
    const pad = resolvedProps.padding as React.CSSProperties['padding'];
    const bg = resolvedProps.backgroundColor as string | undefined || '#ffffff';
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
          ...(resolvedProps.style as React.CSSProperties),
        }}
        className={resolvedProps.className as string}
      >
        {(ttl as React.ReactNode) && (
          <div
            style={{
              marginBottom: 16,
              fontSize: 16,
              fontWeight: 500,
              color: ttlColor || '#000',
            }}
          >
            {ttl as React.ReactNode}
          </div>
        )}
        {children?.map((child) => (
          <RenderContainer key={child.id} component={child} />
        ))}
      </div>
    );
  }

  // Tag 标签组件（可嵌套在其他组件内）
  if (component.type === 'Tag') {
    const tagProps = { ...resolvedProps };
    delete (tagProps as any).style;
    return (
      <span
        style={resolvedProps.style as React.CSSProperties}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: tagProps }} />
      </span>
    );
  }

  // Badge 徽章组件
  if (component.type === 'Badge') {
    const badgeProps = { ...resolvedProps };
    delete (badgeProps as any).style;
    return (
      <span
        style={resolvedProps.style as React.CSSProperties}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: badgeProps }} />
      </span>
    );
  }

  // Avatar 头像组件
  if (component.type === 'Avatar') {
    const avatarProps = { ...resolvedProps };
    delete (avatarProps as any).style;
    return (
      <span
        style={resolvedProps.style as React.CSSProperties}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: avatarProps }} />
      </span>
    );
  }

  // Progress 进度条组件
  if (component.type === 'Progress') {
    const progressProps = { ...resolvedProps };
    delete (progressProps as any).style;
    return (
      <div
        style={{ width: '100%', ...(resolvedProps.style as React.CSSProperties) }}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: progressProps }} />
      </div>
    );
  }

  // Statistic 统计组件
  if (component.type === 'Statistic') {
    const statProps = { ...resolvedProps };
    delete (statProps as any).style;
    return (
      <span
        style={resolvedProps.style as React.CSSProperties}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: statProps }} />
      </span>
    );
  }

  // Skeleton 骨架屏组件
  if (component.type === 'Skeleton') {
    const skelProps = { ...resolvedProps };
    delete (skelProps as any).style;
    return (
      <div
        style={{ width: '100%', ...(resolvedProps.style as React.CSSProperties) }}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: skelProps }} />
      </div>
    );
  }

  // 图表组件
  if (component.type === 'LineChart' || component.type === 'BarChart' || component.type === 'PieChart') {
    const chartProps = { ...resolvedProps };
    delete (chartProps as any).style;
    return (
      <div
        style={{ width: '100%', ...(resolvedProps.style as React.CSSProperties) }}
        className={resolvedProps.className as string}
      >
        <RenderComponent component={{ ...component, props: chartProps }} />
      </div>
    );
  }

  // 默认容器：递归渲染子元素
  return (
    <>
      {children?.map((child) => (
        <RenderContainer key={child.id} component={child} />
      ))}
    </>
  );
};

// ============================================================
// 页面加载器
// ============================================================

interface UsePageDataOptions {
  dataSources: Record<string, DataSourceType>;
}

function usePageData(dataSources: Record<string, DataSourceType>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dataSourceStates, setDataSourceStates] = useState<Map<string, DataSourceState>>(
    () => new Map()
  );

  const loadDataSources = useCallback(async () => {
    const entries = Object.entries(dataSources);
    if (entries.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const results = await Promise.allSettled(
      entries.map(async ([name, ds]) => {
        let data: unknown;

        if (ds.type === 'api') {
          const { url, method = 'GET', params, body, headers } = ds.config;

          const response = await fetch(url || `/api/${name}`, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(headers as Record<string, string>),
            },
            body: body ? JSON.stringify(body) : undefined,
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          data = await response.json();
        } else if (ds.type === 'mock') {
          await new Promise((resolve) => setTimeout(resolve, 200));
          data = ds.config.mockData;
        } else {
          data = ds.config.mockData;
        }

        return { name, data };
      })
    );

    const newStates = new Map<string, DataSourceState>();

    results.forEach((result, index) => {
      const name = entries[index][0];

      if (result.status === 'fulfilled') {
        newStates.set(name, {
          data: result.value.data,
          loading: false,
          error: null,
        });
      } else {
        newStates.set(name, {
          data: null,
          loading: false,
          error: result.reason as Error,
        });
        setError(result.reason as Error);
      }
    });

    setDataSourceStates(newStates);
    setLoading(false);
  }, [dataSources]);

  useEffect(() => {
    loadDataSources();
  }, [loadDataSources]);

  return { dataSourceStates, loading, error, reload: loadDataSources };
}

// ============================================================
// 主渲染器
// ============================================================

export const PageRenderer: React.FC<PageRendererProps> = ({
  schema,
  onError,
  onLoad,
}) => {
  const { page } = schema;

  // 事件发射器
  const eventEmitter = useMemo(() => new EventEmitter({ debug: false }), []);

  // 变量状态
  const [variables, setVariables] = useState<Record<string, unknown>>({});

  // 数据源状态
  const { dataSourceStates, loading, error, reload } = usePageData(schema.dataSources);

  // 动作执行器
  const executeAction = useMemo(
    () =>
      createActionExecutor({
        dataSources: dataSourceStates,
        variables,
        setVariable: (name: string, value: unknown) => setVariables(prev => ({ ...prev, [name]: value })),
        eventEmitter,
      }),
    [dataSourceStates, variables, eventEmitter]
  );

  // 渲染上下文
  const renderContext: RenderContextValue = useMemo(
    () => ({
      dataSources: dataSourceStates,
      variables,
      setVariable: (name: string, value: unknown) => setVariables(prev => ({ ...prev, [name]: value })),
      executeAction,
      eventEmitter,
    }),
    [dataSourceStates, variables, executeAction, eventEmitter]
  );

  // 加载完成回调
  useEffect(() => {
    if (!loading && onLoad) {
      onLoad();
    }
  }, [loading, onLoad]);

  // 错误回调
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" tip="加载页面数据..." />
      </div>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <RenderContext.Provider value={renderContext}>
        <div
          style={{
            minHeight: '100vh',
            background: page.props.background || '#ffffff',
            padding: page.props.padding || 0,
          }}
        >
          {page.components.map((component) => (
            <RenderContainer key={component.id} component={component} />
          ))}
        </div>
      </RenderContext.Provider>
    </ConfigProvider>
  );
};

// ============================================================
// 导出组件和 Hook
// ============================================================

export { useRenderContext };
export type { PageRendererProps, RenderContextValue, ActionContextValue };
