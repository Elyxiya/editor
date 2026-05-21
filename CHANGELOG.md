# Changelog

所有重要的版本变更都会记录在此文件中。本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范。

格式基于 [Markdown 的 Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范。

## [Unreleased]

## [0.1.0] - 2026-05-16

### 新增

#### 核心功能
- **可视化编辑器**：拖拽式页面搭建，支持 PC / 平板 / 手机多端预览
- **组件库**：23 个预设组件，覆盖基础、业务、布局、高级、图表五大类
- **属性面板**：动态配置组件属性，支持多种数据类型（string, number, boolean, select, color, dataSource, expression 等）
- **撤销/重做**：基于快照的历史记录管理，支持最多 50 步历史
- **本地持久化**：编辑历史自动保存到 localStorage，防止刷新丢失数据
- **页面持久化**：保存和加载页面配置到后端数据库
- **版本管理**：页面版本历史记录，支持版本回滚

#### 代码生成
- **代码导出**：将页面 Schema 导出为完整的 React + TypeScript + Vite 项目
- **多格式支持**：支持导出为 ZIP 包或单文件 HTML 预览
- **依赖分析**：自动分析组件依赖，生成正确的 import 语句
- **数据源代码**：为 API 数据源生成对应的 React Hooks
- **图表组件**：自动生成 ECharts 图表组件代码

#### 数据源管理
- **多类型数据源**：支持 API、Mock 数据、变量三种数据源类型
- **数据缓存**：内存缓存和 localStorage 持久化缓存
- **请求拦截器**：支持请求前后拦截处理
- **重试机制**：支持配置请求失败重试次数和间隔
- **自动加载**：支持配置数据源自动加载和加载延迟

#### 逻辑编排
- **可视化逻辑流**：基于 @xyflow/react 的逻辑流程编辑器
- **多种节点类型**：触发器、动作、逻辑、数据共 20+ 种节点
- **条件分支**：支持表达式条件判断分支
- **循环执行**：支持 forEach 循环节点
- **安全表达式**：白名单字符过滤，防止表达式注入

#### 事件系统
- **组件事件绑定**：为组件绑定事件处理器
- **动作类型**：showMessage, navigate, setValue, callApi, showModal, hideModal, download, triggerEvent, script
- **条件执行**：支持条件判断控制动作是否执行
- **延迟动作**：支持配置动作延迟执行

#### 模板系统
- **模板分类**：支持 general, form, list, dashboard, detail, login, landing 等分类
- **公开/私有**：支持创建私有模板或公开分享
- **模板搜索**：支持按名称、标题、描述搜索模板
- **一键使用**：从模板快速创建新页面

#### 后端服务
- **用户认证**：JWT 认证，支持注册、登录
- **多租户支持**：基于 Tenant 模型的多租户架构
- **项目分组**：支持按项目管理页面
- **页面发布**：支持发布/取消发布页面

### 技术特性

#### 架构
- **Monorepo**：使用 pnpm workspace 管理多应用和共享包
- **共享类型**：统一的 TypeScript 类型定义包 @lowcode/types
- **Schema 验证**：基于 Ajv 的 JSON Schema 验证

#### 前端
- **React 18** + **TypeScript 5.3**
- **Vite 5.1** 极速开发体验
- **Ant Design 5.15** 企业级 UI 组件库
- **@dnd-kit** 拖拽功能
- **Zustand + Immer** 状态管理
- **@xyflow/react** 逻辑流编辑器

#### 后端
- **Express 4.18**
- **Prisma ORM 5.9** + SQLite
- **JWT** 认证
- **bcryptjs** 密码加密

### 组件列表

| 分类 | 组件 |
|------|------|
| 基础 | Button, Input, Text, Image, Form, FormItem, Select |
| 布局 | Container, Space |
| 业务 | Card, Table, Modal, Tabs, Divider |
| 高级 | Badge, Tag, Avatar, Progress, Statistic, Skeleton |
| 图表 | LineChart, BarChart, PieChart |

### 共享包

| 包名 | 说明 |
|------|------|
| @lowcode/types | 共享类型定义 |
| @lowcode/schema | Schema 验证与操作 |
| @lowcode/utils | 通用工具函数 |
| @lowcode/components | 组件库 |
| @lowcode/codegen | 代码生成引擎 |
| @lowcode/logic-engine | 逻辑流引擎 |
| @lowcode/datasource | 数据源管理 |
| @lowcode/events | 事件系统 |

---

[Unreleased]: https://github.com/example/lowcode/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/example/lowcode/releases/tag/v0.1.0
