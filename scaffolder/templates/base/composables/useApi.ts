/**
 * API 通信层 —— 所有后端请求的唯一出入口。
 * 组件 / 页面禁止直接 fetch，统一调用这里导出的方法。
 */

const API_BASE = ''

/** 统一请求封装 */
export async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${url}`, init)
  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({ message: `HTTP ${resp.status}` }))
    throw new Error(errBody.message || `HTTP ${resp.status}`)
  }
  return resp.json() as Promise<T>
}

// 示例：在此添加你的接口方法
// export function fetchUsers() {
//   return request<User[]>('/api/users')
// }
