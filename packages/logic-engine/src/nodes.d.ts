/**
 * Logic Nodes Definitions
 *
 * 预定义逻辑节点库
 */
import type { NodeDefinition, NodeCategory, NodeSubtype } from './types';
export declare const triggerNodes: Record<string, NodeDefinition>;
export declare const actionNodes: Record<string, NodeDefinition>;
export declare const logicNodes: Record<string, NodeDefinition>;
export declare const dataNodes: Record<string, NodeDefinition>;
export declare const allNodes: Record<string, NodeDefinition>;
/**
 * 获取指定分类的所有节点
 */
export declare function getNodesByCategory(category: NodeCategory): NodeDefinition[];
/**
 * 获取可拖拽的节点列表
 */
export declare function getDraggableNodes(): NodeDefinition[];
/**
 * 根据类型获取节点定义
 */
export declare function getNodeDefinition(type: NodeSubtype): NodeDefinition | undefined;
