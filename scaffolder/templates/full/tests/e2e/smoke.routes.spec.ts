/**
 * 路由冒烟测试（核心安全网）：
 * 自动遍历 pages/ 下所有路由，逐一断言"能打开 + 无 JS 报错 + 非白屏"。
 * 新增页面零成本获得基础保护。
 */
import { test, expect } from '@playwright/test'
import fg from 'fast-glob'
import { resolve } from 'node:path'

function discoverRoutes(): string[] {
  const root = resolve(__dirname, '../..')
  const files = fg.sync('pages/**/*.vue', { cwd: root })
  const routes = files.map((f) => {
    let r = f
      .replace(/^pages\//, '')
      .replace(/\.vue$/, '')
      .replace(/index$/, '')
      .replace(/\[\.\.\.\w+\]/g, 'catch-all') // [...slug]
      .replace(/\[(\w+)\]/g, 'sample')        // [id] -> sample
    r = '/' + r
    r = r.replace(/\/+$/, '') || '/'
    return r
  })
  return Array.from(new Set(routes))
}

const routes = discoverRoutes()

test.describe('路由冒烟', () => {
  for (const route of routes) {
    test(`${route} 能正常打开`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', e => errors.push(String(e)))
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text())
      })

      const resp = await page.goto(route, { waitUntil: 'networkidle' })
      expect(resp?.status() ?? 0, `${route} HTTP 状态`).toBeLessThan(400)
      await expect(page.locator('body')).toBeVisible()

      const text = (await page.locator('body').innerText()).trim()
      expect(text.length, `${route} 疑似白屏`).toBeGreaterThan(0)

      expect(errors, `${route} 报错：\n${errors.join('\n')}`).toHaveLength(0)
    })
  }
})

/*
 * 单页模式（仅 pages/index.vue + 视图状态切换）补充冒烟：
 * 上面的路由遍历只会测到 '/'，无法覆盖内部视图。若你的项目是单页模式
 * （把视图同步到 URL，如 #view=xxx 或 ?view=xxx），请把视图列表填到 VIEWS
 * 并启用下面的测试，逐个视图断言"无报错、非白屏"。
 *
 * const VIEWS = ['overview', 'calendar', 'detail', 'stats']
 * test.describe('单页视图冒烟', () => {
 *   for (const view of VIEWS) {
 *     test(`视图 ${view} 正常`, async ({ page }) => {
 *       const errors: string[] = []
 *       page.on('pageerror', e => errors.push(String(e)))
 *       page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
 *       await page.goto(`/#view=${view}`, { waitUntil: 'networkidle' })
 *       await expect(page.locator('body')).toBeVisible()
 *       expect(errors, `${view} 报错：\n${errors.join('\n')}`).toHaveLength(0)
 *     })
 *   }
 * })
 */
