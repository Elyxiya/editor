# 页面低代码平台

一个企业级低代码平台，支持可视化拖拽搭建、页面预览和代码导出。

## 功能特性

- **可视化编辑器** - 拖拽组件即可搭建页面
- **实时预览** - 支持 PC/平板/手机多端预览
- **组件库** - 丰富的预设组件（布局、基础、业务组件）
- **属性面板** - 动态配置组件属性
- **撤销/重做** - 支持历史操作记录
- **页面持久化** - 保存和加载页面配置
- **代码导出** - 导出标准 React 代码（开发中）

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- Ant Design 5
- @dnd-kit (拖拽)
- Zustand (状态管理)

### 后端
- Node.js + Express
- JWT 认证
- Prisma ORM

### 架构
- Monorepo (pnpm workspace)
- 包共享机制

## 项目结构

```
low-code/
├── apps/
│   ├── editor/        # 可视化编辑器应用
│   └── renderer/      # 页面渲染器应用
├── packages/
│   ├── types/        # 共享类型定义
│   ├── schema/       # Schema 工具函数
│   ├── utils/        # 通用工具函数
│   └── components/   # 组件库
└── services/
    └── server/       # 后端服务
```

## 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 9

### 安装依赖

```bash
pnpm install
```

### 启动开发服务

```bash
# 启动前端编辑器
pnpm --filter @lowcode/editor dev

# 启动后端服务
pnpm --filter @lowcode/server dev
```

### 构建生产版本

```bash
pnpm build
```

## 开发指南

### 添加新组件

1. 在 `packages/components/src` 下创建组件文件
2. 定义组件元数据 (meta)
3. 在 `registry.ts` 中注册组件

### Schema 数据结构

页面配置使用 JSON Schema 格式，定义在 `packages/types/src/index.ts`

## License

MIT
