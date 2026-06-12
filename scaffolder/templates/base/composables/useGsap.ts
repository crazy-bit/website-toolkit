/**
 * GSAP 动画 composable
 * 全站动画统一通过此处调用，禁止在组件内散落实现。
 */
import gsap from 'gsap'

export function useGsap() {
  /** 元素入场（带 stagger 批量） */
  function animateStagger(selector: string, options?: {
    y?: number
    duration?: number
    stagger?: number
    delay?: number
  }) {
    const { y = 20, duration = 0.6, stagger = 0.08, delay = 0 } = options || {}
    nextTick(() => {
      gsap.fromTo(
        selector,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration, stagger, delay, ease: 'power2.out' },
      )
    })
  }

  /** 单个元素入场 */
  function animateIn(el: Element | string, options?: {
    y?: number
    x?: number
    scale?: number
    duration?: number
    delay?: number
  }) {
    const { y = 0, x = 0, scale = 1, duration = 0.5, delay = 0 } = options || {}
    nextTick(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y, x, scale: scale === 1 ? 0.95 : scale },
        { opacity: 1, y: 0, x: 0, scale: 1, duration, delay, ease: 'power2.out' },
      )
    })
  }

  /** 数字滚动动画 */
  function animateCounter(el: Element | string, endValue: number, options?: {
    duration?: number
    delay?: number
  }) {
    const { duration = 1.5, delay = 0.2 } = options || {}
    nextTick(() => {
      const obj = { value: 0 }
      gsap.to(obj, {
        value: endValue,
        duration,
        delay,
        ease: 'power2.out',
        onUpdate() {
          const target = typeof el === 'string' ? document.querySelector(el) : el
          if (target) target.textContent = Math.round(obj.value).toString()
        },
      })
    })
  }

  return { gsap, animateStagger, animateIn, animateCounter }
}
