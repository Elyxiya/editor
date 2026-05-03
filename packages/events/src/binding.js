/**
 * Event Binding Module
 *
 * 事件绑定系统 - 负责将组件事件与动作关联
 */
import { v4 as uuidv4 } from 'uuid';
import { getGlobalEmitter } from './emitter';
import { getActionExecutor } from './actions';
// ============================================================
// 事件绑定管理器
// ============================================================
export class EventBindingManager {
    constructor(config = {}) {
        this.bindings = new Map();
        this.componentEvents = new Map();
        this.config = {
            debug: config.debug ?? false,
            autoBind: config.autoBind ?? true,
            defaultOptions: config.defaultOptions ?? {
                capture: false,
                once: false,
                priority: 'normal',
                disabled: false,
            },
        };
        this.emitter = getGlobalEmitter();
        this.executor = getActionExecutor();
        this.listenerIds = new Map();
        // 设置默认的事件处理器
        this.setupDefaultHandler();
    }
    // ============================================================
    // 绑定管理
    // ============================================================
    /**
     * 创建事件绑定
     */
    createBinding(componentId, eventType, actions, options) {
        const binding = {
            id: uuidv4(),
            componentId,
            eventType: eventType,
            actions,
            enabled: options?.enabled ?? true,
            condition: options?.condition,
            params: options?.params,
        };
        this.bindings.set(binding.id, binding);
        // 如果配置了自动绑定，立即绑定
        if (this.config.autoBind) {
            this.bind(binding);
        }
        this.log(`Binding created: ${binding.id} (${componentId}:${eventType})`);
        return binding;
    }
    /**
     * 创建绑定并自动生成 ID
     */
    addBinding(componentId, eventType, actions, options) {
        const binding = this.createBinding(componentId, eventType, actions, options);
        return binding.id;
    }
    /**
     * 获取绑定
     */
    getBinding(bindingId) {
        return this.bindings.get(bindingId);
    }
    /**
     * 获取组件的所有绑定
     */
    getBindingsByComponent(componentId) {
        return Array.from(this.bindings.values()).filter((b) => b.componentId === componentId);
    }
    /**
     * 获取组件特定事件的绑定
     */
    getBindingForEvent(componentId, eventType) {
        return Array.from(this.bindings.values()).find((b) => b.componentId === componentId && b.eventType === eventType);
    }
    /**
     * 更新绑定
     */
    updateBinding(bindingId, updates) {
        const binding = this.bindings.get(bindingId);
        if (!binding)
            return false;
        Object.assign(binding, updates);
        this.log(`Binding updated: ${bindingId}`);
        return true;
    }
    /**
     * 删除绑定
     */
    removeBinding(bindingId) {
        const binding = this.bindings.get(bindingId);
        if (!binding)
            return false;
        this.unbind(bindingId);
        this.bindings.delete(bindingId);
        this.log(`Binding removed: ${bindingId}`);
        return true;
    }
    /**
     * 删除组件的所有绑定
     */
    removeBindingsByComponent(componentId) {
        const toRemove = this.getBindingsByComponent(componentId);
        toRemove.forEach((b) => {
            this.unbind(b.id);
            this.bindings.delete(b.id);
        });
        this.log(`Removed ${toRemove.length} bindings for component: ${componentId}`);
        return toRemove.length;
    }
    /**
     * 启用绑定
     */
    enableBinding(bindingId) {
        const binding = this.bindings.get(bindingId);
        if (!binding)
            return false;
        binding.enabled = true;
        this.log(`Binding enabled: ${bindingId}`);
        return true;
    }
    /**
     * 禁用绑定
     */
    disableBinding(bindingId) {
        const binding = this.bindings.get(bindingId);
        if (!binding)
            return false;
        binding.enabled = false;
        this.log(`Binding disabled: ${bindingId}`);
        return true;
    }
    // ============================================================
    // 事件监听管理
    // ============================================================
    /**
     * 绑定事件监听
     */
    bind(binding) {
        const unsubscribe = this.emitter.on(binding.eventType, async (event) => {
            // 检查组件 ID 匹配
            if (event.context.componentId !== binding.componentId)
                return;
            // 检查绑定是否启用
            if (!binding.enabled)
                return;
            // 检查条件
            if (binding.condition && !this.evaluateCondition(binding.condition, binding.params || {})) {
                return;
            }
            // 执行动作
            await this.executeActions(binding.actions, binding.params || {});
        });
        this.listenerIds.set(binding.id, unsubscribe);
    }
    /**
     * 解绑事件监听
     */
    unbind(bindingId) {
        const listenerId = this.listenerIds.get(bindingId);
        if (listenerId) {
            this.emitter.off(listenerId);
            this.listenerIds.delete(bindingId);
        }
    }
    // ============================================================
    // 动作执行
    // ============================================================
    /**
     * 执行动作列表
     */
    async executeActions(actions, params) {
        // 设置执行上下文
        this.executor.setContext({
            ...params,
            timestamp: Date.now(),
        });
        // 逐个执行动作
        for (const action of actions) {
            try {
                await this.executor.execute(action);
            }
            catch (error) {
                console.error(`Action execution failed: ${action.id}`, error);
            }
        }
    }
    // ============================================================
    // 条件评估
    // ============================================================
    /**
     * 评估条件表达式
     */
    evaluateCondition(condition, context) {
        try {
            const keys = Object.keys(context);
            const values = Object.values(context);
            const fn = new Function(...keys, `return ${condition}`);
            return !!fn(...values);
        }
        catch {
            return true;
        }
    }
    // ============================================================
    // 组件事件定义
    // ============================================================
    /**
     * 注册组件事件
     */
    registerComponentEvents(componentType, events) {
        this.componentEvents.set(componentType, events);
        this.log(`Registered events for component: ${componentType}`);
    }
    /**
     * 获取组件事件定义
     */
    getComponentEvents(componentType) {
        return this.componentEvents.get(componentType) || [];
    }
    /**
     * 触发组件事件
     */
    triggerComponentEvent(componentId, componentType, eventName, data) {
        const events = this.getComponentEvents(componentType);
        const eventDef = events.find((e) => e.name === eventName);
        if (eventDef) {
            this.emitter.emit(eventName, {
                componentId,
                componentType,
                data,
            });
        }
    }
    // ============================================================
    // 导入/导出
    // ============================================================
    /**
     * 导出所有绑定
     */
    exportBindings() {
        return Array.from(this.bindings.values());
    }
    /**
     * 导入绑定
     */
    importBindings(bindings) {
        bindings.forEach((binding) => {
            this.bindings.set(binding.id, binding);
            this.bind(binding);
        });
    }
    /**
     * 清空所有绑定
     */
    clear() {
        this.bindings.forEach((_b, id) => this.unbind(id));
        this.bindings.clear();
        this.log('All bindings cleared');
    }
    // ============================================================
    // 私有方法
    // ============================================================
    /**
     * 设置默认事件处理器
     */
    setupDefaultHandler() {
        // 可以在这里设置全局的错误处理等
    }
    log(message) {
        if (this.config.debug) {
            console.log(`[EventBindingManager] ${message}`);
        }
    }
}
/**
 * useEventBinding Hook
 *
 * 在 React 组件中使用事件绑定
 */
export function createUseEventBinding(react) {
    return function useEventBinding(componentId, componentType, manager, deps = []) {
        // 触发事件
        const onEvent = react.useCallback((eventName, data) => {
            manager.triggerComponentEvent(componentId, componentType, eventName, data);
        }, 
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [componentId, componentType, manager, ...deps]);
        // 获取绑定列表
        const getBindings = react.useCallback(() => {
            return manager.getBindingsByComponent(componentId);
        }, [componentId, manager]);
        return { onEvent, getBindings };
    };
}
// ============================================================
// 预定义组件事件
// ============================================================
export const PRESET_COMPONENT_EVENTS = {
    Button: [
        {
            name: 'onClick',
            label: '点击',
            description: '按钮点击时触发',
        },
        {
            name: 'onMouseEnter',
            label: '鼠标进入',
            description: '鼠标进入按钮区域时触发',
        },
        {
            name: 'onMouseLeave',
            label: '鼠标离开',
            description: '鼠标离开按钮区域时触发',
        },
    ],
    Input: [
        {
            name: 'onChange',
            label: '值变化',
            description: '输入值变化时触发',
            params: [
                { name: 'value', type: 'string', description: '当前输入值' },
            ],
        },
        {
            name: 'onFocus',
            label: '获得焦点',
            description: '输入框获得焦点时触发',
        },
        {
            name: 'onBlur',
            label: '失去焦点',
            description: '输入框失去焦点时触发',
        },
        {
            name: 'onPressEnter',
            label: '回车',
            description: '按下回车键时触发',
        },
    ],
    Select: [
        {
            name: 'onChange',
            label: '值变化',
            description: '选择值变化时触发',
            params: [
                { name: 'value', type: 'any', description: '当前选中值' },
                { name: 'option', type: 'object', description: '选中的选项' },
            ],
        },
        {
            name: 'onSearch',
            label: '搜索',
            description: '搜索词变化时触发',
            params: [
                { name: 'value', type: 'string', description: '搜索关键词' },
            ],
        },
        {
            name: 'onDropdownVisibleChange',
            label: '下拉显隐',
            description: '下拉框显隐状态变化时触发',
            params: [
                { name: 'visible', type: 'boolean', description: '是否显示' },
            ],
        },
    ],
    Form: [
        {
            name: 'onFinish',
            label: '提交成功',
            description: '表单提交成功时触发',
            params: [
                { name: 'values', type: 'object', description: '表单值' },
            ],
        },
        {
            name: 'onFinishFailed',
            label: '提交失败',
            description: '表单提交失败时触发',
            params: [
                { name: 'errorInfo', type: 'object', description: '错误信息' },
            ],
        },
        {
            name: 'onValuesChange',
            label: '值变化',
            description: '表单值变化时触发',
            params: [
                { name: 'changedValues', type: 'object', description: '变化的值' },
                { name: 'allValues', type: 'object', description: '全部值' },
            ],
        },
    ],
    Table: [
        {
            name: 'onChange',
            label: '变化',
            description: '分页、排序、筛选变化时触发',
            params: [
                { name: 'pagination', type: 'object', description: '分页信息' },
                { name: 'filters', type: 'object', description: '筛选信息' },
                { name: 'sorter', type: 'object', description: '排序信息' },
            ],
        },
        {
            name: 'onRowClick',
            label: '行点击',
            description: '点击行时触发',
            params: [
                { name: 'record', type: 'object', description: '行数据' },
                { name: 'index', type: 'number', description: '行索引' },
            ],
        },
        {
            name: 'onSelectChange',
            label: '选择变化',
            description: '选择变化时触发',
            params: [
                { name: 'selectedRowKeys', type: 'array', description: '选中的键' },
                { name: 'selectedRows', type: 'array', description: '选中的行' },
            ],
        },
    ],
    Modal: [
        {
            name: 'onOk',
            label: '确认',
            description: '点击确认按钮时触发',
        },
        {
            name: 'onCancel',
            label: '取消',
            description: '点击取消按钮或关闭弹窗时触发',
        },
        {
            name: 'onClose',
            label: '关闭',
            description: '弹窗关闭时触发',
        },
    ],
    Container: [
        {
            name: 'onClick',
            label: '点击',
            description: '容器被点击时触发',
        },
    ],
};
// ============================================================
// 导出单例
// ============================================================
let managerInstance = null;
export function getEventBindingManager() {
    if (!managerInstance) {
        managerInstance = new EventBindingManager();
    }
    return managerInstance;
}
export function resetEventBindingManager() {
    if (managerInstance) {
        managerInstance.clear();
        managerInstance = null;
    }
}
