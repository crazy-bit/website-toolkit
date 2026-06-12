/**
 * API 通信层 —— 所有后端请求的唯一出入口（带统一日志）。
 * 组件 / 页面禁止直接 fetch，统一调用这里导出的方法。
 */

const API_BASE = ''
const log = useLogger('api')

/** 统一请求封装：自动记录开始 / 耗时 / 成功 / 失败 */
export async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET'
  const start = import.meta.client ? performance.now() : Date.now()
  log.info('请求开始', { url, method })
  try {
    const resp = await fetch(`${API_BASE}${url}`, init)
    const ms = Math.round((import.meta.client ? performance.now() : Date.now()) - start)
    if (!resp.ok) {
      const errBody = await resp.json().catch(() => ({ message: `HTTP ${resp.status}` }))
      log.error('请求失败', { url, status: resp.status, ms, message: errBody.message })
      throw new Error(errBody.message || `HTTP ${resp.status}`)
    }
    log.info('请求成功', { url, status: resp.status, ms })
    return resp.json() as Promise<T>
  } catch (e) {
    log.error('请求异常', { url, error: String(e) })
    throw e
  }
}

// 示例：在此添加你的接口方法
// export function fetchUsers() {
//   return request<User[]>('/api/users')
// }
