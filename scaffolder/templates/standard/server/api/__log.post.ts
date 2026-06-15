/**
 * 内部接口：接收客户端回传的日志并落本地磁盘（logs/app-<date>.log）。
 * 由 composables/useLogger.ts 在客户端批量调用，普通业务代码无需直接使用。
 */
import { appendLogToDisk } from '../utils/fileLogger'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const entries = Array.isArray(body) ? body : [body]
  let written = 0
  for (const e of entries) {
    if (e && typeof e === 'object') {
      await appendLogToDisk(e as Record<string, unknown>)
      written++
    }
  }
  return { ok: true, written }
})
