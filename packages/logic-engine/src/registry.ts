/**
 * Node Registry
 * 
 * 节点注册表 - 管理逻辑节点定义的注册、查询和分类
 */

import type {
  NodeDefinition,
  NodeCategory,
  NodeSubtype,
  ValidationResult,
} from './types';
import { allNodes } from './nodes';

// ============================================================
// 节点注册表类
// ============================================================

export class NodeRegistry {
  private nodes: Map<NodeSubtype, NodeDefinition>;
  private categories: Map<NodeCategory, Set<NodeSubtype>>;
  private icons: Map<string, string>;

  constructor() {
    this.nodes = new Map();
    this.categories = new Map();
    this.icons = new Map();

    // 初始化时注册所有预定义节点
    this.registerBuiltinNodes();
  }

  /**
   * 注册内置节点
   */
  private registerBuiltinNodes(): void {
    Object.values(allNodes).forEach((definition) => {
      this.register(definition);
    });
  }

  /**
   * 注册节点
   */
  register(definition: NodeDefinition): void {
    if (this.nodes.has(definition.type)) {
      console.warn(`Node type ${definition.type} is already registered, replacing...`);
    }

    this.nodes.set(definition.type, definition);

    // 更新分类索引
    if (!this.categories.has(definition.category)) {
      this.categories.set(definition.category, new Set());
    }
    this.categories.get(definition.category)!.add(definition.type);

    // 注册图标映射
    if (definition.icon) {
      this.icons.set(definition.type, definition.icon);
    }
  }

  /**
   * 批量注册节点
   */
  registerBatch(definitions: NodeDefinition[]): void {
    definitions.forEach((def) => this.register(def));
  }

  /**
   * 注销节点
   */
  unregister(type: NodeSubtype): boolean {
    const definition = this.nodes.get(type);
    if (!definition) return false;

    this.nodes.delete(type);
    this.categories.get(definition.category)?.delete(type);

    return true;
  }

  /**
   * 获取节点定义
   */
  get(type: NodeSubtype): NodeDefinition | undefined {
    return this.nodes.get(type);
  }

  /**
   * 获取所有节点
   */
  getAll(): NodeDefinition[] {
    return Array.from(this.nodes.values());
  }

  /**
   * 按分类获取节点
   */
  getByCategory(category: NodeCategory): NodeDefinition[] {
    const types = this.categories.get(category);
    if (!types) return [];

    return Array.from(types)
      .map((type) => this.nodes.get(type))
      .filter((node): node is NodeDefinition => node !== undefined);
  }

  /**
   * 获取可拖拽的节点
   */
  getDraggable(): NodeDefinition[] {
    return this.getAll().filter((node) => node.isDraggable);
  }

  /**
   * 获取节点图标
   */
  getIcon(type: NodeSubtype): string | undefined {
    return this.icons.get(type);
  }

  /**
   * 获取节点分类标签
   */
  getCategoryLabel(category: NodeCategory): string {
    const labels: Record<NodeCategory, string> = {
      trigger: '触发器',
      action: '动作',
      logic: '逻辑',
      data: '数据',
    };
    return labels[category];
  }

  /**
   * 获取分类颜色
   */
  getCategoryColor(category: NodeCategory): string {
    const colors: Record<NodeCategory, string> = {
      trigger: '#1890ff', // 蓝色 - 开始
      action: '#52c41a',  // 绿色 - 执行
      logic: '#faad14',   // 黄色 - 判断
      data: '#722ed1',     // 紫色 - 数据
    };
    return colors[category];
  }

  /**
   * 验证节点配置
   */
  validate(type: NodeSubtype, config: Record<string, unknown>): ValidationResult {
    const definition = this.nodes.get(type);
    if (!definition) {
      return { valid: false, errors: [`Unknown node type: ${type}`] };
    }

    if (definition.validate) {
      return definition.validate(config as Parameters<typeof definition.validate>[0]);
    }

    return { valid: true };
  }

  /**
   * 搜索节点
   */
  search(query: string): NodeDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (node) =>
        node.label.toLowerCase().includes(lowerQuery) ||
        node.type.toLowerCase().includes(lowerQuery) ||
        node.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取节点数量
   */
  size(): number {
    return this.nodes.size;
  }

  /**
   * 检查节点是否存在
   */
  has(type: NodeSubtype): boolean {
    return this.nodes.has(type);
  }

  /**
   * 清空所有自定义节点（保留内置节点）
   */
  clearCustom(): void {
    const builtinTypes = new Set(Object.keys(allNodes));
    this.nodes.forEach((_, type) => {
      if (!builtinTypes.has(type)) {
        this.unregister(type);
      }
    });
  }

  /**
   * 重置为内置节点
   */
  reset(): void {
    this.nodes.clear();
    this.categories.clear();
    this.icons.clear();
    this.registerBuiltinNodes();
  }

  /**
   * 导出节点定义
   */
  export(): NodeDefinition[] {
    return this.getAll();
  }

  /**
   * 从导入的节点定义批量注册
   */
  import(definitions: NodeDefinition[]): void {
    this.registerBatch(definitions);
  }
}

// ============================================================
// 预定义分类配置
// ============================================================

export const NODE_CATEGORIES: Array<{
  key: NodeCategory;
  label: string;
  color: string;
  icon: string;
}> = [
  {
    key: 'trigger',
    label: '触发器',
    color: '#1890ff',
    icon: 'ThunderboltOutlined',
  },
  {
    key: 'action',
    label: '动作',
    color: '#52c41a',
    icon: 'PlayCircleOutlined',
  },
  {
    key: 'logic',
    label: '逻辑',
    color: '#faad14',
    icon: 'BranchesOutlined',
  },
  {
    key: 'data',
    label: '数据',
    color: '#722ed1',
    icon: 'DatabaseOutlined',
  },
];

// ============================================================
// 导出单例
// ============================================================

export const nodeRegistry = new NodeRegistry();
