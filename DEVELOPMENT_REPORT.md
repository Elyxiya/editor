# Low-Code Platform — Development Report

> **Last Updated:** 2026-05-02 (第二次更新)
> **Status:** 核心功能已完成，持续迭代中

---

## 1. 项目概览

**项目名称:** Low-Code Visual Page Builder（可视化低代码页面构建平台）
**仓库路径:** `E:/桌面/web-xm/low-code`
**架构:** Monorepo (pnpm workspaces)

一个功能完整的可视化拖拽低代码平台，支持通过 GUI 编辑器构建页面、配置数据源和逻辑流程，并导出可独立运行的 React+TypeScript+Vite 项目代码。

---

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 编辑器前端 | React 18, TypeScript, @dnd-kit, Ant Design 5, Zustand + Immer |
| 渲染器前端 | React 18, TypeScript, Ant Design 5, react-router-dom |
| 代码生成 | React 18, TypeScript, Ant Design 5, Vite, ECharts |
| 后端 | Express.js, Prisma ORM, SQLite, JWT, bcryptjs |
| 包管理 | pnpm workspaces |
| 构建工具 | Vite 5, TypeScript 5 |

---

## 3. 项目结构

```
E:/桌面/web-xm/low-code/
├── apps/
│   ├── editor/          # 可视化拖拽页面编辑器 (React SPA, port 3000)
│   └── renderer/        # 页面预览/渲染应用 (React SPA, port 3001)
├── packages/
│   ├── types/           # 共享 TypeScript 接口
│   ├── schema/          # Schema 验证 & 树操作
│   ├── utils/            # 工具函数
│   ├── components/       # 20 个 UI 组件 + 元数据注册表
│   ├── codegen/          # Schema → React 项目代码生成器
│   ├── logic-engine/     # 可视化逻辑流程执行器
│   ├── datasource/       # 数据源管理（缓存、重试、拦截器）
│   └── events/           # 事件绑定系统
├── services/
│   └── server/          # Express.js REST API + Prisma ORM + SQLite
├── tests/               # Playwright E2E 测试
└── docs/               # 文档
```

---

## 4. 构建状态

| 应用/包 | 构建 | TypeScript | Vite |
|---------|------|-----------|------|
| `@lowcode/editor` | ✅ 通过 | ✅ 通过 | ✅ 通过 |
| `@lowcode/renderer` | ✅ 通过 | ✅ 通过 | ✅ 通过 |
| `@lowcode/server` | ✅ 通过 | ✅ 通过 | N/A |
| 所有 packages | ✅ 通过 | ✅ 通过 | N/A |
| ESLint | ✅ 通过 | — | — |

**最后构建时间:** 2026-05-02

---

## 5. 核心包实现状态

### 5.1 `@lowcode/types` — 100% 完成

所有共享 TypeScript 接口已定义：`ComponentMeta`、`PageSchema`、`PageComponent`、`DataSource`、`LogicFlow`、`EditorState`、属性 schema、拖拽类型、动作类型。

### 5.2 `@lowcode/schema` — 100% 完成

- `SchemaValidator`（基于 AJV + JSON Schema）
- 完整树操作：`findComponentById`、`findComponentPath`、`insertComponent`、`removeComponentById`、`updateComponentProps`、`moveComponent`、`cloneComponent`、`flattenComponents`、`updateComponentInTree`、`swapInSiblings`、`moveToStartOfSiblings`、`moveToEndOfSiblings`
- `createEmptyPageSchema`、`validateSchemaVersion`
- 加密安全的 ID 生成（含兜底方案）

### 5.3 `@lowcode/utils` — 100% 完成

ID 生成、深度克隆、防抖节流、表达式解析（`${variable}` 语法）、样式工具、快捷键注册、LocalStorage 封装、设备检测、日期格式化。

### 5.4 `@lowcode/components` — 100% 完成（20 个组件）

| 分类 | 组件 |
|------|------|
| 布局 (2) | `Container`, `Space` |
| 基础 (6) | `Button`, `Input`, `Text`, `Image`, `Form`, `FormItem`, `Select` |
| 业务 (6) | `Card`, `Table`, `Modal`, `Tabs`, `Divider` |
| 高级 (6) | `Badge`, `Tag`, `Avatar`, `Progress`, `Statistic`, `Skeleton` |
| 图表 (3) | `LineChart`, `BarChart`, `PieChart` |

每个组件包含：React 组件（封装 Ant Design）+ 元数据定义（`.meta.ts`，含 propSchema/eventSchema/styleSchema）+ 组件注册表（`getComponent()`/`getComponentMeta()`/`getAllComponentMetas()`/`getComponentsByCategory()`/`registerComponent()`）

### 5.5 `@lowcode/codegen` — 100% 完成（1246 行）

- `generateCode()` — 主导出，生成 `CodeGenResult`（文件列表 + 依赖）
- `generateMainPageCode()` — 页面 `.tsx`（含导入、数据源、事件绑定、逻辑流）
- `generateComponentCode()` — 20+ 组件类型映射到 Ant Design JSX
- `generateDataSourceCode()` — 为每个数据源生成 service 函数 + React hooks
- `generateEventBindingCode()` — 生成事件处理函数
- `generateLogicFlowCode()` — 生成逻辑流实现
- `generatePreviewCode()` — 独立 HTML 预览
- `optimizeSchema()` — 清理 schema
- 输出文件：`package.json`、`tsconfig.json`、`vite.config.ts`、`index.html`、`main.tsx`、`index.css`、`README.md`、图表组件

### 5.6 `@lowcode/logic-engine` — 100% 完成（executor 910 行 + nodes 559 行）

- `LogicExecutor` 类（事件驱动设计：`on/off/emit`）
- 安全表达式求值器（白名单模式）
- 节点注册表（`NodeRegistry` 类）
- 流程构建器（`createFlowBuilder`）
- 4 类 22 个节点定义：

| 分类 | 节点 |
|------|------|
| 触发器 (6) | `onClick`, `onChange`, `onSubmit`, `onLoad`, `onMounted`, `onTimer` |
| 动作 (8) | `setValue`, `callApi`, `showMessage`, `showModal`, `hideModal`, `navigate`, `download`, `upload` |
| 逻辑 (6) | `condition`, `switch`, `loop`, `delay`, `parallel`, `sequence` |
| 数据 (6) | `getVariable`, `setVariable`, `transform`, `filter`, `sort`, `aggregate` |

### 5.7 `@lowcode/datasource` — 100% 完成（554 行）

`DataSourceManager` 单例，支持 API/Mock/Variable 类型，含自动加载延迟、请求缓存（TTL）、请求/响应拦截器、重试逻辑、数据映射/转换、AbortController 取消、状态订阅。

### 5.8 `@lowcode/events` — 100% 完成（604 行）

- `EventBindingManager` 类
- `ActionExecutor` 含 12 种动作类型（script 动作因安全原因被禁用）
- `ActionFactory` 动作工厂
- Button、Input、Select、Form、Table、Modal、Container 的预设事件
- React Hook 工厂 `createUseEventBinding()`

---

## 6. 编辑器应用实现状态（`apps/editor`）

### 6.1 页面

| 页面 | 行数 | 状态 | 说明 |
|------|------|------|------|
| `EditorPage.tsx` | 190 | ✅ 完成 | DndContext + 智能碰撞检测 + 三栏布局 + 设备切换 + 拖拽预览 |
| `LoginPage.tsx` | — | ✅ 完成 | JWT 登录/注册表单 |
| `ProjectListPage.tsx` | — | ✅ 完成 | 项目 CRUD + 页面列表 |
| `SettingsPage.tsx` | — | ✅ 完成 | 用户设置 |

### 6.2 组件

| 组件 | 行数 | 状态 | 说明 |
|------|------|------|------|
| `EditorToolbar.tsx` | 320 | ✅ 完成 | 保存/撤销/重做、设备缩放、对齐工具、所有面板触发器 |
| `ComponentLibrary.tsx` | 207 | ✅ 完成 | 可搜索/过滤/模糊匹配的组件列表 + 拖拽 |
| `Canvas.tsx` | 75 | ✅ 完成 | 可放置画布 + 缩放变换 |
| `PropertyPanel.tsx` | 560 | ✅ 完成 | 4 个 Tab：属性/样式/数据/事件，动态表单渲染 |
| `SortableComponent.tsx` | 249 | ✅ 完成 | 排序包装器 + 选择 + 图层控制 + 放置区 |
| `DynamicComponent.tsx` | 43 | ✅ 完成 | 通过注册表渲染组件 |
| `EventBindingPanel.tsx` | 608 | ✅ 完成 | 8 种动作类型 + 弹窗表单 + 动作列表编辑 |
| `DataSourceManagementPanel.tsx` | 477 | ✅ 完成 | API/Mock/Variable 数据源 CRUD |
| `LogicFlowEditor.tsx` | 603 | ✅ 完成 | 节点面板 + 画布 + 属性面板 + 自动布局 |
| `CodeExportPanel.tsx` | 365 | ✅ 完成 | 文件浏览器 + 代码预览 + ZIP 下载 |
| `PreviewPanel.tsx` | 157 | ✅ 完成 | iframe 预览 + 设备切换 + postMessage 传递 schema |
| `PageManagementPanel.tsx` | 300 | ✅ 完成 | 页面 CRUD、重命名、复制、删除 |
| `TemplateManagementPanel.tsx` | 409 | ✅ 完成 | 模板浏览、创建、加载（含完整 API 集成） |
| `VersionHistoryPanel.tsx` | 356 | ✅ 完成 | 版本列表、回滚支持（含完整 API 集成） |
| `EditorStatusBar.tsx` | — | ✅ 完成 | 缩放、设备、组件计数 |
| `EditorLayout.tsx` | — | ✅ 完成 | 应用壳布局 |

### 6.3 状态管理（`editorStore.ts`, 588 行）

Zustand + Immer 完整实现：
- Schema、选择、悬停、拖拽、预览模式
- 50 步撤销/重做历史
- 所有组件操作：增删改移、复制粘贴剪切
- 对齐（6 向）+ 分布（水平/垂直）
- 图层管理：置顶/置底/上移/下移
- API 持久化：`savePage()`、`loadPage()`

### 6.4 服务层

| 服务 | 行数 | 状态 | 说明 |
|------|------|------|------|
| `api.ts` | 124 | ✅ 完成 | 封装 fetch，含认证/超时/401 处理 |
| `auth.ts` | — | ✅ 完成 | 登录/注册/登出 |
| `page.ts` | 146 | ✅ 完成 | 页面 CRUD + 版本 + 回滚 + 发布/取消发布 + 导出 |
| `project.ts` | — | ✅ 完成 | 项目 CRUD |
| `templateService.ts` | 93 | ✅ 完成 | 模板管理（浏览/创建/删除/分类），完整接入后端 API |
| `export.ts` | — | ✅ 完成 | 代码导出 |

### 6.5 Hooks

| Hook | 状态 | 说明 |
|------|------|------|
| `useKeyboardShortcuts.ts` | ✅ 完成 | Ctrl+Z/Y 撤销重做、Ctrl+S 保存、Ctrl+C/X/V 复制/剪切/粘贴、Ctrl+D 复制、Delete 删除、Escape 取消选择、`[/]` 图层调整 |
| `useCanvasZoom.ts` | ✅ 完成 | Ctrl+滚轮缩放（0.1x–3x） |

---

## 7. 渲染器应用实现状态（`apps/renderer`）

### `App.tsx`（175 行）— ✅ 完成

- 路由：`/`（演示）、`/preview`（完整页面加载器）
- Schema 加载优先级：`postMessage` from editor > URL 参数 > `pageId` > 演示兜底
- `PageLoader` 组件含加载/错误状态

### `PageRenderer.tsx`（755 行）— ✅ 完成

- `RenderContext` — 提供 `dataSources`、`variables`、`setVariable`、`executeAction`、`eventEmitter`
- `useDataSource` — 带缓存的独立数据源加载
- `usePageData` — 通过 `Promise.allSettled` 并行加载所有数据源
- `resolvePropValue` — 处理 `{{variable}}`、`{{dataSource.field}}`、三元表达式
- `createActionExecutor` — 执行运行时动作（showMessage、navigate、setValue、callApi、download）
- 特殊容器渲染：`Container`、`Space`、`Card`、`Tag`、`Badge`、`Avatar`、`Progress`、`Statistic`、`Skeleton`、图表
- 通过 `EventEmitter` 动态事件发射

---

## 8. 后端服务实现状态（`services/server`）

### 8.1 数据库（Prisma + SQLite）

**Models:** `User`、`Tenant`、`Page`、`PageVersion`、`Project`、`DataSource`、`Template`
**数据库文件:** `file:./dev.db`

### 8.2 路由

| 路由 | 行数 | 状态 | 说明 |
|------|------|------|------|
| `auth.ts` | — | ✅ 完成 | 注册、登录（`POST /`）、用户信息（`GET /me`） |
| `pages.ts` | 449 | ✅ 完成 | 完整 CRUD + 版本 + 回滚 + 发布/取消发布 + 导出（占位） |
| `projects.ts` | 161 | ✅ 完成 | 完整 CRUD，含所有权检查 |
| `templates.ts` | 268 | ✅ 完成 | 公开读取、需认证写入、分类统计 |

### 8.3 中间件

| 文件 | 行数 | 状态 | 说明 |
|------|------|------|------|
| `auth.ts` | 68 | ✅ 完成 | `requireAuth`、`optionalAuth`、`getAuthenticatedUserId` |

---

## 9. 本次迭代修复的问题

### 9.1 严重 Bug：预览 iframe 无法接收 schema

**问题：** `PreviewPanel` 通过 `window.postMessage` 发送 schema，但渲染器 `App.tsx` 从未监听该消息，导致 iframe 始终加载演示 schema。

**修复：** 在 `App.tsx` 中添加 `message` 事件监听器：

```tsx
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'preview-schema' && event.data.schema) {
      setSchema(event.data.schema as PageSchema);
      setLoading(false);
      setError(null);
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

### 9.2 严重 Bug：Action Executor 中的循环引用

**问题：** `createActionExecutor` 的参数类型 `RenderContextValue` 包含 `executeAction`，而函数内部又返回 `executeAction`，导致 `context.executeAction` 始终是空 no-op 函数，返回值从未被使用。

**修复：** 提取 `ActionContextValue` 接口（不含 `executeAction`），分别用于 `resolvePropValue`/`resolveProps` 和 `createActionExecutor`。

### 9.3 重构：`App.tsx` 加载逻辑

- 将 `postMessage` 监听和 URL 参数加载分离为独立的 `useEffect`
- 使用 `useCallback` 包装 `loadFromUrl` 避免每次渲染重建
- 新增预览模式显式处理（等待 postMessage 时不自动加载演示）

### 9.4 配置修复：根 `tsconfig.json`

- 补充缺失的 `"jsx": "react-jsx"` 配置
- 在 `exclude` 中添加 `apps/` 和 `services/`，避免根配置误检子项目的文件

### 9.5 修复：`tests/fixtures.ts`

Playwright fixture 的 `timeout` 属性类型错误，改为 `test.setTimeout()` 方式。

---

## 10. 剩余开发工作

### 高优先级

| # | 任务 | 状态 | 说明 |
|---|------|------|------|
| 1 | **发布功能** | ⚠️ 部分完成 | `page.ts` 有 `publishPage()` 和 `unpublishPage()` 函数，但 `EditorToolbar.handlePublish` 只是 `Modal.confirm` + `message.success`，未真正调用 API |
| 2 | **多页面切换** | ⚠️ 部分完成 | `PageManagementPanel` 的 `onSwitchPage` 目前只打印日志，需要实现：未保存确认 + schema 切换 |
| 3 | **逻辑流编辑器** | ❌ 待优化 | 目前是卡片布局，建议升级为 React Flow 或自定义画布，支持节点拖拽和 SVG 连线 |
| 4 | **Schema 大小/跨域** | ❌ 待优化 | 大页面 schema 通过 postMessage 传递可能超限，建议 base64 压缩编码 |

### 中优先级

| # | 任务 | 状态 | 说明 |
|---|------|------|------|
| 5 | **服务端导出** | ❌ 待实现 | `GET /api/pages/:id/export` 是占位符，应生成 ZIP 并提供下载 |
| 6 | **编辑深色主题** | ❌ 未开始 | 编辑器 UI 主题切换 |
| 7 | **实时协作** | ❌ 未开始 | 多用户同时编辑，WebSocket 冲突解决 |
| 8 | **自定义组件** | ❌ 未开始 | 用户自定义组件注册（含代码编辑器） |

### 低优先级 / 规划中

| # | 任务 | 状态 |
|---|------|------|
| 9 | i18n（中英文切换） | ❌ 未开始 |
| 10 | 撤销/重做持久化（localStorage） | ❌ 未开始 |
| 11 | 组件锁定（防误编辑） | ❌ 未开始 |
| 12 | 页面权限（用户分享） | ❌ 未开始 |
| 13 | 页面分析（访问/交互统计） | ❌ 未开始 |
| 14 | A/B 测试（多页面变体） | ❌ 未开始 |

---

## 11. 架构图

### 数据流

```
用户拖拽组件
       ↓
ComponentLibrary (useDraggable)
       ↓
DndContext.onDragEnd
       ↓
EditorPage.handleDragEnd
       ↓
editorStore.addComponent() / moveComponent()
       ↓
saveSnapshot() → history (past[])
       ↓
React 重新渲染 Canvas → SortableComponent → DynamicComponent
       ↓
getComponent(type) from @lowcode/components registry
       ↓
Ant Design 组件渲染（含 schema props）
```

### 事件流

```
用户交互（如点击按钮）
       ↓
RenderComponent.handleEvent() → EventEmitter.emit()
       ↓
EventBindingManager 触发绑定动作
       ↓
ActionExecutor 顺序执行每个动作
       ↓
（如 showMessage → navigate → callApi → setValue）
```

### 代码导出流

```
用户点击"导出"
       ↓
CodeExportPanel 调用 generateCode(schema, options)
       ↓
codegen 遍历 schema 树生成：
  src/pages/{Name}.tsx、src/main.tsx、src/index.css
  package.json、tsconfig.json、vite.config.ts、index.html
  src/components/chart/*.tsx（如使用图表）
  README.md
       ↓
JSZip 打包所有文件
       ↓
saveAs(download) → 用户获得可运行的项目 ZIP
```

---

## 12. 关键文件索引

| 文件 | 用途 |
|------|------|
| `packages/schema/src/index.ts` | Schema 工具 & 树操作 |
| `packages/components/src/index.ts` | 组件注册表 |
| `packages/components/src/registry.ts` | 注册表类 |
| `packages/logic-engine/src/executor.ts` | 逻辑执行引擎 |
| `packages/logic-engine/src/nodes.ts` | 22 个节点定义 |
| `packages/logic-engine/src/registry.ts` | 节点注册表 |
| `packages/logic-engine/src/builder.ts` | 流程构建器 |
| `packages/codegen/src/index.ts` | 代码生成器 |
| `packages/datasource/src/manager.ts` | 数据源管理器 |
| `packages/events/src/binding.ts` | 事件绑定管理器 |
| `packages/events/src/actions.ts` | 动作执行器 |
| `apps/editor/src/store/editorStore.ts` | 编辑器状态 |
| `apps/editor/src/pages/EditorPage.tsx` | 编辑器入口 |
| `apps/editor/src/components/PropertyPanel.tsx` | 属性编辑器 |
| `apps/editor/src/components/EventBindingPanel.tsx` | 事件编辑器 |
| `apps/editor/src/components/PreviewPanel.tsx` | 预览面板 |
| `apps/editor/src/components/TemplateManagementPanel.tsx` | 模板管理 |
| `apps/editor/src/components/VersionHistoryPanel.tsx` | 版本历史 |
| `apps/editor/src/services/page.ts` | 页面服务（含版本/发布 API） |
| `apps/editor/src/services/templateService.ts` | 模板服务（完整 API 集成） |
| `apps/renderer/src/App.tsx` | 渲染器路由 + postMessage 监听 |
| `apps/renderer/src/components/PageRenderer.tsx` | Schema 渲染器 |
| `services/server/src/routes/pages.ts` | 页面 CRUD + 版本 |
| `services/server/src/routes/templates.ts` | 模板管理 |
| `services/server/prisma/schema.prisma` | 数据库 schema |
| `services/server/src/middleware/auth.ts` | JWT 中间件 |
