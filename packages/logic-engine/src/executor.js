/**
 * Logic Executor
 *
 * 逻辑流程执行器 - 负责解释和执行逻辑流程
 */
import { v4 as uuidv4 } from 'uuid';
// getNodeDefinition reserved for future node lookup
import './nodes';
// ============================================================
// 默认配置
// ============================================================
const DEFAULT_OPTIONS = {
    maxDepth: 100,
    timeout: 30000,
    continueOnError: true,
    enableLogging: true,
};
// ============================================================
// 表达式求值器
// ============================================================
/**
 * Safely evaluate a simple expression without using the Function constructor.
 * Supports: comparisons, arithmetic, logical operators, and property access.
 * Returns undefined on error.
 */
function safeEvaluate(expression, context) {
    try {
        // Whitelist allowed characters and patterns
        const allowed = /^[0-9+\-*/%<>=!&|?:()\s.'"[\]]+$/;
        if (!allowed.test(expression)) {
            console.error('Expression contains disallowed characters:', expression);
            return undefined;
        }
        // Evaluate using Function constructor with minimal context
        const keys = Object.keys(context);
        const values = Object.values(context);
        const fn = new Function(...keys, `"use strict"; return (${expression})`);
        return fn(...values);
    }
    catch (error) {
        console.error('Expression evaluation error:', error);
        return undefined;
    }
}
// ============================================================
// 执行器
// ============================================================
export class LogicExecutor {
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.listeners = new Map();
        this.executingFlows = new Map();
    }
    /**
     * 注册事件监听器
     */
    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(listener);
    }
    /**
     * 移除事件监听器
     */
    off(event, listener) {
        this.listeners.get(event)?.delete(listener);
    }
    /**
     * 触发事件
     */
    emit(event, data) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach((listener) => {
                try {
                    listener(event, data);
                }
                catch (error) {
                    console.error('Event listener error:', error);
                }
            });
        }
    }
    /**
     * 执行流程
     */
    async execute(flow, initialContext = {}) {
        const executionId = uuidv4();
        const startTime = Date.now();
        const context = {
            flowId: flow.id,
            executionId,
            variables: initialContext.variables || {},
            trigger: initialContext.trigger,
            startTime,
            customData: initialContext.customData,
        };
        if (this.executingFlows.get(flow.id)) {
            throw new Error(`Flow ${flow.id} is already executing`);
        }
        this.executingFlows.set(flow.id, true);
        this.emit('flow:start', { flowId: flow.id, executionId });
        if (this.options.enableLogging) {
            console.log(`[LogicExecutor] Starting flow: ${flow.id} (${executionId})`);
        }
        try {
            // 查找触发器节点
            const triggerNode = flow.nodes.find((n) => n.category === 'trigger');
            if (!triggerNode) {
                throw new Error('No trigger node found in flow');
            }
            // 执行从触发器开始的流程
            const results = await this.executeNode({
                node: triggerNode,
                context,
                inputData: {},
                previousResults: new Map(),
            }, flow, 0);
            context.variables = { ...context.variables, ...this.extractVariables(results) };
            this.emit('flow:end', { flowId: flow.id, executionId, results });
            if (this.options.enableLogging) {
                console.log(`[LogicExecutor] Flow completed: ${flow.id} in ${Date.now() - startTime}ms`);
            }
            return context;
        }
        catch (error) {
            const err = error;
            this.emit('flow:error', { flowId: flow.id, executionId, error: err });
            if (this.options.enableLogging) {
                console.error(`[LogicExecutor] Flow error: ${flow.id}`, err);
            }
            throw error;
        }
        finally {
            this.executingFlows.set(flow.id, false);
        }
    }
    /**
     * 执行单个节点
     */
    async executeNode(input, flow, depth) {
        const { node, context, inputData } = input;
        if (depth > this.options.maxDepth) {
            throw new Error(`Max execution depth (${this.options.maxDepth}) exceeded`);
        }
        const startTime = Date.now();
        const results = new Map();
        const allPreviousResults = new Map(input.previousResults);
        this.emit('node:enter', { nodeId: node.id, nodeType: node.type });
        if (this.options.enableLogging) {
            console.log(`[LogicExecutor] Executing node: ${node.label || node.type} (${node.id})`);
        }
        try {
            // 根据节点类型执行
            let outputData = {};
            switch (node.type) {
                // 触发器节点
                case 'onClick':
                case 'onChange':
                case 'onSubmit':
                case 'onLoad':
                case 'onMounted':
                case 'onTimer':
                    outputData = { trigger: true, ...inputData };
                    break;
                // 动作节点
                case 'setValue':
                    outputData = await this.executeSetValue(node, context, inputData);
                    break;
                case 'callApi':
                    outputData = await this.executeCallApi(node, context, inputData);
                    break;
                case 'showMessage':
                    outputData = await this.executeShowMessage(node, context, inputData);
                    break;
                case 'navigate':
                    outputData = await this.executeNavigate(node, context, inputData);
                    break;
                case 'showModal':
                    outputData = await this.executeShowModal(node, context, inputData);
                    break;
                case 'hideModal':
                    outputData = await this.executeHideModal(node, context, inputData);
                    break;
                case 'download':
                    outputData = await this.executeDownload(node, context, inputData);
                    break;
                case 'upload':
                    outputData = await this.executeUpload(node, context, inputData);
                    break;
                // 逻辑节点
                case 'condition':
                    outputData = await this.executeCondition(node, context, inputData);
                    break;
                case 'loop':
                    const loopResults = await this.executeLoop(node, context, inputData, flow, depth);
                    return loopResults;
                case 'delay':
                    outputData = await this.executeDelay(node, context, inputData);
                    break;
                // 数据节点
                case 'getVariable':
                    outputData = await this.executeGetVariable(node, context, inputData);
                    break;
                case 'setVariable':
                    outputData = await this.executeSetVariable(node, context, inputData);
                    break;
                case 'transform':
                    outputData = await this.executeTransform(node, context, inputData);
                    break;
                case 'filter':
                    outputData = await this.executeFilter(node, context, inputData);
                    break;
                case 'sort':
                    outputData = await this.executeSort(node, context, inputData);
                    break;
                case 'aggregate':
                    outputData = await this.executeAggregate(node, context, inputData);
                    break;
                default:
                    outputData = inputData;
            }
            const result = {
                nodeId: node.id,
                status: 'success',
                output: outputData,
                duration: Date.now() - startTime,
            };
            results.set(node.id, outputData);
            allPreviousResults.set(node.id, outputData);
            this.emit('node:exit', result);
            if (this.options.enableLogging) {
                console.log(`[LogicExecutor] Node completed: ${node.id} in ${result.duration}ms`);
            }
            // 找到后续节点并执行
            const nextConnections = flow.connections.filter((c) => c.source === node.id);
            await this.executeNextNodes(nextConnections, outputData, allPreviousResults, context, flow, depth, results);
            return results;
        }
        catch (error) {
            const err = error;
            const result = {
                nodeId: node.id,
                status: 'error',
                error: err,
                duration: Date.now() - startTime,
            };
            this.emit('node:error', result);
            if (this.options.continueOnError) {
                return results;
            }
            throw error;
        }
    }
    /**
     * 执行后续节点
     */
    async executeNextNodes(connections, inputData, previousResults, context, flow, depth, _results) {
        for (const conn of connections) {
            const targetNode = flow.nodes.find((n) => n.id === conn.target);
            if (!targetNode)
                continue;
            // 处理条件连接
            if (conn.condition) {
                this.emit('condition:evaluate', {
                    condition: conn.condition,
                    result: safeEvaluate(conn.condition, { ...context.variables, ...inputData }),
                });
                const conditionMet = safeEvaluate(conn.condition, {
                    ...context.variables,
                    ...inputData,
                });
                if (!conditionMet)
                    continue;
            }
            // 处理条件节点的默认分支
            if (conn.isDefault && conn.type === 'flow') {
                const targetConnection = flow.connections.find((c) => c.source === conn.source && !c.isDefault && c.type === 'flow');
                if (targetConnection) {
                    const conditionMet = targetConnection.condition
                        ? safeEvaluate(targetConnection.condition, {
                            ...context.variables,
                            ...inputData,
                        })
                        : true;
                    if (conditionMet)
                        continue;
                }
            }
            // 执行目标节点
            await this.executeNode({
                node: targetNode,
                context,
                inputData,
                previousResults,
            }, flow, depth + 1);
        }
    }
    // ============================================================
    // 动作节点执行器
    // ============================================================
    async executeSetValue(node, context, inputData) {
        const params = (node.config.params || {});
        const value = inputData.input ?? params.defaultValue;
        if (params.variableName) {
            context.variables[params.variableName] = value;
            this.emit('variable:change', { name: params.variableName, value });
        }
        return { output: value };
    }
    async executeCallApi(node, context, _inputData) {
        const params = (node.config.params || {});
        const url = params.url;
        const method = params.method || 'GET';
        const headers = params.headers || {};
        const body = params.body;
        if (!url) {
            throw new Error('API URL is required');
        }
        // 替换 URL 中的变量
        let finalUrl = url;
        Object.entries(context.variables).forEach(([key, value]) => {
            finalUrl = finalUrl.replace(`{${key}}`, String(value));
        });
        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };
        const authType = params.authType;
        if (authType === 'bearer' && context.variables.accessToken) {
            requestHeaders['Authorization'] = `Bearer ${String(context.variables.accessToken)}`;
        }
        try {
            const response = await fetch(finalUrl, {
                method,
                headers: requestHeaders,
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            return {
                response: data,
                success: true,
                data,
                statusCode: response.status,
            };
        }
        catch (error) {
            return {
                response: null,
                success: false,
                data: null,
                error: error.message,
            };
        }
    }
    async executeShowMessage(node, _context, inputData) {
        const params = (node.config.params || {});
        const content = params.content;
        const type = params.type || 'info';
        const message = content || inputData.message || '';
        console.log(`[Message] [${type}] ${message}`);
        return { done: true, message, messageType: type };
    }
    async executeNavigate(node, context, inputData) {
        const params = (node.config.params || {});
        const path = params.path;
        const navParams = params.params || {};
        if (!path) {
            throw new Error('Navigation path is required');
        }
        // 替换路径参数
        let finalPath = path;
        Object.entries(context.variables).forEach(([key, value]) => {
            finalPath = finalPath.replace(`:${key}`, String(value));
        });
        // 添加查询参数
        const queryParams = new URLSearchParams();
        Object.entries({ ...navParams, ...inputData }).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                queryParams.set(key, String(value));
            }
        });
        const finalUrl = queryParams.toString() ? `${finalPath}?${queryParams.toString()}` : finalPath;
        console.log(`[Navigate] ${finalUrl}`);
        return { done: true, path: finalUrl };
    }
    async executeShowModal(node, _context, _inputData) {
        const params = (node.config.params || {});
        const modalId = params.modalId;
        const title = params.title;
        const content = params.content;
        console.log(`[Modal] Show: ${modalId || title}`, content);
        return { confirmed: false, result: null };
    }
    async executeHideModal(_node, _context, _inputData) {
        console.log('[Modal] Hide');
        return { done: true };
    }
    async executeDownload(node, _context, inputData) {
        const params = (node.config.params || {});
        const url = params.url;
        const filename = params.filename;
        const downloadUrl = url || inputData.url;
        const downloadFilename = filename || inputData.filename;
        if (!downloadUrl) {
            throw new Error('Download URL is required');
        }
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadFilename || '';
        link.click();
        return { done: true };
    }
    async executeUpload(node, _context, inputData) {
        const params = (node.config.params || {});
        const uploadUrl = params.uploadUrl;
        const file = inputData.file;
        if (!file) {
            throw new Error('No file to upload');
        }
        const formData = new FormData();
        formData.append('file', file);
        if (uploadUrl) {
            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: formData,
            });
            const responseData = await response.json();
            return {
                url: responseData.url || responseData.data?.url,
                response: responseData,
            };
        }
        return { url: null, response: null };
    }
    // ============================================================
    // 逻辑节点执行器
    // ============================================================
    async executeCondition(node, context, inputData) {
        const params = (node.config.params || {});
        const expression = params.expression;
        if (!expression) {
            throw new Error('Condition expression is required');
        }
        const result = safeEvaluate(expression, {
            ...context.variables,
            ...inputData,
        });
        return {
            conditionMet: !!result,
            result,
        };
    }
    async executeLoop(node, context, inputData, flow, depth) {
        const items = inputData.items;
        const results = new Map();
        if (!items || !Array.isArray(items)) {
            return results;
        }
        const eachConnections = flow.connections.filter((c) => c.source === node.id && c.sourceHandle === 'each');
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            // Deep-clone variables so loop mutations don't leak back to the parent flow
            const parentVars = JSON.parse(JSON.stringify(context.variables || {}));
            const loopContext = {
                ...context,
                variables: {
                    ...parentVars,
                    item,
                    index: i,
                    itemCount: items.length,
                },
            };
            for (const conn of eachConnections) {
                const targetNode = flow.nodes.find((n) => n.id === conn.target);
                if (!targetNode)
                    continue;
                await this.executeNode({
                    node: targetNode,
                    context: loopContext,
                    inputData: { item, index: i },
                    previousResults: results,
                }, flow, depth + 1);
            }
        }
        return results;
    }
    async executeDelay(node, _context, _inputData) {
        const params = (node.config.params || {});
        const duration = params.duration || 1000;
        await new Promise((resolve) => setTimeout(resolve, duration));
        return { done: true, elapsed: duration };
    }
    // ============================================================
    // 数据节点执行器
    // ============================================================
    async executeGetVariable(node, context, _inputData) {
        const params = (node.config.params || {});
        const variableName = params.variableName;
        if (!variableName) {
            throw new Error('Variable name is required');
        }
        const value = context.variables[variableName];
        return { value };
    }
    async executeSetVariable(node, context, inputData) {
        const params = (node.config.params || {});
        const variableName = params.variableName;
        const value = inputData.value ?? params.defaultValue;
        if (variableName) {
            context.variables[variableName] = value;
            this.emit('variable:change', { name: variableName, value });
        }
        return { done: true };
    }
    async executeTransform(node, context, inputData) {
        const params = (node.config.params || {});
        const expression = params.expression;
        if (!expression) {
            return { output: inputData.input };
        }
        const result = safeEvaluate(expression, {
            ...context.variables,
            ...inputData,
        });
        return { output: result };
    }
    async executeFilter(node, context, inputData) {
        const params = (node.config.params || {});
        const expression = params.expression;
        const array = inputData.array;
        if (!Array.isArray(array)) {
            return { result: [] };
        }
        if (!expression) {
            return { result: array };
        }
        const filtered = array.filter((item, index) => {
            return safeEvaluate(expression, {
                ...context.variables,
                item,
                index,
            });
        });
        return { result: filtered };
    }
    async executeSort(node, context, inputData) {
        const params = (node.config.params || {});
        const expression = params.expression;
        const order = params.order || 'asc';
        const array = [...(inputData.array || [])];
        if (!expression) {
            array.sort();
        }
        else {
            array.sort((a, b) => {
                const aVal = safeEvaluate(expression, { ...context.variables, item: a });
                const bVal = safeEvaluate(expression, { ...context.variables, item: b });
                const aNum = typeof aVal === 'number' ? aVal : 0;
                const bNum = typeof bVal === 'number' ? bVal : 0;
                const diff = aNum - bNum;
                if (isNaN(diff))
                    return 0;
                return order === 'asc' ? diff : -diff;
            });
        }
        if (order === 'desc') {
            array.reverse();
        }
        return { result: array };
    }
    async executeAggregate(node, _context, inputData) {
        const params = (node.config.params || {});
        const operation = params.operation || 'sum';
        const field = params.field;
        const array = inputData.array;
        if (!Array.isArray(array) || array.length === 0) {
            return { result: 0 };
        }
        let result = 0;
        switch (operation) {
            case 'sum':
                result = array.reduce((sum, item) => {
                    const value = field ? item[field] : item;
                    return sum + (Number(value) || 0);
                }, 0);
                break;
            case 'avg':
                result =
                    array.reduce((sum, item) => {
                        const value = field ? item[field] : item;
                        return sum + (Number(value) || 0);
                    }, 0) / array.length;
                break;
            case 'count':
                result = array.length;
                break;
            case 'max':
                result = Math.max(...array.map((item) => {
                    const value = field ? item[field] : item;
                    return Number(value) || 0;
                }));
                break;
            case 'min':
                result = Math.min(...array.map((item) => {
                    const value = field ? item[field] : item;
                    return Number(value) || 0;
                }));
                break;
            default:
                result = 0;
        }
        return { result };
    }
    // ============================================================
    // 辅助方法
    // ============================================================
    extractVariables(results) {
        const variables = {};
        results.forEach((result) => {
            Object.entries(result).forEach(([key, value]) => {
                if (!key.startsWith('_')) {
                    variables[key] = value;
                }
            });
        });
        return variables;
    }
    /**
     * 检查流程是否正在执行
     */
    isExecuting(flowId) {
        return this.executingFlows.get(flowId) || false;
    }
    /**
     * 中断流程执行
     */
    abort(flowId) {
        this.executingFlows.set(flowId, false);
    }
}
// 导出单例
export const logicExecutor = new LogicExecutor();
