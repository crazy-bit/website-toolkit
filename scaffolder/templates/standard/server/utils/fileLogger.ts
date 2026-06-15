/**
 * 服务端日志落盘工具：把一条日志按 JSON Lines 追加到 logs/app-<date>.log。
 * 供 server/api/__log.post.ts（接收客户端日志）与服务端代码直接调用。
 * 失败一律静默，绝不影响主流程。
 */
import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const LOG_DIR = join(process.cwd(), 'logs')

export async function appendLogToDisk(entry: Record<string, unknown>): Promise<void> {
  try {
    const time = typeof entry.time === 'string' ? entry.time : new Date().toISOString()
    const file = join(LOG_DIR, `app-${time.slice(0, 10)}.log`)
    await mkdir(LOG_DIR, { recursive: true })
    await appendFile(file, JSON.stringify(entry) + '\n', 'utf8')
  } catch {
    // 落盘失败不影响主流程
  }
}
