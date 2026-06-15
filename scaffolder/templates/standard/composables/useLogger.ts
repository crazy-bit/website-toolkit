/**
 * 统一日志系统。全项目禁止裸用 console.log，一律通过 useLogger('模块名')。
 *
 * 特性：分级(debug/info/warn/error) · 结构化 · 内存环形缓冲(供调试面板/一键诊断)
 *      · 敏感字段脱敏 · 落本地磁盘(logs/app-<date>.log)
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  time: string
  level: LogLevel
  module: string
  message: string
  context?: Record<string, unknown>
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const MAX_BUFFER = 200
const buffer: LogEntry[] = []

function push(entry: LogEntry) {
  buffer.push(entry)
  if (buffer.length > MAX_BUFFER) buffer.shift()
}

const SENSITIVE = ['password', 'pwd', 'token', 'authorization', 'secret', 'phone', 'idcard', 'mobile']

function sanitize(ctx?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!ctx) return ctx
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(ctx)) {
    out[k] = SENSITIVE.some(s => k.toLowerCase().includes(s)) ? '***' : v
  }
  return out
}

// ---------------------------------------------------------------------------
// 落本地磁盘：服务端直接写 logs/app-<date>.log；客户端批量回传到 /api/__log 落盘。
// 失败一律静默，绝不影响主流程。
// ---------------------------------------------------------------------------
async function persistOnServer(entry: LogEntry): Promise<void> {
  try {
    const { appendFile, mkdir } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const dir = join(process.cwd(), 'logs')
    await mkdir(dir, { recursive: true })
    await appendFile(join(dir, `app-${entry.time.slice(0, 10)}.log`), JSON.stringify(entry) + '\n', 'utf8')
  } catch {
    // 落盘失败不影响主流程
  }
}

let clientQueue: LogEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | undefined
let exitBound = false

function flushClientQueue(): void {
  flushTimer = undefined
  if (!clientQueue.length) return
  const payload = JSON.stringify(clientQueue)
  clientQueue = []
  try {
    if (navigator.sendBeacon?.('/api/__log', new Blob([payload], { type: 'application/json' }))) return
  } catch {
    // 退回 fetch
  }
  fetch('/api/__log', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {})
}

function queueForDisk(entry: LogEntry): void {
  if (!exitBound && typeof window !== 'undefined') {
    exitBound = true
    window.addEventListener('pagehide', flushClientQueue)
    window.addEventListener('beforeunload', flushClientQueue)
  }
  clientQueue.push(entry)
  if (clientQueue.length >= 20) flushClientQueue()
  else if (!flushTimer) flushTimer = setTimeout(flushClientQueue, 2000)
}

export function useLogger(module: string) {
  const minLevel: LogLevel = import.meta.dev ? 'debug' : 'info'

  function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return
    const entry: LogEntry = {
      time: new Date().toISOString(),
      level,
      module,
      message,
      context: sanitize(context),
    }
    push(entry)

    if (import.meta.client) {
      const style = level === 'error'
        ? 'color:#fff;background:#ef4444;padding:1px 5px;border-radius:3px'
        : level === 'warn'
          ? 'color:#000;background:#f59e0b;padding:1px 5px;border-radius:3px'
          : 'color:#fff;background:#6366f1;padding:1px 5px;border-radius:3px'
      const method = level === 'debug' ? 'log' : level
      // eslint-disable-next-line no-console
      console[method](`%c${level.toUpperCase()}%c ${module} · ${message}`, style, 'color:inherit', context ?? '')
      // 回传服务端落本地磁盘（批量、best-effort）
      queueForDisk(entry)
    } else {
      // 服务端输出结构化 JSON，便于检索
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry))
      // 直接落本地磁盘 logs/app-<date>.log
      void persistOnServer(entry)
    }
  }

  return {
    debug: (m: string, c?: Record<string, unknown>) => log('debug', m, c),
    info: (m: string, c?: Record<string, unknown>) => log('info', m, c),
    warn: (m: string, c?: Record<string, unknown>) => log('warn', m, c),
    error: (m: string, c?: Record<string, unknown>) => log('error', m, c),
  }
}

/** 获取最近日志（供调试面板 / 一键复制诊断使用） */
export function getLogBuffer(): LogEntry[] {
  return [...buffer]
}

/** 清空日志缓冲 */
export function clearLogBuffer(): void {
  buffer.length = 0
}
