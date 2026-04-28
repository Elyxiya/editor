/**
 * LowCode Logic Engine
 * 
 * 逻辑编排引擎 - 负责处理可视化逻辑流程的定义、执行和管理
 * 
 * 核心概念:
 * - Node (节点): 流程中的基本单元，分为触发器、动作、逻辑、数据四类
 * - Connection (连接): 节点之间的连线，表示执行顺序或数据流
 * - Flow (流程): 由节点和连接组成的完整逻辑流程
 */

export * from './types';
export * from './nodes';
export * from './executor';
export * from './registry';
export * from './builder';
