/**
 * Node Registry
 *
 * 节点注册表 - 管理逻辑节点定义的注册、查询和分类
 */
import type { NodeDefinition, NodeCategory, NodeSubtype, ValidationResult } from './types';
export declare class NodeRegistry {
    private nodes;
    private categories;
    private icons;
    constructor();
    /**
     * 注册内置节点
     */
    private registerBuiltinNodes;
    /**
     * 注册节点
     */
    register(definition: NodeDefinition): void;
    /**
     * 批量注册节点
     */
    registerBatch(definitions: NodeDefinition[]): void;
    /**
     * 注销节点
     */
    unregister(type: NodeSubtype): boolean;
    /**
     * 获取节点定义
     */
    get(type: NodeSubtype): NodeDefinition | undefined;
    /**
     * 获取所有节点
     */
    getAll(): NodeDefinition[];
    /**
     * 按分类获取节点
     */
    getByCategory(category: NodeCategory): NodeDefinition[];
    /**
     * 获取可拖拽的节点
     */
    getDraggable(): NodeDefinition[];
    /**
     * 获取节点图标
     */
    getIcon(type: NodeSubtype): string | undefined;
    /**
     * 获取节点分类标签
     */
    getCategoryLabel(category: NodeCategory): string;
    /**
     * 获取分类颜色
     */
    getCategoryColor(category: NodeCategory): string;
    /**
     * 验证节点配置
     */
    validate(type: NodeSubtype, config: Record<string, unknown>): ValidationResult;
    /**
     * 搜索节点
     */
    search(query: string): NodeDefinition[];
    /**
     * 获取节点数量
     */
    size(): number;
    /**
     * 检查节点是否存在
     */
    has(type: NodeSubtype): boolean;
    /**
     * 清空所有自定义节点（保留内置节点）
     */
    clearCustom(): void;
    /**
     * 重置为内置节点
     */
    reset(): void;
    /**
     * 导出节点定义
     */
    export(): NodeDefinition[];
    /**
     * 从导入的节点定义批量注册
     */
    import(definitions: NodeDefinition[]): void;
}
export declare const NODE_CATEGORIES: Array<{
    key: NodeCategory;
    label: string;
    color: string;
    icon: string;
}>;
export declare const nodeRegistry: NodeRegistry;
