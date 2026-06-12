/**
 * Lenis 平滑滚动 composable
 * 在 app.vue 的 onMounted 中调用 init()，onBeforeUnmount 中 destroy()。
 */
import Lenis from 'lenis'

let lenis: Lenis | null = null
let rafId = 0

export function useLenis() {
  function init() {
    if (import.meta.server || lenis) return
    lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    const raf = (time: number) => {
      lenis?.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId)
    lenis?.destroy()
    lenis = null
    rafId = 0
  }

  function scrollTo(target: string | number | HTMLElement, opts?: Record<string, unknown>) {
    lenis?.scrollTo(target, opts)
  }

  return { init, destroy, scrollTo }
}
