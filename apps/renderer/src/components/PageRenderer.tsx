/**
 * Enhanced Page Renderer
 *
 * 增强的页面渲染器 - 支持数据源绑定、事件处理和动态属性
 * 使用 @lowcode/events 的 ActionExecutor 和 EventEmitter 进行动作执行
 * 使用 @lowcode/datasource 的 DataSourceManager 进行数据源管理
 * 使用 @lowcode/logic-engine 的 LogicExecutor 执行逻辑流程
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, useRef } from 'react';
import { ConfigProvider, Spin } from 'antd';
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
// 容器渲染器
// ============================================================

const RenderContainer: React.FC<{ component: PageComponent }> = ({ component }) => {
  const context = useRenderContext();
  const componentProps = component.props ?? ({} as ComponentProps);
  const children = component.children ?? [];
  const { ...props } = componentProps;

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
          flexDirection: fd ?? 'row',
          justifyContent: jc ?? 'flex-start',
          alignItems: ai ?? 'flex-start',
          gap: gap ?? 0,
          flexWrap: fw ?? 'nowrap',
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

  const eventEmitter = useMemo(() => new EventEmitter({ debug: false }), []);
  const actionExecutor = useMemo(() => new ActionExecutor(), []);
  const logicExecutor = useMemo(() => new LogicExecutor({ enableLogging: false }), []);

  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const { states: dataSourceStates, reload: reloadDataSource } = usePageDataSources(
    schema.dataSources
  );

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

          const result = await logicExecutor.execute(flow as any, {
            variables: mergedContext,
            trigger: triggerInfo,
          });

          if (result.variables) {
            Object.entries(result.variables).forEach(([k, v]) => {
              if (k in (variables as object)) {
                setVariable(k, v);
              }
            });
          }
        } catch (err) {
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
      reloadDataSource,
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
            background: (page.props.background as string) || '#ffffff',
            padding: (page.props.padding as number) || 0,
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
// 导出
// ============================================================

export { useRenderContext };
export type { PageRendererProps, RenderContextValue, ActionContextValue };
