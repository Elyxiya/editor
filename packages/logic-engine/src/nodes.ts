/**
 * Logic Nodes Definitions
 * 
 * 预定义逻辑节点库
 */

import type { NodeDefinition, NodeCategory, NodeSubtype, PortDefinition } from './types';

// ============================================================
// 端口定义辅助函数
// ============================================================

const createInput = (
  id: string,
  name: string,
  label: string,
  type: PortDefinition['type'] = 'any',
  required = false,
  defaultValue?: unknown
): PortDefinition => ({
  id,
  name,
  label,
  type,
  required,
  defaultValue,
});

const createOutput = (
  id: string,
  name: string,
  label: string,
  type: PortDefinition['type'] = 'any'
): PortDefinition => ({
  id,
  name,
  label,
  type,
});

// ============================================================
// 触发器节点
// ============================================================

export const triggerNodes: Record<string, NodeDefinition> = {
  onClick: {
    type: 'onClick',
    category: 'trigger',
    label: '点击触发',
    description: '组件被点击时触发',
    icon: 'MouseClickOutlined',
    inputs: [],
    outputs: [
      createOutput('trigger', 'trigger', '触发'),
      createOutput('event', 'event', '事件对象', 'object'),
    ],
    isDraggable: true,
  },

  onChange: {
    type: 'onChange',
    category: 'trigger',
    label: '值变化触发',
    description: '表单值变化时触发',
    icon: 'EditOutlined',
    inputs: [],
    outputs: [
      createOutput('trigger', 'trigger', '触发'),
      createOutput('value', 'value', '新值', 'any'),
      createOutput('oldValue', 'oldValue', '旧值', 'any'),
    ],
    isDraggable: true,
  },

  onSubmit: {
    type: 'onSubmit',
    category: 'trigger',
    label: '表单提交',
    description: '表单提交时触发',
    icon: 'SendOutlined',
    inputs: [],
    outputs: [
      createOutput('trigger', 'trigger', '触发'),
      createOutput('values', 'values', '表单值', 'object'),
    ],
    isDraggable: true,
  },

  onLoad: {
    type: 'onLoad',
    category: 'trigger',
    label: '页面加载',
    description: '页面或组件加载时触发',
    icon: 'ThunderboltOutlined',
    inputs: [],
    outputs: [
      createOutput('trigger', 'trigger', '触发'),
    ],
    isDraggable: true,
  },

  onMounted: {
    type: 'onMounted',
    category: 'trigger',
    label: '组件挂载',
    description: '组件首次渲染时触发',
    icon: 'CheckCircleOutlined',
    inputs: [],
    outputs: [
      createOutput('trigger', 'trigger', '触发'),
    ],
    isDraggable: true,
  },

  onTimer: {
    type: 'onTimer',
    category: 'trigger',
    label: '定时触发',
    description: '定时器触发',
    icon: 'ClockCircleOutlined',
    inputs: [],
    outputs: [
      createOutput('trigger', 'trigger', '触发'),
      createOutput('timestamp', 'timestamp', '时间戳', 'number'),
    ],
    isDraggable: true,
  },
};

// ============================================================
// 动作节点
// ============================================================

export const actionNodes: Record<string, NodeDefinition> = {
  setValue: {
    type: 'setValue',
    category: 'action',
    label: '赋值',
    description: '设置变量或属性的值',
    icon: 'AssignmentOutlined',
    inputs: [
      createInput('input', 'input', '输入', 'any'),
    ],
    outputs: [
      createOutput('output', 'output', '输出', 'any'),
    ],
    isDraggable: true,
    validate: (config) => {
      const errors: string[] = [];
      if (!config.params?.variableName) {
        errors.push('请指定变量名');
      }
      return { valid: errors.length === 0, errors };
    },
  },

  callApi: {
    type: 'callApi',
    category: 'action',
    label: '调用接口',
    description: '发起 HTTP 请求',
    icon: 'ApiOutlined',
    inputs: [
      createInput('params', 'params', '请求参数', 'object'),
    ],
    outputs: [
      createOutput('response', 'response', '响应', 'any'),
      createOutput('success', 'success', '成功', 'boolean'),
      createOutput('data', 'data', '数据', 'any'),
      createOutput('error', 'error', '错误', 'object'),
    ],
    isDraggable: true,
    validate: (config) => {
      const errors: string[] = [];
      if (!config.params?.url) {
        errors.push('请指定 API 地址');
      }
      return { valid: errors.length === 0, errors };
    },
  },

  showMessage: {
    type: 'showMessage',
    category: 'action',
    label: '消息提示',
    description: '显示操作反馈消息',
    icon: 'MessageOutlined',
    inputs: [
      createInput('message', 'message', '消息内容', 'string'),
    ],
    outputs: [
      createOutput('done', 'done', '完成'),
    ],
    isDraggable: true,
    validate: (config) => {
      const errors: string[] = [];
      if (!config.params?.content) {
        errors.push('请输入消息内容');
      }
      return { valid: errors.length === 0, errors };
    },
  },

  showModal: {
    type: 'showModal',
    category: 'action',
    label: '显示弹窗',
    description: '显示模态框',
    icon: 'DesktopOutlined',
    inputs: [
      createInput('data', 'data', '传入数据', 'object'),
    ],
    outputs: [
      createOutput('confirmed', 'confirmed', '确认', 'boolean'),
      createOutput('result', 'result', '结果', 'any'),
    ],
    isDraggable: true,
  },

  hideModal: {
    type: 'hideModal',
    category: 'action',
    label: '关闭弹窗',
    description: '关闭当前模态框',
    icon: 'CloseCircleOutlined',
    inputs: [],
    outputs: [
      createOutput('done', 'done', '完成'),
    ],
    isDraggable: true,
  },

  navigate: {
    type: 'navigate',
    category: 'action',
    label: '页面跳转',
    description: '跳转到指定页面',
    icon: 'LinkOutlined',
    inputs: [
      createInput('params', 'params', '路由参数', 'object'),
    ],
    outputs: [
      createOutput('done', 'done', '完成'),
    ],
    isDraggable: true,
    validate: (config) => {
      const errors: string[] = [];
      if (!config.params?.path) {
        errors.push('请指定跳转路径');
      }
      return { valid: errors.length === 0, errors };
    },
  },

  download: {
    type: 'download',
    category: 'action',
    label: '下载文件',
    description: '触发文件下载',
    icon: 'DownloadOutlined',
    inputs: [
      createInput('url', 'url', '文件地址', 'string'),
      createInput('filename', 'filename', '文件名', 'string'),
    ],
    outputs: [
      createOutput('done', 'done', '完成'),
    ],
    isDraggable: true,
  },

  upload: {
    type: 'upload',
    category: 'action',
    label: '上传文件',
    description: '上传文件到服务器',
    icon: 'UploadOutlined',
    inputs: [
      createInput('file', 'file', '文件', 'any'),
    ],
    outputs: [
      createOutput('url', 'url', '文件地址', 'string'),
      createOutput('response', 'response', '响应', 'object'),
    ],
    isDraggable: true,
  },
};

// ============================================================
// 逻辑节点
// ============================================================

export const logicNodes: Record<string, NodeDefinition> = {
  condition: {
    type: 'condition',
    category: 'logic',
    label: '条件判断',
    description: '根据条件决定执行路径',
    icon: 'BranchesOutlined',
    inputs: [
      createInput('input', 'input', '输入', 'any'),
    ],
    outputs: [
      createOutput('true', 'true', '条件成立'),
      createOutput('false', 'false', '条件不成立'),
    ],
    isDraggable: true,
    validate: (config) => {
      const errors: string[] = [];
      if (!config.params?.expression) {
        errors.push('请输入条件表达式');
      }
      return { valid: errors.length === 0, errors };
    },
  },

  switch: {
    type: 'switch',
    category: 'logic',
    label: '多条件分支',
    description: '多条件分支判断',
    icon: 'SplitCellsOutlined',
    inputs: [
      createInput('input', 'input', '输入值', 'any'),
    ],
    outputs: [
      createOutput('case1', 'case1', '条件1'),
      createOutput('case2', 'case2', '条件2'),
      createOutput('default', 'default', '默认'),
    ],
    isDraggable: true,
  },

  loop: {
    type: 'loop',
    category: 'logic',
    label: '循环',
    description: '遍历数组或执行固定次数',
    icon: 'ReloadOutlined',
    inputs: [
      createInput('items', 'items', '数组', 'array'),
    ],
    outputs: [
      createOutput('each', 'each', '每次迭代'),
      createOutput('done', 'done', '循环结束'),
    ],
    isDraggable: true,
  },

  delay: {
    type: 'delay',
    category: 'logic',
    label: '延迟',
    description: '延迟指定时间后继续执行',
    icon: 'ClockCircleOutlined',
    inputs: [
      createInput('trigger', 'trigger', '触发'),
    ],
    outputs: [
      createOutput('done', 'done', '延迟结束'),
    ],
    isDraggable: true,
    validate: (config) => {
      const errors: string[] = [];
      const duration = config.params?.duration as number;
      if (!duration || duration < 0) {
        errors.push('请输入有效的延迟时间（毫秒）');
      }
      return { valid: errors.length === 0, errors };
    },
  },

  parallel: {
    type: 'parallel',
    category: 'logic',
    label: '并行执行',
    description: '并行执行多个分支',
    icon: 'NodeIndexOutlined',
    inputs: [
      createInput('trigger', 'trigger', '触发'),
    ],
    outputs: [
      createOutput('branch1', 'branch1', '分支1'),
      createOutput('branch2', 'branch2', '分支2'),
    ],
    isDraggable: true,
  },

  sequence: {
    type: 'sequence',
    category: 'logic',
    label: '顺序执行',
    description: '按顺序执行多个步骤',
    icon: 'OrderedListOutlined',
    inputs: [
      createInput('trigger', 'trigger', '触发'),
    ],
    outputs: [
      createOutput('done', 'done', '完成'),
    ],
    isDraggable: true,
  },
};

// ============================================================
// 数据节点
// ============================================================

export const dataNodes: Record<string, NodeDefinition> = {
  getVariable: {
    type: 'getVariable',
    category: 'data',
    label: '获取变量',
    description: '获取上下文中存储的变量值',
    icon: 'DatabaseOutlined',
    inputs: [
      createInput('trigger', 'trigger', '触发'),
    ],
    outputs: [
      createOutput('value', 'value', '变量值', 'any'),
    ],
    isDraggable: true,
    validate: (config) => {
      const errors: string[] = [];
      if (!config.params?.variableName) {
        errors.push('请指定变量名');
      }
      return { valid: errors.length === 0, errors };
    },
  },

  setVariable: {
    type: 'setVariable',
    category: 'data',
    label: '设置变量',
    description: '在上下文中存储变量值',
    icon: 'SaveOutlined',
    inputs: [
      createInput('trigger', 'trigger', '触发'),
      createInput('value', 'value', '值', 'any'),
    ],
    outputs: [
      createOutput('done', 'done', '完成'),
    ],
    isDraggable: true,
    validate: (config) => {
      const errors: string[] = [];
      if (!config.params?.variableName) {
        errors.push('请指定变量名');
      }
      return { valid: errors.length === 0, errors };
    },
  },

  transform: {
    type: 'transform',
    category: 'data',
    label: '数据转换',
    description: '使用表达式转换数据',
    icon: 'SwapOutlined',
    inputs: [
      createInput('input', 'input', '输入', 'any'),
    ],
    outputs: [
      createOutput('output', 'output', '输出', 'any'),
    ],
    isDraggable: true,
  },

  filter: {
    type: 'filter',
    category: 'data',
    label: '数据过滤',
    description: '过滤数组中的元素',
    icon: 'FilterOutlined',
    inputs: [
      createInput('array', 'array', '数组', 'array'),
    ],
    outputs: [
      createOutput('result', 'result', '过滤结果', 'array'),
    ],
    isDraggable: true,
  },

  sort: {
    type: 'sort',
    category: 'data',
    label: '数据排序',
    description: '对数组进行排序',
    icon: 'SortAscendingOutlined',
    inputs: [
      createInput('array', 'array', '数组', 'array'),
    ],
    outputs: [
      createOutput('result', 'result', '排序结果', 'array'),
    ],
    isDraggable: true,
  },

  aggregate: {
    type: 'aggregate',
    category: 'data',
    label: '数据聚合',
    description: '对数组进行聚合计算（求和、平均值、最大/最小值等）',
    icon: 'CalculatorOutlined',
    inputs: [
      createInput('array', 'array', '数组', 'array'),
    ],
    outputs: [
      createOutput('result', 'result', '聚合结果', 'number'),
    ],
    isDraggable: true,
  },
};

// ============================================================
// 导出所有节点
// ============================================================

export const allNodes: Record<string, NodeDefinition> = {
  ...triggerNodes,
  ...actionNodes,
  ...logicNodes,
  ...dataNodes,
};

/**
 * 获取指定分类的所有节点
 */
export function getNodesByCategory(category: NodeCategory): NodeDefinition[] {
  const filterFn = (nodes: Record<string, NodeDefinition>) => Object.values(nodes);
  
  switch (category) {
    case 'trigger':
      return filterFn(triggerNodes);
    case 'action':
      return filterFn(actionNodes);
    case 'logic':
      return filterFn(logicNodes);
    case 'data':
      return filterFn(dataNodes);
    default:
      return [];
  }
}

/**
 * 获取可拖拽的节点列表
 */
export function getDraggableNodes(): NodeDefinition[] {
  return Object.values(allNodes).filter(node => node.isDraggable);
}

/**
 * 根据类型获取节点定义
 */
export function getNodeDefinition(type: NodeSubtype): NodeDefinition | undefined {
  return allNodes[type];
}
