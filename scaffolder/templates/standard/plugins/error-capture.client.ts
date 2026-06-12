/**
 * 客户端全局错误自动捕获：Vue 渲染错误 / 未捕获错误 / 未处理的 Promise rejection
 * 全部记入统一日志，供调试面板与"复制诊断信息"使用。
 */
export default defineNuxtPlugin((nuxtApp) => {
  const log = useLogger('global')

  nuxtApp.vueApp.config.errorHandler = (err, _instance, info) => {
    log.error('Vue 渲染错误', { error: String(err), info })
  }

  if (import.meta.client) {
    window.addEventListener('error', (e) => {
      log.error('未捕获错误', {
        message: e.message,
        source: e.filename,
        line: e.lineno,
        col: e.colno,
      })
    })

    window.addEventListener('unhandledrejection', (e) => {
      log.error('未处理的 Promise 异常', { reason: String(e.reason) })
    })
  }
})
