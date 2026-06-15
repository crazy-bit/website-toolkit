#!/usr/bin/env node
/**
 * 页面生成器：按规范在 pages/ 下创建一个新页面。
 * 用法：npm run new:page <名字>
 * 例：  npm run new:page about        → pages/about.vue   (/about)
 *       npm run new:page blog/index   → pages/blog/index.vue (/blog)
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const raw = process.argv[2]
if (!raw) {
  console.error('用法：npm run new:page <名字>，例如 npm run new:page about')
  process.exit(1)
}

// 规范化为小写中划线路径
const name = raw
  .replace(/\.vue$/, '')
  .split('/')
  .map(s => s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''))
  .filter(Boolean)
  .join('/')

const filePath = resolve(process.cwd(), 'pages', `${name}.vue`)
if (existsSync(filePath)) {
  console.error(`页面已存在：pages/${name}.vue`)
  process.exit(1)
}

const route = '/' + name.replace(/index$/, '').replace(/\/$/, '')
const title = (name.split('/').pop() || 'page').replace(/-/g, ' ')

// standard 级别以上才有 useLogger，没有时不生成日志相关代码（避免死引用）
const hasLogger = existsSync(resolve(process.cwd(), 'composables', 'useLogger.ts'))

const loggerBlock = `const log = useLogger('page:${name}')

onMounted(() => {
  log.info('页面已加载')
})
`

const tpl = `<script setup lang="ts">
// 路由：${route || '/'}
${hasLogger ? loggerBlock : ''}</script>

<template>
  <div>
    <h1 class="text-2xl font-bold capitalize">${title}</h1>
    <p class="mt-2 text-gray-500 dark:text-gray-400">这是新建的页面，开始编辑吧。</p>
  </div>
</template>
`

mkdirSync(dirname(filePath), { recursive: true })
writeFileSync(filePath, tpl, 'utf8')

console.log(`✓ 已创建 pages/${name}.vue  →  访问 ${route || '/'}`)
console.log('  路由冒烟测试会自动覆盖该页面（full 级别）。')
