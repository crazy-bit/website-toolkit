import { test, expect } from '@playwright/test'

test('首页能正常打开且无控制台错误', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', e => errors.push(String(e)))

  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
  await expect(page).toHaveTitle(/.+/)
  expect(errors, `控制台错误：\n${errors.join('\n')}`).toHaveLength(0)
})
