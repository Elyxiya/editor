/**
 * Logic Flow Builder
 *
 * 逻辑流程构建器 - 用于创建和操作逻辑流程
 */
import type { LogicNode, LogicConnection, LogicFlow, NodeDefinition, NodeSubtype, FlowMetadata } from './types';
export interface NodeBuilder {
    setType(type: NodeSubtype): NodeBuilder;
    setLabel(label: string): NodeBuilder;
    setPosition(x: number, y: number): NodeBuilder;
    setConfig(params: Record<string, unknown>): NodeBuilder;
    setInputMap(map: Record<string, string>): NodeBuilder;
    setOutputMap(map: Record<string, string>): NodeBuilder;
    build(): LogicNode;
}
/**
 * 创建节点构建器
 */
export declare function createNodeBuilder(): NodeBuilder;
/**
 * 从节点定义创建节点
 */
export declare function createNodeFromDefinition(definition: NodeDefinition, position?: {
    x: number;
    y: number;
}): LogicNode;
/**
 * 创建触发器节点
 */
export declare function createTriggerNode(subtype: 'onClick' | 'onChange' | 'onSubmit' | 'onLoad' | 'onMounted' | 'onTimer', position?: {
    x: number;
    y: number;
}): LogicNode;
/**
 * 创建动作节点
 */
export declare function createActionNode(subtype: 'setValue' | 'callApi' | 'showMessage' | 'showModal' | 'hideModal' | 'navigate' | 'download' | 'upload', params?: Record<string, unknown>, position?: {
    x: number;
    y: number;
}): LogicNode;
/**
 * 创建逻辑节点
 */
export declare function createLogicNode(subtype: 'condition' | 'switch' | 'loop' | 'delay' | 'parallel' | 'sequence', params?: Record<string, unknown>, position?: {
    x: number;
    y: number;
}): LogicNode;
/**
 * 创建数据节点
 */
export declare function createDataNode(subtype: 'getVariable' | 'setVariable' | 'transform' | 'filter' | 'sort' | 'aggregate', params?: Record<string, unknown>, position?: {
    x: number;
    y: number;
}): LogicNode;
export interface ConnectionBuilder {
    setSource(sourceId: string, handle?: string): ConnectionBuilder;
    setTarget(targetId: string, handle?: string): ConnectionBuilder;
    setCondition(condition: string): ConnectionBuilder;
    setDefault(isDefault: boolean): ConnectionBuilder;
    setLineStyle(style: 'solid' | 'dashed' | 'dotted'): ConnectionBuilder;
    build(): LogicConnection;
}
/**
 * 创建连接构建器
 */
export declare function createConnectionBuilder(): ConnectionBuilder;
/**
 * 创建连接
 */
export declare function createConnection(sourceId: string, targetId: string, options?: {
    sourceHandle?: string;
    targetHandle?: string;
    condition?: string;
    isDefault?: boolean;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
}): LogicConnection;
export interface FlowBuilder {
    setId(id: string): FlowBuilder;
    setName(name: string): FlowBuilder;
    setDescription(description: string): FlowBuilder;
    setTrigger(trigger: string): FlowBuilder;
    addNode(node: LogicNode): FlowBuilder;
    addNodes(nodes: LogicNode[]): FlowBuilder;
    removeNode(nodeId: string): FlowBuilder;
    updateNode(nodeId: string, updates: Partial<LogicNode>): FlowBuilder;
    addConnection(connection: LogicConnection): FlowBuilder;
    addConnectionBatch(connections: LogicConnection[]): FlowBuilder;
    removeConnection(connectionId: string): FlowBuilder;
    setNodes(nodes: LogicNode[]): FlowBuilder;
    setConnections(connections: LogicConnection[]): FlowBuilder;
    setMetadata(metadata: FlowMetadata): FlowBuilder;
    build(): LogicFlow;
}
/**
 * 创建流程构建器
 */
export declare function createFlowBuilder(initial?: Partial<LogicFlow>): FlowBuilder;
/**
 * 创建简单的点击事件流程
 */
export declare function createClickEventFlow(componentId: string, actions: Array<{
    type: 'showMessage' | 'navigate' | 'callApi';
    params: Record<string, unknown>;
    position?: {
        x: number;
        y: number;
    };
}>): LogicFlow;
/**
 * 创建表单提交流程
 */
export declare function createFormSubmitFlow(formId: string, config: {
    validate?: boolean;
    submitApi?: string;
    successMessage?: string;
    redirectPath?: string;
}): LogicFlow;
/**
 * 创建数据列表加载流程
 */
export declare function createListLoadFlow(listId: string, config: {
    apiUrl?: string;
    pageSize?: number;
    onSuccess?: string;
}): LogicFlow;
/**
 * 复制流程
 */
export declare function cloneFlow(flow: LogicFlow, newName?: string): LogicFlow;
/**
 * 导出流程为 JSON
 */
export declare function exportFlowToJson(flow: LogicFlow): string;
/**
 * 从 JSON 导入流程
 */
export declare function importFlowFromJson(json: string): LogicFlow;
/**
 * 验证流程的完整性
 */
export declare function validateFlow(flow: LogicFlow): {
    valid: boolean;
    errors: string[];
};
/**
 * 计算节点的边界框
 */
export declare function calculateFlowBounds(flow: LogicFlow): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
};
/**
 * 自动布局节点
 */
export declare function autoLayoutFlow(flow: LogicFlow, direction?: 'horizontal' | 'vertical'): LogicFlow;
