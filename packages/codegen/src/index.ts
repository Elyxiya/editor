/**
 * 代码导出引擎 - Code Generator Engine
 * 
 * 负责将低代码 Schema 转换为可独立运行的 React + TypeScript 代码
 */

import type { PageSchema, PageComponent, DataSource } from '@lowcode/types';

// ============================================================
// 组件类型映射
// ============================================================

interface ComponentTemplate {
  importStatement: string;      // import 语句
  componentName: string;        // 组件名称
  isContainer: boolean;          // 是否是容器组件
  childHandling?: 'none' | 'children' | 'slots';  // 子元素处理方式
}

const COMPONENT_TEMPLATES: Record<string, ComponentTemplate> = {
  Button: {
    importStatement: "import { Button } from 'antd';",
    componentName: 'Button',
    isContainer: false,
  },
  Input: {
    importStatement: "import { Input } from 'antd';",
    componentName: 'Input',
    isContainer: false,
  },
  Text: {
    importStatement: "import { Typography } from 'antd';",
    componentName: 'Typography.Text',
    isContainer: false,
  },
  Image: {
    importStatement: "import { Image } from 'antd';",
    componentName: 'Image',
    isContainer: false,
  },
  Form: {
    importStatement: "import { Form } from 'antd';",
    componentName: 'Form',
    isContainer: true,
    childHandling: 'children',
  },
  FormItem: {
    importStatement: "import { Form } from 'antd';",
    componentName: 'Form.Item',
    isContainer: false,
  },
  Select: {
    importStatement: "import { Select } from 'antd';",
    componentName: 'Select',
    isContainer: false,
  },
  Container: {
    importStatement: "import { ConfigProvider } from 'antd';",
    componentName: 'div',
    isContainer: true,
    childHandling: 'children',
  },
  Space: {
    importStatement: "import { Space } from 'antd';",
    componentName: 'Space',
    isContainer: true,
    childHandling: 'children',
  },
  Card: {
    importStatement: "import { Card } from 'antd';",
    componentName: 'Card',
    isContainer: true,
    childHandling: 'children',
  },
  Table: {
    importStatement: "import { Table } from 'antd';",
    componentName: 'Table',
    isContainer: false,
  },
  Modal: {
    importStatement: "import { Modal } from 'antd';",
    componentName: 'Modal',
    isContainer: true,
    childHandling: 'children',
  },
  Tabs: {
    importStatement: "import { Tabs } from 'antd';",
    componentName: 'Tabs',
    isContainer: true,
    childHandling: 'children',
  },
  Divider: {
    importStatement: "import { Divider } from 'antd';",
    componentName: 'Divider',
    isContainer: false,
  },
  Badge: {
    importStatement: "import { Badge } from 'antd';",
    componentName: 'Badge',
    isContainer: false,
  },
  Tag: {
    importStatement: "import { Tag } from 'antd';",
    componentName: 'Tag',
    isContainer: false,
  },
  Avatar: {
    importStatement: "import { Avatar } from 'antd';",
    componentName: 'Avatar',
    isContainer: false,
  },
  Progress: {
    importStatement: "import { Progress } from 'antd';",
    componentName: 'Progress',
    isContainer: false,
  },
  Statistic: {
    importStatement: "import { Statistic } from 'antd';",
    componentName: 'Statistic',
    isContainer: false,
  },
  Skeleton: {
    importStatement: "import { Skeleton } from 'antd';",
    componentName: 'Skeleton',
    isContainer: false,
  },
  LineChart: {
    importStatement: "import { LineChart } from '@/components/chart/LineChart';",
    componentName: 'LineChart',
    isContainer: false,
  },
  BarChart: {
    importStatement: "import { BarChart } from '@/components/chart/BarChart';",
    componentName: 'BarChart',
    isContainer: false,
  },
  PieChart: {
    importStatement: "import { PieChart } from '@/components/chart/PieChart';",
    componentName: 'PieChart',
    isContainer: false,
  },
};

// ============================================================
// 代码生成选项
// ============================================================

export interface CodeGenOptions {
  projectName: string;           // 项目名称
  pageName: string;              // 页面名称
  useTypeScript: boolean;        // 是否使用 TypeScript
  useCSSModules: boolean;        // 是否使用 CSS Modules
  useTailwind: boolean;          // 是否使用 Tailwind CSS
}

// ============================================================
// 代码生成结果
// ============================================================

export interface GeneratedFile {
  path: string;                 // 文件路径
  content: string;               // 文件内容
  language: 'tsx' | 'ts' | 'css' | 'json' | 'md' | 'html';
}

export interface CodeGenResult {
  files: GeneratedFile[];        // 生成的文件列表
  dependencies: string[];        // 需要的 npm 依赖
  exports: string[];             // 导出的文件名
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 将 kebab-case 转换为 PascalCase
 */
function kebabToPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * 首字母大写
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 将 props 对象转换为 JSX 属性字符串
 */
function propsToJSX(props: Record<string, unknown>, indent: string = '  '): string {
  const entries = Object.entries(props);
  if (entries.length === 0) return '';
  
  const propLines = entries.map(([key, value]) => {
    const propKey = key.includes('-') ? `"${key}"` : key;
    
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'boolean') {
      return value ? propKey : '';
    }
    
    if (typeof value === 'string') {
      // 处理包含特殊字符的字符串
      if (value.includes('"') || value.includes("'") || value.includes('\n')) {
        return `${propKey}={"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}`;
      }
      return `${propKey}="${value}"`;
    }
    
    if (typeof value === 'number') {
      return `${propKey}={${value}}`;
    }
    
    if (typeof value === 'object') {
      return `${propKey}={${JSON.stringify(value)}}`;
    }
    
    return `${propKey}={${String(value)}}`;
  }).filter(Boolean);
  
  if (propLines.length <= 3) {
    return propLines.length > 0 ? ' ' + propLines.join(' ') : '';
  }
  
  return '\n' + propLines.map(line => indent + line).join('\n') + '\n' + indent.slice(0, -2);
}

// ============================================================
// 组件代码生成
// ============================================================

function generateComponentCode(
  component: PageComponent,
  _index: number,
  options: CodeGenOptions
): string {
  const template = COMPONENT_TEMPLATES[component.type];

  // 如果没有模板，返回占位符
  if (!template) {
    return `// Unknown component type: ${component.type}`;
  }

  const { componentName, isContainer, childHandling } = template;
  const props = component.props || {};
  
  // 生成属性字符串
  const propsStr = propsToJSX(props);
  
  // 处理子组件
  if (isContainer && childHandling === 'children' && component.children && component.children.length > 0) {
    const childrenCode = component.children
      .map((child, childIndex) => generateComponentCode(child, childIndex, options))
      .filter(Boolean)
      .join('\n\n');

    return `<${componentName}${propsStr}>\n  ${childrenCode}\n</${componentName}>`;
  }

  // 处理自闭合标签
  if (!isContainer || !component.children || component.children.length === 0) {
    // Tag 标签组件需要 children
    if (componentName === 'Tag') {
      const text = props.children || props.text || '标签';
      return `<${componentName}${propsStr}>${text}</${componentName}>`;
    }

    // Statistic 统计组件（Ant Design 5 直接使用 props）
    if (componentName === 'Statistic') {
      const title = props.title || '统计值';
      const value = props.value !== undefined ? String(props.value) : '0';
      const suffix = props.suffix ? props.suffix : '';
      const precision = props.precision !== undefined ? ` precision={${props.precision}}` : '';
      return `<Statistic title="${title}" value="${value}"${suffix ? ` suffix="${suffix}"` : ''}${precision} />`;
    }

    // Avatar 头像组件
    if (componentName === 'Avatar') {
      const src = props.src;
      if (src) {
        return `<${componentName}${propsStr} />`;
      }
      return `<${componentName}${propsStr}>头像</${componentName}>`;
    }

    // Typography.Text 需要 children
    if (componentName === 'Typography.Text') {
      const text = props.text || props.children || component.label || '';
      return `<${componentName}${propsStr}>${text}</${componentName}>`;
    }

    // Image 需要 fallback
    if (componentName === 'Image') {
      const src = props.src || props.srcSet;
      if (src) {
        return `<${componentName}${propsStr} />`;
      }
      return `<${componentName}${propsStr} fallback="https://via.placeholder.com/200" />`;
    }

    if (componentName === 'div') {
      if (component.children && component.children.length > 0) {
        const childrenCode = component.children
          .map((child, childIndex) => generateComponentCode(child, childIndex, options))
          .filter(Boolean)
          .join('\n\n');
        return `<div${propsStr}>\n  ${childrenCode}\n</div>`;
      }
      return `<div${propsStr} />`;
    }

    // 特殊处理 Card 组件
    if (componentName === 'Card' && !props.title && !props.children) {
      const cardProps: Record<string, unknown> = { ...props };
      delete cardProps.title;
      return `<Card${propsToJSX(cardProps)}><div>Card Content</div></Card>`;
    }

    return `<${componentName}${propsStr} />`;
  }
  
  return `<${componentName}${propsStr} />`;
}

// ============================================================
// 数据源代码生成
// ============================================================

function generateDataSourceCode(dataSources: Record<string, DataSource>): string {
  if (Object.keys(dataSources).length === 0) {
    return '';
  }
  
  const imports: Set<string> = new Set([
    "import { useState, useEffect } from 'react';",
    "import { message } from 'antd';"
  ]);
  
  const hooks: string[] = [];
  const serviceMethods: string[] = [];
  
  Object.entries(dataSources).forEach(([key, ds]) => {
    const funcName = `fetch${capitalizeFirst(kebabToPascalCase(key))}`;
    const hookName = `use${capitalizeFirst(kebabToPascalCase(key))}`;
    
    if (ds.type === 'api') {
      serviceMethods.push(`
export const ${funcName} = async (params?: Record<string, unknown>) => {
  try {
    const response = await fetch('${ds.config.url || '/api/' + key}', {
      method: '${ds.config.method || 'GET'}',
      headers: {
        'Content-Type': 'application/json',
        ...(${ds.config.authType ? `{ 'Authorization': 'Bearer ${ds.config.authType}' }` : '{}'}),
      },
      ${ds.config.body ? `body: JSON.stringify(${JSON.stringify(ds.config.body)})` : ''}
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('${funcName} error:', error);
    throw error;
  }
};`);
      
      hooks.push(`
export const ${hookName} = () => {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async (fetchParams?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const result = await ${funcName}(fetchParams);
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};`);
    } else if (ds.type === 'mock') {
      hooks.push(`
export const ${hookName} = () => {
  const [data, setData] = useState<unknown>(${JSON.stringify(ds.config.mockData, null, 2)});
  const loading = false;
  const error = null;

  return { data, loading, error };
};`);
    }
  });
  
  return [...imports].join('\n') + serviceMethods.join('\n') + hooks.join('\n');
}

// ============================================================
// 事件绑定代码生成
// ============================================================

interface EventBinding {
  id: string;
  componentId: string;
  eventType: string;
  enabled?: boolean;
  condition?: string;
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
    delay?: number;
  }>;
}

function generateEventBindingCode(_componentId: string, bindings: EventBinding[]): string {
  if (!bindings || bindings.length === 0) return '';

  const eventImports = new Set<string>([
    "import { message } from 'antd';",
    "import { useNavigate } from 'react-router-dom';",
  ]);

  const handlers: string[] = [];

  bindings.forEach((binding) => {
    if (binding.enabled === false) return;

    const conditionCheck = binding.condition
      ? `if (!(${binding.condition})) return;`
      : '';

    const actionHandlers = binding.actions.map((action) => {
      const delayStr = action.delay && action.delay > 0 ? `await new Promise(r => setTimeout(r, ${action.delay}));` : '';

      switch (action.type) {
        case 'showMessage': {
          const msgType = (action.config.type as string) || 'success';
          const content = (action.config.content as string) || '';
          return `${delayStr}message.${msgType}('${content.replace(/'/g, "\\'")}');`;
        }
        case 'navigate': {
          const path = (action.config.path as string) || '/';
          const newTab = action.config.openInNewTab ? `window.open('${path}', '_blank');` : `navigate('${path}');`;
          return `${delayStr}${newTab}`;
        }
        case 'setValue':
          return `${delayStr}// setValue: ${JSON.stringify(action.config)}`;
        case 'callApi':
          return `${delayStr}// callApi: ${action.config.url || ''} ${action.config.method || 'GET'}`;
        case 'showModal':
          return `${delayStr}// showModal: ${action.config.modalId || ''}`;
        case 'hideModal':
          return `${delayStr}// hideModal: ${action.config.modalId || ''}`;
        case 'download': {
          const url = (action.config.url as string) || '';
          const filename = (action.config.filename as string) || 'download';
          return `${delayStr}// download: ${url} -> ${filename}`;
        }
        case 'triggerEvent':
          return `${delayStr}// triggerEvent: ${action.config.eventName || ''}`;
        case 'script': {
          const script = (action.config.script as string) || '';
          return `${delayStr}// script: ${script}`;
        }
        default:
          return `${delayStr}// action: ${action.type}`;
      }
    });

    const isAsync = binding.actions.some(a => a.delay && a.delay > 0);
    const asyncPrefix = isAsync ? 'async ' : '';

    handlers.push(`  const handle${capitalizeFirst(binding.eventType)} = ${asyncPrefix}() => {
    ${conditionCheck}
    ${actionHandlers.join('\n    ')}
  };`);
  });

  if (handlers.length === 0) return '';

  return [...eventImports].join('\n') + '\n\n' + handlers.join('\n\n');
}

// ============================================================
// 逻辑流代码生成
// ============================================================

interface LogicFlow {
  id: string;
  name: string;
  trigger: string;
  nodes: Array<{
    id: string;
    type: string;
    subtype: string;
    label: string;
    config: Record<string, unknown>;
  }>;
  connections: Array<{
    id: string;
    source: string;
    target: string;
    condition?: string;
  }>;
}

function generateLogicFlowCode(flows: Record<string, LogicFlow>): string {
  const entries = Object.entries(flows);
  if (entries.length === 0) return '';

  const imports = new Set<string>([
    "import { useEffect } from 'react';",
    "import { message } from 'antd';",
  ]);

  const flowImplementations: string[] = [];

  entries.forEach(([flowId, flow]) => {
    const triggerHandlers: string[] = [];
    const flowName = flow.name || flowId;

    (flow.nodes || []).forEach((node) => {
      switch (node.subtype) {
        case 'onClick':
          triggerHandlers.push(`// ${flowName}: ${node.label} (${node.type})`);
          break;
        case 'onChange':
        case 'onSubmit':
        case 'onLoad':
        case 'onMounted':
        case 'onTimer':
          triggerHandlers.push(`// ${flowName}: ${node.label} (${node.subtype})`);
          break;
        case 'showMessage': {
          const content = (node.config.content as string) || '';
          const msgType = (node.config.type as string) || 'success';
          triggerHandlers.push(`  message.${msgType}('${content.replace(/'/g, "\\'")}');`);
          break;
        }
        case 'callApi': {
          const url = (node.config.url as string) || '';
          const method = (node.config.method as string) || 'GET';
          triggerHandlers.push(`  // API ${method} ${url}`);
          break;
        }
        case 'navigate': {
          const path = (node.config.path as string) || '/';
          triggerHandlers.push(`  // navigate to ${path}`);
          break;
        }
        case 'condition': {
          const expr = (node.config.expression as string) || 'true';
          triggerHandlers.push(`  if (${expr}) { /* true branch */ }`);
          break;
        }
        case 'setValue':
        case 'showModal':
        case 'hideModal':
        case 'download':
        case 'upload':
        case 'getVariable':
        case 'setVariable':
        case 'transform':
        case 'filter':
        case 'sort':
        case 'aggregate':
          triggerHandlers.push(`  // ${node.label}: ${node.subtype}`);
          break;
        default:
          triggerHandlers.push(`  // ${node.label}`);
      }
    });

    flowImplementations.push(`/**
 * ${flowName} Logic Flow
 */`);
    if (triggerHandlers.length > 0) {
      flowImplementations.push(`const execute${flowName.replace(/\s+/g, '')}Flow = () => {\n${triggerHandlers.join('\n')}\n};`);
    }
  });

  return [...imports].join('\n') + '\n\n' + flowImplementations.join('\n\n');
}

// ============================================================
// 主文件生成
// ============================================================

function generateMainPageCode(schema: PageSchema, options: CodeGenOptions): string {
  const { pageName, useTypeScript } = options;
  const componentImports: Set<string> = new Set([
    "import React from 'react';",
    "import { ConfigProvider } from 'antd';",
    "import zhCN from 'antd/locale/zh_CN';"
  ]);
  
  // 收集需要的组件导入
  const usedComponents = new Set<string>();
  function collectImports(components: PageComponent[]) {
    components.forEach(comp => {
      const template = COMPONENT_TEMPLATES[comp.type];
      if (template) {
        usedComponents.add(template.importStatement);
        if (comp.children) {
          collectImports(comp.children);
        }
      }
    });
  }
  collectImports(schema.page.components);
  
  // 生成页面内容
  const pageContent = schema.page.components.length > 0
    ? schema.page.components
        .map((comp, index) => generateComponentCode(comp, index, options))
        .join('\n\n')
    : '      <div style={{ textAlign: \'center\', color: \'#999\', padding: 40 }}>\n        页面内容为空\n      </div>';
  
  // typeScriptSuffix reserved for future file extension handling
  void useTypeScript;

  // 生成数据源相关代码
  const dataSourceCode = generateDataSourceCode(schema.dataSources);
  
  // 生成事件绑定代码
  const allBindings: EventBinding[] = [];
  schema.page.components.forEach(comp => {
    if (comp.events && (comp.events as any).bindings) {
      (comp.events as any).bindings.forEach((b: EventBinding) => {
        allBindings.push({ ...b, componentId: comp.id });
      });
    }
  });
  const eventBindingCode = generateEventBindingCode('page', allBindings);

  // 生成逻辑流代码
  const logicFlowCode = generateLogicFlowCode((schema as any).logic || {});

  return `${[...componentImports].join('\n')}
${[...usedComponents].join('\n')}
${dataSourceCode ? dataSourceCode + '\n' : ''}
${eventBindingCode ? eventBindingCode + '\n' : ''}
${logicFlowCode ? logicFlowCode + '\n' : ''}

/**
 * ${schema.page.title} - 页面组件
 * 由低代码平台自动生成
 * 生成时间: ${new Date().toISOString()}
 */
const ${kebabToPascalCase(pageName)}Page = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <div style={{
        minHeight: '100vh',
        padding: ${schema.page.props?.padding || 16},
        background: '${schema.page.props?.background || '#ffffff'}'
      }}>
        <h1 style={{ marginBottom: 24 }}>${schema.page.title}</h1>
        ${schema.page.description ? `\n        <p style={{ color: '#666', marginBottom: 24 }}>${schema.page.description}</p>` : ''}
${pageContent.split('\n').map(line => '        ' + line).join('\n')}
      </div>
    </ConfigProvider>
  );
};

export default ${kebabToPascalCase(pageName)}Page;
`;
}

// ============================================================
// 项目文件生成
// ============================================================

function generatePackageJson(options: CodeGenOptions, dependencies: string[]): string {
  return JSON.stringify({
    name: options.projectName.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'antd': '^5.12.0',
      '@ant-design/icons': '^5.2.6',
      ...Object.fromEntries(dependencies.map(d => [d, '^5.0.0']))
    },
    devDependencies: {
      '@types/react': '^18.2.43',
      '@types/react-dom': '^18.2.17',
      '@vitejs/plugin-react': '^4.2.1',
      'typescript': '^5.3.3',
      'vite': '^5.0.8'
    }
  }, null, 2);
}

function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }]
  }, null, 2);
}

function generateTsNodeConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      composite: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowSyntheticDefaultImports: true
    },
    include: ['vite.config.ts']
  }, null, 2);
}

function generateViteConfig(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});
`;
}

function generateIndexHtml(projectName: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function generateMainTsx(pageComponentName: string): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import ${pageComponentName} from './pages/${pageComponentName}';
import 'antd/dist/reset.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <${pageComponentName} />
  </React.StrictMode>
);
`;
}

function generateGlobalCss(): string {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
    'Noto Color Emoji';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
}

function generateReadme(schema: PageSchema, options: CodeGenOptions): string {
  const pageComponentName = kebabToPascalCase(options.pageName);
  const dataSourceList = Object.keys(schema.dataSources).map(key => `- ${key}`).join('\n');
  
  return `# ${options.projectName}

> 由低代码平台自动生成
> 生成时间: ${new Date().toISOString()}

## 页面信息

- **页面标题**: ${schema.page.title}
${schema.page.description ? `- **页面描述**: ${schema.page.description}` : ''}
- **布局类型**: ${schema.page.layout}

## 组件列表

${schema.page.components.length > 0
  ? schema.page.components.map((comp) => `- ${comp.label || comp.type} (${comp.type})`).join('\n')
  : '- 无'
}

${Object.keys(schema.dataSources).length > 0
  ? `## 数据源

${dataSourceList}
`
  : ''
}## 启动方式

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
\`\`\`

## 项目结构

\`\`\`
src/
├── main.tsx           # 入口文件
├── App.tsx            # 应用组件
├── index.css          # 全局样式
└── pages/
    └── ${pageComponentName}.tsx  # 页面组件
\`\`\`

## 技术栈

- React 18
- TypeScript
- Ant Design 5
- Vite
`;
}

// ============================================================
// 主导出函数
// ============================================================

/**
 * 从 Schema 生成代码
 */
export function generateCode(schema: PageSchema, options: CodeGenOptions): CodeGenResult {
  const files: GeneratedFile[] = [];
  const dependencies: Set<string> = new Set(['antd', '@ant-design/icons']);
  
  // 收集所有使用的组件
  const usedComponentTypes = new Set<string>();
  function collectUsedComponents(components: PageComponent[]) {
    components.forEach(comp => {
      usedComponentTypes.add(comp.type);
      if (comp.children) {
        collectUsedComponents(comp.children);
      }
    });
  }
  collectUsedComponents(schema.page.components);
  
  // 收集依赖
  usedComponentTypes.forEach(type => {
    if (type === 'Table') dependencies.add('dayjs');
    if (type === 'LineChart' || type === 'BarChart' || type === 'PieChart') {
      dependencies.add('echarts');
      dependencies.add('echarts-for-react');
    }
  });
  
  // 收集数据源依赖
  Object.values(schema.dataSources).forEach(ds => {
    if (ds.type === 'api') {
      // API 数据源不需要额外依赖
    }
  });
  
  const pageComponentName = kebabToPascalCase(options.pageName);
  const pageCode = generateMainPageCode(schema, options);
  
  // 生成主页面文件
  files.push({
    path: `src/pages/${pageComponentName}.tsx`,
    content: pageCode,
    language: 'tsx'
  });
  
  // 生成入口文件
  files.push({
    path: 'src/main.tsx',
    content: generateMainTsx(pageComponentName),
    language: 'tsx'
  });
  
  // 生成全局样式
  files.push({
    path: 'src/index.css',
    content: generateGlobalCss(),
    language: 'css'
  });
  
  // 生成配置文件
  files.push({
    path: 'package.json',
    content: generatePackageJson(options, [...dependencies]),
    language: 'json'
  });
  
  files.push({
    path: 'tsconfig.json',
    content: generateTsConfig(),
    language: 'json'
  });
  
  files.push({
    path: 'tsconfig.node.json',
    content: generateTsNodeConfig(),
    language: 'json'
  });
  
  files.push({
    path: 'vite.config.ts',
    content: generateViteConfig(),
    language: 'ts'
  });
  
  files.push({
    path: 'index.html',
    content: generateIndexHtml(options.projectName),
    language: 'html'
  });
  
  // 生成 README
  files.push({
    path: 'README.md',
    content: generateReadme(schema, options),
    language: 'md'
  });

  // 生成图表组件文件
  const hasChart = usedComponentTypes.has('LineChart') ||
    usedComponentTypes.has('BarChart') ||
    usedComponentTypes.has('PieChart');
  if (hasChart) {
    files.push({
      path: 'src/components/chart/LineChart.tsx',
      content: generateLineChartComponent(),
      language: 'tsx',
    });
    files.push({
      path: 'src/components/chart/BarChart.tsx',
      content: generateBarChartComponent(),
      language: 'tsx',
    });
    files.push({
      path: 'src/components/chart/PieChart.tsx',
      content: generatePieChartComponent(),
      language: 'tsx',
    });
    files.push({
      path: 'src/components/chart/index.ts',
      content: "export { LineChart } from './LineChart';\nexport { BarChart } from './BarChart';\nexport { PieChart } from './PieChart';\n",
      language: 'ts',
    });
  }

  return {
    files,
    dependencies: [...dependencies],
    exports: files.map(f => f.path)
  };
}

/**
 * 将生成的文件打包为 ZIP 内容
 */
export function generateZipContent(result: CodeGenResult): Map<string, string> {
  const zipContent = new Map<string, string>();
  
  result.files.forEach(file => {
    zipContent.set(file.path, file.content);
  });
  
  return zipContent;
}

/**
 * 生成单文件预览代码
 */
export function generatePreviewCode(schema: PageSchema, _options: CodeGenOptions): string {
  return `<!--
  ${schema.page.title} - 预览代码
  由低代码平台自动生成
  使用方式: 将此代码保存为 .html 文件在浏览器中打开
-->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${schema.page.title}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/antd/5.12.0/reset.min.css">
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    // 注意: 这是一个简化预览，实际导出代码请参考完整项目结构
    // 由于 CDN 限制，完整 Ant Design 组件需要自行配置
    console.log('预览代码 - 请使用完整项目导出以获得完整功能');
  </script>
</body>
</html>`;
}

// ============================================================
// Schema 验证和优化
// ============================================================

/**
 * 优化 Schema 以提高代码生成质量
 */
export function optimizeSchema(schema: PageSchema): PageSchema {
  return {
    ...schema,
    page: {
      ...schema.page,
      components: schema.page.components.map(optimizeComponent)
    }
  };
}

function optimizeComponent(component: PageComponent): PageComponent {
  // 移除空的 children 数组
  const optimizedChildren = component.children?.length
    ? component.children.map(optimizeComponent)
    : undefined;

  return {
    ...component,
    children: optimizedChildren,
    // 清理未定义的属性
    props: Object.fromEntries(
      Object.entries(component.props || {}).filter(([_, v]) => v !== undefined)
    )
  };
}

// ============================================================
// 图表组件代码生成
// ============================================================

function generateLineChartComponent(): string {
  return `import React, { useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

interface LineChartProps {
  title?: string;
  xAxisData?: string[];
  seriesData?: number[];
  seriesName?: string;
  color?: string;
  smooth?: boolean;
  showArea?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  seriesData = [820, 932, 901, 934, 1290, 1330, 1320],
  seriesName = '数据',
  color = '#1677ff',
  smooth = false,
  showArea = false,
  style,
  className,
}) => {
  const getOption = useCallback(() => ({
    title: { text: title || '', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis' },
    grid: { left: '10%', right: '10%', bottom: '15%', top: title ? '20%' : '10%' },
    xAxis: { type: 'category', data: xAxisData, boundaryGap: false, axisLabel: { fontSize: 11, color: '#666' } },
    yAxis: { type: 'value', axisLabel: { fontSize: 11, color: '#666' } },
    series: [{
      name: seriesName, type: 'line', data: seriesData, smooth,
      symbol: 'circle', symbolSize: 6,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      areaStyle: showArea ? { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '40' }, { offset: 1, color: color + '05' }] } } : undefined,
    }],
  }), [title, xAxisData, seriesData, seriesName, color, smooth, showArea]);

  return <ReactECharts option={getOption()} style={{ width: '100%', height: '100%', minHeight: 280, ...style }} className={className} opts={{ renderer: 'canvas' }} />;
};
`;
}

function generateBarChartComponent(): string {
  return `import React, { useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

interface BarChartProps {
  title?: string;
  xAxisData?: string[];
  seriesData?: number[];
  seriesName?: string;
  color?: string;
  horizontal?: boolean;
  showLabel?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  xAxisData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  seriesData = [120, 200, 150, 80, 70, 110, 130],
  seriesName = '数据',
  color = '#1677ff',
  horizontal = false,
  showLabel = true,
  style,
  className,
}) => {
  const getOption = useCallback(() => ({
    title: { text: title || '', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis' },
    grid: { left: horizontal ? '15%' : '10%', right: '10%', bottom: '15%', top: title ? '20%' : '10%' },
    xAxis: horizontal ? { type: 'value', axisLabel: { fontSize: 11, color: '#666' } } : { type: 'category', data: xAxisData, axisLabel: { fontSize: 11, color: '#666' } },
    yAxis: horizontal ? { type: 'category', data: xAxisData, axisLabel: { fontSize: 11, color: '#666' } } : { type: 'value', axisLabel: { fontSize: 11, color: '#666' } },
    series: [{
      name: seriesName, type: 'bar', data: seriesData,
      itemStyle: { color, borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
      label: showLabel ? { show: true, position: horizontal ? 'right' : 'top', fontSize: 11 } : undefined,
      barMaxWidth: 40,
    }],
  }), [title, xAxisData, seriesData, seriesName, color, horizontal, showLabel]);

  return <ReactECharts option={getOption()} style={{ width: '100%', height: '100%', minHeight: 280, ...style }} className={className} opts={{ renderer: 'canvas' }} />;
};
`;
}

function generatePieChartComponent(): string {
  return `import React, { useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

interface PieDataItem { name: string; value: number; }

interface PieChartProps {
  title?: string;
  data?: PieDataItem[];
  colors?: string[];
  showLegend?: boolean;
  roseType?: boolean;
  radius?: string;
  style?: React.CSSProperties;
  className?: string;
}

const DEFAULT_COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data = [{ name: '类目一', value: 1048 }, { name: '类目二', value: 735 }, { name: '类目三', value: 580 }, { name: '类目四', value: 484 }, { name: '类目五', value: 300 }],
  colors = DEFAULT_COLORS,
  showLegend = true,
  roseType = false,
  radius = '65%',
  style,
  className,
}) => {
  const getOption = useCallback(() => ({
    title: { text: title || '', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { show: showLegend, bottom: 0, type: 'scroll', textStyle: { fontSize: 11, color: '#666' } },
    series: [{
      name: '数据', type: 'pie',
      radius: roseType ? ['20%', '75%'] : radius,
      center: ['50%', '45%'],
      roseType: roseType ? 'radius' : undefined,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, fontSize: 11, color: '#666', formatter: '{b}: {d}%' },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' }, itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      data: data.map((item, index) => ({ ...item, itemStyle: { color: colors[index % colors.length] } })),
    }],
  }), [title, data, colors, showLegend, roseType, radius]);

  return <ReactECharts option={getOption()} style={{ width: '100%', height: '100%', minHeight: 280, ...style }} className={className} opts={{ renderer: 'canvas' }} />;
};
`;
}
