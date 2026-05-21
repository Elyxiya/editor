import React, { useState, useRef, useEffect } from 'react';

export interface DebugLog {
  id: string;
  timestamp: string;
  type: 'api' | 'variable' | 'logic' | 'event';
  message: string;
  detail?: string;
}

interface DebugPanelProps {
  variables: Record<string, unknown>;
  logs: DebugLog[];
  isVisible: boolean;
  onToggle: () => void;
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
}

function formatValue(value: unknown, depth = 0): string {
  if (depth > 3) return '…';
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value.length > 100 ? value.slice(0, 100) + '…' : value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.slice(0, 5).map((v) => formatValue(v, depth + 1)).join(', ');
    return `[${items}${value.length > 5 ? ', …' : ''}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 10);
    const items = entries.map(([k, v]) => `${k}: ${formatValue(v, depth + 1)}`).join(', ');
    return `{${items}${Object.keys(value as Record<string, unknown>).length > 10 ? ', …' : ''}}`;
  }
  return String(value);
}

const LogItem: React.FC<{ log: DebugLog }> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const colorMap = { api: '#1677ff', variable: '#52c41a', logic: '#faad14', event: '#722ed1' };

  return (
    <div
      style={{
        padding: '4px 8px',
        borderBottom: '1px solid #333',
        fontSize: 12,
        fontFamily: 'monospace',
        cursor: log.detail ? 'pointer' : undefined,
        background: expanded ? '#1a1a2e' : 'transparent',
      }}
      onClick={() => log.detail && setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ color: '#666', flexShrink: 0 }}>{formatTime(log.timestamp)}</span>
        <span
          style={{
            background: colorMap[log.type],
            color: '#fff',
            borderRadius: 3,
            padding: '0 4px',
            fontSize: 10,
            flexShrink: 0,
          }}
        >
          {log.type.toUpperCase()}
        </span>
        <span style={{ color: '#ccc', wordBreak: 'break-all' }}>{log.message}</span>
      </div>
      {expanded && log.detail && (
        <pre
          style={{
            margin: '4px 0 0',
            padding: 6,
            background: '#0d0d1a',
            borderRadius: 4,
            color: '#8be9fd',
            fontSize: 11,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {log.detail}
        </pre>
      )}
    </div>
  );
};

export const DebugPanel: React.FC<DebugPanelProps> = ({
  variables,
  logs,
  isVisible,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<'variables' | 'api' | 'logic'>('variables');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (activeTab === 'api') return log.type === 'api' && (log.message.toLowerCase().includes(q) || (log.detail || '').toLowerCase().includes(q));
    if (activeTab === 'logic') return log.type !== 'api' && log.type !== 'variable' && (log.message.toLowerCase().includes(q) || (log.detail || '').toLowerCase().includes(q));
    return true;
  });

  const tabLogs = activeTab === 'api'
    ? filteredLogs.filter((l) => l.type === 'api')
    : activeTab === 'logic'
      ? filteredLogs.filter((l) => l.type === 'logic' || l.type === 'event')
      : filteredLogs;

  const variableEntries = Object.entries(variables);

  return (
    <>
      {/* Toggle button */}
      <div
        onClick={onToggle}
        style={{
          position: 'fixed',
          bottom: isVisible ? 340 : 16,
          right: 16,
          zIndex: 10000,
          background: isVisible ? '#f5222d' : '#1677ff',
          color: '#fff',
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          fontSize: 18,
          userSelect: 'none',
        }}
        title={isVisible ? '关闭调试面板' : '打开调试面板'}
      >
        {isVisible ? '✕' : '⚙'}
      </div>

      {/* Panel */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            zIndex: 9999,
            width: '50%',
            maxWidth: 600,
            height: 320,
            background: '#1e1e2e',
            color: '#cdd6f4',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.4)',
            borderTopLeftRadius: 8,
            fontSize: 13,
          }}
        >
          {/* Header tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #333', flexShrink: 0 }}>
            {(['variables', 'api', 'logic'] as const).map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #1677ff' : '2px solid transparent',
                  color: activeTab === tab ? '#1677ff' : '#888',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: 13,
                  userSelect: 'none',
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'api' ? 'API 日志' : tab === 'logic' ? '逻辑流' : '变量'}
              </div>
            ))}
            <div style={{ flex: 1 }} />
            <label style={{ padding: '8px 12px', fontSize: 11, color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
              自动滚动
            </label>
          </div>

          {/* Search bar */}
          <div style={{ padding: '4px 8px', background: '#181825', flexShrink: 0 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索..."
              style={{
                width: '100%',
                background: '#313244',
                border: '1px solid #45475a',
                borderRadius: 4,
                padding: '4px 8px',
                color: '#cdd6f4',
                fontSize: 12,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Content */}
          <div ref={scrollRef} style={{ flex: 1, overflow: 'auto' }}>
            {activeTab === 'variables' ? (
              variableEntries.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>暂无变量</div>
              ) : (
                variableEntries
                  .filter(([k]) => !search || k.toLowerCase().includes(search.toLowerCase()))
                  .map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        padding: '6px 12px',
                        borderBottom: '1px solid #313244',
                        fontFamily: 'monospace',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ color: '#89b4fa', marginBottom: 2 }}>{key}</div>
                      <pre
                        style={{
                          margin: 0,
                          color: '#a6e3a1',
                          fontSize: 11,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {formatValue(value)}
                      </pre>
                    </div>
                  ))
              )
            ) : (
              tabLogs.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#666' }}>暂无日志</div>
              ) : (
                tabLogs.map((log) => <LogItem key={log.id} log={log} />)
              )
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '4px 12px',
              borderTop: '1px solid #333',
              fontSize: 11,
              color: '#666',
              display: 'flex',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span>{tabLogs.length} 条{(activeTab === 'api' ? ' API ' : activeTab === 'logic' ? ' 逻辑流 ' : ' 变量 ')}记录</span>
            <span>调试面板</span>
          </div>
        </div>
      )}
    </>
  );
};

let logCounter = 0;
export function createDebugLog(
  type: DebugLog['type'],
  message: string,
  detail?: string
): DebugLog {
  logCounter++;
  return {
    id: `log_${logCounter}`,
    timestamp: new Date().toISOString(),
    type,
    message,
    detail,
  };
}
