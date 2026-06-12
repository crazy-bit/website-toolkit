#!/usr/bin/env node
/**
 * 项目体检：收集环境与配置信息，输出可直接复制给 AI 的报告。
 * 用法：npm run doctor
 */
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function safe(fn, fallback = null) {
  try { return fn() } catch { return fallback }
}

const cwd = process.cwd()
const out = {
  time: new Date().toISOString(),
  os: `${process.platform} ${process.arch}`,
  node: process.version,
  npm: safe(() => execSync('npm -v').toString().trim()),
}

if (existsSync(resolve(cwd, 'package.json'))) {
  const pkg = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'))
  out.project = pkg.name
  out.dependencies = pkg.dependencies
  out.devDependencies = pkg.devDependencies
  out.scripts = pkg.scripts
}

out.files = {
  'AGENTS.md': existsSync(resolve(cwd, 'AGENTS.md')),
  'error.vue': existsSync(resolve(cwd, 'error.vue')),
  'composables/useLogger.ts': existsSync(resolve(cwd, 'composables/useLogger.ts')),
  'composables/useApi.ts': existsSync(resolve(cwd, 'composables/useApi.ts')),
  'nuxt.config.ts': existsSync(resolve(cwd, 'nuxt.config.ts')),
  'tests/': existsSync(resolve(cwd, 'tests')),
  'node_modules/': existsSync(resolve(cwd, 'node_modules')),
}

console.log('===== 项目体检报告（可整段复制给 AI）=====')
console.log(JSON.stringify(out, null, 2))
console.log('==========================================')
