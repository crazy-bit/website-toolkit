/**
 * 纯函数工具示例（便于被单元测试覆盖）。
 * 约定：可独立测试的纯计算逻辑应从组件中抽到 composable / 此处。
 */

/** 将数值限制在 [min, max] 区间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** 千分位格式化 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/** 计算完成率 -> 健康度等级 */
export function calcHealthLevel(ratio: number): 'healthy' | 'normal' | 'risk' {
  if (ratio >= 0.8) return 'healthy'
  if (ratio >= 0.4) return 'normal'
  return 'risk'
}
