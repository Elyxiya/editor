# 企业级低代码平台 – 快速搭建后台+大屏

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5-1677ff)](https://ant.design/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748)](https://www.prisma.io/)
[![Vite](https://img.shields.io/badge/Vite-build-646cff)](https://vitejs.dev/)
[![Monorepo](https://img.shields.io/badge/Monorepo-pnpm-f69220)](https://pnpm.io/workspaces)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Progress](https://img.shields.io/badge/Milestone-1/4-yellow)](#)

<!-- Feature Badges -->
[![Database Integration](https://img.shields.io/badge/Database-MySQL%20%7C%20PostgreSQL-blueviolet)]()
[![One-Click Deploy](https://img.shields.io/badge/Deploy-OSS%20%7C%20S3-orange)]()
[![Permission Control](https://img.shields.io/badge/Permission-RBAC-brightgreen)]()
[![Enhanced Table](https://img.shields.io/badge/Table-Sort%20%7C%20Filter%20%7C%20Export-red)]()
[![Enhanced Form](https://img.shields.io/badge/Form-Conditional%20%7C%20Upload%20%7C%20RichText-9cf)]()

<!-- Status Badges -->
[![Components](https://img.shields.io/badge/Components-23%2B-61dafb)]()
[![DataSources](https://img.shields.io/badge/DataSources-API%20%7C%20Mock%20%7C%20Database-blue)]()
[![Logic Nodes](https://img.shields.io/badge/Logic%20Nodes-20%2B-success)]()
[![Debug Panel](https://img.shields.io/badge/Debug-Variables%20%7C%20API%20%7C%20Flow-informational)]()

> **在线演示**: [https://demo.example.com](https://demo.example.com) *(演示环境，随时重置)*

一站式企业级低代码平台，支持可视化拖拽搭建、外部数据库集成、权限控制和一键部署。面向企业内部后台管理系统和数据大屏场景，非技术人员也能在 10 分钟内生成一个带真实数据的可访问页面。

## 功能特性

### 核心能力
- **可视化编辑器** — 拖拽组件即可搭建页面，支持撤销/重做、多端预览（PC/平板/手机）
- **外部数据库集成** — 连接 MySQL/PostgreSQL，自动建表并生成表格组件
- **增强型表格** — 排序、筛选、分页、CSV 导出、行内编辑
- **增强型表单** — 条件字段显示、文件上传、富文本编辑器
- **权限系统** — 页面级角色控制 + 组件级表达式权限（如 `$user.role === 'admin'`）
- **一键部署** — 将页面部署为静态网站，生成公开可访问的 URL
- **代码导出** — 导出标准 React + TypeScript 项目

### 平台功能
- **丰富组件库** — 布局、基础、业务、图表组件
- **数据源管理** — API、Mock、变量、数据库多种数据源
- **逻辑编排** — 可视化逻辑流程编辑器
- **事件系统** — 组件事件绑定和动作执行
- **预览调试面板** — 浏览器中实时查看变量、API 日志、逻辑流执行
- **版本管理** — 页面版本历史与回滚

## 技术栈

### 前端
| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | UI 框架 |
| Vite | 构建工具 |
| Ant Design 5 | 组件库 UI |
| @dnd-kit | 拖拽交互 |
| Zustand + Immer | 状态管理 |
| @xyflow/react | 逻辑流编辑器 |

### 后端
| 技术 | 用途 |
|------|------|
| Node.js + Express | API 服务 |
| Prisma + SQLite | ORM 与存储 |
| JWT | 认证鉴权 |
| mysql2 / pg | 外部数据库驱动 |
| multer | 文件上传 |
| AES-256-GCM | 敏感数据加密 |

### 核心包
| 包 | 说明 |
|------|------|
| `@lowcode/types` | 共享类型定义 |
| `@lowcode/schema` | Schema 验证和操作工具 |
| `@lowcode/components` | 组件库（23+ 组件） |
| `@lowcode/codegen` | 代码生成引擎 |
| `@lowcode/logic-engine` | 逻辑编排引擎 |
| `@lowcode/datasource` | 数据源管理 |
| `@lowcode/events` | 事件系统 |
| `@lowcode/utils` | 通用工具函数 |

## 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 9

### 安装 & 启动

```bash
# 安装依赖
pnpm install

# 初始化数据库
cd services/server
npx prisma generate
npx prisma db push
cd ../..

# 启动开发服务（编辑器 + 后端）
pnpm dev

# 单独启动编辑器前端
pnpm dev:editor

# 单独启动后端
pnpm --filter @lowcode/server dev
```

打开浏览器访问 `http://localhost:5173` 即可进入编辑器。

### 快速上手截图指引

1. **首次进入编辑器** → 自动弹出启动向导，选择模板或空白页面
2. **拖拽组件** → 从左侧组件库拖拽到画布
3. **配置属性** → 选中组件，右侧属性面板编辑属性
4. **数据源连接** → 点击工具栏「数据库接入」连接 MySQL/PostgreSQL
5. **添加逻辑** → 点击「逻辑流程」编排交互逻辑
6. **预览调试** → 点击「预览」查看效果，添加 `?debug=true` 查看调试面板
7. **一键部署** → 点击「部署」生成公开访问 URL

## 项目结构

```
low-code/
├── apps/
│   ├── editor/          # 可视化编辑器
│   └── renderer/        # 页面渲染器（预览）
├── packages/
│   ├── types/           # 类型定义
│   ├── schema/          # Schema 验证与操作
│   ├── utils/           # 工具函数
│   ├── components/      # 组件库
│   ├── codegen/         # 代码生成
│   ├── logic-engine/    # 逻辑编排
│   ├── datasource/      # 数据源管理
│   └── events/          # 事件系统
├── services/
│   └── server/          # 后端服务
├── docs/                # 文档
└── e2e/                 # Playwright E2E 测试
```

## 开发指南

### 添加新组件

1. 在 `packages/components/src` 下创建组件文件
2. 定义组件元数据 (meta)
3. 在 `packages/components/src/index.ts` 中注册组件

### Schema 数据结构

页面配置使用 JSON Schema 格式，定义在 `packages/types/src/index.ts`。
