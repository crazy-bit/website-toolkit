#!/usr/bin/env node
/**
 * create-ai-web —— AI 建站工具脚手架（Node 版，可 npx 直接运行）
 *
 *   npm create ai-web@latest <目标目录> [-- --level full --name my-site]
 *   npx create-ai-web <目标目录> [--level minimal|standard|full] [--name 名字] [--force]
 *
 * 无参数运行时进入交互式问答。功能与 init_site.py 完全一致。
 */
import { cp, mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve, relative, basename, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, 'templates')
const NAME_TOKEN = '__PROJECT_NAME__'

const LEVEL_LAYERS = {
  minimal: ['base'],
  standard: ['base', 'standard'],
  full: ['base', 'standard', 'full'],
}

// Agent 工具预设：决定「默认加载的入口文件」与「AI(skill/rule)存放目录」
const AGENT_PRESETS = {
  codebuddy: { entry: 'CODEBUDDY.md', aiDir: '.codebuddy', label: 'CodeBuddy' },
  'claude-code': { entry: 'CLAUDE.md', aiDir: '.claude', label: 'Claude Code' },
  'claude-internal': { entry: 'CLAUDE.md', aiDir: '.claude', label: 'Claude' },
  workbuddy: { entry: 'CODEBUDDY.md', aiDir: '.codebuddy', label: 'WorkBuddy' },
}
const AGENT_CHOICES = [...Object.keys(AGENT_PRESETS), 'other']

const TEXT_EXT = new Set([
  '.ts', '.js', '.mjs', '.cjs', '.vue', '.json', '.css', '.md',
  '.html', '.txt', '.yml', '.yaml',
])
const TEXT_NAMES = new Set(['_gitignore', '_env', 'AGENTS.md'])
const UNMASK = { _gitignore: '.gitignore', _env: '.env' }

const BASE_DEPS = {
  '@iconify-json/lucide': '^1.2.30',
  '@iconify-json/mdi': '^1.2.2',
  '@nuxt/ui': '^3.0.0',
  gsap: '^3.12.7',
  lenis: '^1.2.3',
  nuxt: '^3.16.0',
  vue: '^3.5.13',
  'vue-router': '^4.5.0',
}
const BASE_DEV_DEPS = {
  '@iconify/vue': '^4.3.0',
  '@nuxtjs/color-mode': '^3.5.2',
  '@types/node': '^22.10.0',
  typescript: '^5.7.0',
  'vue-tsc': '^2.2.0',
}
const FULL_DEV_DEPS = {
  vitest: '^3.0.0',
  '@nuxt/test-utils': '^3.15.0',
  '@vue/test-utils': '^2.4.6',
  'happy-dom': '^16.0.0',
  '@playwright/test': '^1.50.0',
  'fast-glob': '^3.3.3',
  eslint: '^9.0.0',
  '@nuxt/eslint': '^1.0.0',
}

// ---- 输出 ----
const C = (code, t) => (stdout.isTTY ? `\x1b[${code}m${t}\x1b[0m` : t)
const info = m => console.log(`${C('36', '›')} ${m}`)
const ok = m => console.log(`${C('32', '✓')} ${m}`)
const errOut = m => console.error(`${C('31', '✗')} ${m}`)

function sortObj(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
}

function buildPackageJson(name, level) {
  const scripts = {
    dev: 'nuxt dev',
    build: 'nuxt build',
    generate: 'nuxt generate',
    preview: 'nuxt preview',
    postinstall: 'nuxt prepare',
    typecheck: 'nuxt typecheck',
    'new:page': 'node scripts/new-page.mjs',
  }
  const devDeps = { ...BASE_DEV_DEPS }

  if (level === 'standard' || level === 'full') scripts.doctor = 'node scripts/doctor.mjs'

  if (level === 'full') {
    Object.assign(devDeps, FULL_DEV_DEPS)
    Object.assign(scripts, {
      lint: 'eslint .',
      'lint:fix': 'eslint . --fix',
      'test:unit': 'vitest run',
      'test:e2e': 'playwright test',
      'test:smoke': 'playwright test tests/e2e/smoke.routes.spec.ts',
      check: 'npm run lint && nuxt typecheck && vitest run && playwright test tests/e2e/smoke.routes.spec.ts',
    })
  } else {
    scripts.check = 'nuxt typecheck'
  }

  const pkg = {
    name,
    private: true,
    type: 'module',
    scripts: sortObj(scripts),
    dependencies: sortObj(BASE_DEPS),
    devDependencies: sortObj(devDeps),
  }
  return JSON.stringify(pkg, null, 2) + '\n'
}

function isTextFile(name) {
  const dot = name.lastIndexOf('.')
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : ''
  return TEXT_EXT.has(ext) || TEXT_NAMES.has(name)
}

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else out.push(full)
  }
  return out
}

async function copyLayer(layer, target, name) {
  const root = join(TEMPLATES_DIR, layer)
  if (!existsSync(root)) return 0
  let count = 0
  for (const src of await walk(root)) {
    const relParts = relative(root, src).split(sep).map(p => UNMASK[p] ?? p)
    const dst = join(target, ...relParts)
    await mkdir(dirname(dst), { recursive: true })
    if (isTextFile(basename(src))) {
      const content = (await readFile(src, 'utf8')).split(NAME_TOKEN).join(name)
      await writeFile(dst, content, 'utf8')
    } else {
      await cp(src, dst)
    }
    count++
  }
  return count
}

function normalizeName(raw) {
  let n = String(raw).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  n = n.replace(/^[-._]+|[-._]+$/g, '')
  return n || 'my-site'
}

// ---- Agent 入口文件 / AI 目录 ----
function resolveAgent(agent, entry, aiDir) {
  const preset = AGENT_PRESETS[agent]
  if (preset) {
    return { entry: entry || preset.entry, aiDir: aiDir || preset.aiDir, label: preset.label }
  }
  // other：必须显式指定
  if (!entry || !aiDir) {
    throw new Error('agent=other 时必须同时提供 --entry 与 --ai-dir（如 --entry MYTOOL.md --ai-dir .mytool）')
  }
  const stem = basename(entry).replace(/\.[^.]+$/, '') || 'AI'
  return { entry, aiDir, label: stem }
}

function buildEntryFile(label) {
  return `# ${label} / AI 助手入口规则

> 本文件是 ${label} 默认加载的项目规则入口。
> 完整 AI 协作规范见根目录 \`AGENTS.md\`，请严格遵守其中的技术栈、目录约定、
> 命名规范、日志规范、测试工作流等全部要求。

简述：Nuxt 3 + Nuxt UI 3 + Tailwind + GSAP + Lenis + Iconify + TypeScript。
新页面放 pages/；逻辑放 composables/；请求走 useApi.ts；日志用 useLogger；
禁止裸 console.log / 组件内直接 fetch / 新增同类库。改完跑 npm run check。
`
}

function buildAiDirRule(label) {
  return `# 项目规则（rule）

本目录用于存放 ${label} 的技能（skill）与规则（rule）。
项目的完整 AI 协作规范见根目录 \`AGENTS.md\`，新增规则 / 技能请放在本目录下，
并保持与 \`AGENTS.md\` 一致，不要与其冲突。
`
}

async function writeAgentFiles(target, entry, aiDir, label) {
  await writeFile(join(target, entry), buildEntryFile(label), 'utf8')
  const rulesDir = join(target, aiDir, 'rules')
  await mkdir(rulesDir, { recursive: true })
  await writeFile(join(rulesDir, 'project.md'), buildAiDirRule(label), 'utf8')
  return 2
}

function parseArgs(argv) {
  const opts = { target: null, level: 'standard', name: null, force: false, agent: 'codebuddy', entry: null, aiDir: null, install: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--force' || a === '-f') opts.force = true
    else if (a === '--install') opts.install = true
    else if (a === '--level' || a === '-l') opts.level = argv[++i]
    else if (a === '--name' || a === '-n') opts.name = argv[++i]
    else if (a === '--agent' || a === '-a') opts.agent = argv[++i]
    else if (a === '--entry') opts.entry = argv[++i]
    else if (a === '--ai-dir') opts.aiDir = argv[++i]
    else if (a === '--help' || a === '-h') opts.help = true
    else if (!a.startsWith('-') && !opts.target) opts.target = a
  }
  return opts
}

function printHelp() {
  console.log(`
create-ai-web —— 将目录初始化为符合《AI 建站工具方案》规范的 Nuxt 3 项目

用法:
  npm create ai-web@latest <目标目录> -- [--level <级别>] [--name <名字>] [--agent <agent>] [--force]
  npx create-ai-web <目标目录> [--level <级别>] [--name <名字>] [--agent <agent>] [--force]

参数:
  --level, -l   minimal | standard | full   (默认 standard)
  --name,  -n   项目名 (默认取目标目录名)
  --agent, -a   codebuddy | claude-code | claude-internal | workbuddy | other  (默认 codebuddy)
                决定默认加载的入口文件与 AI(skill/rule) 目录：
                  codebuddy/workbuddy → CODEBUDDY.md + .codebuddy/
                  claude-code/claude-internal → CLAUDE.md + .claude/
  --entry       自定义入口文件名 (agent=other 时必填)
  --ai-dir      自定义 AI 目录 (agent=other 时必填)
  --install     生成后自动 npm install（禁用 Nuxt 遥测，不启动 dev）
  --force, -f   目标目录非空时仍继续并覆盖同名文件
`)
}

async function prompt() {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const target = (await rl.question('项目目录名 (默认 my-site): ')).trim() || 'my-site'
    const lv = (await rl.question('级别 minimal/standard/full (默认 full): ')).trim() || 'full'
    const ag = (await rl.question('Agent codebuddy/claude-code/claude-internal/workbuddy/other (默认 codebuddy): ')).trim() || 'codebuddy'
    const out = { target, level: LEVEL_LAYERS[lv] ? lv : 'full', name: null, force: false, agent: AGENT_CHOICES.includes(ag) ? ag : 'codebuddy', entry: null, aiDir: null }
    if (out.agent === 'other') {
      out.entry = (await rl.question('默认加载的入口文件名 (如 MYTOOL.md): ')).trim() || null
      out.aiDir = (await rl.question('AI(skill/rule) 存放目录 (如 .mytool): ')).trim() || null
    }
    return out
  } finally {
    rl.close()
  }
}

// 在 target 目录执行 npm install（禁用 Nuxt 遥测，避免"是否参与"交互）
function runNpmInstall(target) {
  return new Promise((resolveInstall) => {
    const child = spawn('npm', ['install'], {
      cwd: target,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
    })
    child.on('close', code => resolveInstall(code === 0))
    child.on('error', () => resolveInstall(false))
  })
}

async function isNonEmptyDir(p) {
  try {
    const s = await stat(p)
    if (!s.isDirectory()) return true
    return (await readdir(p)).length > 0
  } catch {
    return false
  }
}

async function main() {
  let opts = parseArgs(process.argv.slice(2))
  if (opts.help) return printHelp()
  if (!opts.target) opts = { ...opts, ...(await prompt()) }

  if (!LEVEL_LAYERS[opts.level]) {
    errOut(`未知级别：${opts.level}（可选 minimal/standard/full）`)
    process.exitCode = 1
    return
  }
  if (!AGENT_CHOICES.includes(opts.agent)) {
    errOut(`未知 agent：${opts.agent}（可选 ${AGENT_CHOICES.join('/')}）`)
    process.exitCode = 1
    return
  }
  if (!existsSync(TEMPLATES_DIR)) {
    errOut(`找不到模板目录：${TEMPLATES_DIR}`)
    process.exitCode = 1
    return
  }

  let agentInfo
  try {
    agentInfo = resolveAgent(opts.agent, opts.entry, opts.aiDir)
  } catch (e) {
    errOut(String(e?.message || e))
    process.exitCode = 1
    return
  }

  const target = resolve(process.cwd(), opts.target)
  const name = normalizeName(opts.name || basename(target))

  if (await isNonEmptyDir(target) && !opts.force) {
    errOut(`目标目录非空：${target}`)
    errOut('如需在已有目录初始化，请加 --force（会覆盖同名文件）')
    process.exitCode = 1
    return
  }
  await mkdir(target, { recursive: true })

  info(`初始化项目：${C('1', name)}`)
  info(`目标目录：${target}`)
  info(`级别：${C('1', opts.level)}（${LEVEL_LAYERS[opts.level].join('+')}）`)
  info(`Agent：${C('1', agentInfo.label)}（入口 ${agentInfo.entry} / AI 目录 ${agentInfo.aiDir}）`)
  console.log()

  let total = 0
  for (const layer of LEVEL_LAYERS[opts.level]) {
    const n = await copyLayer(layer, target, name)
    total += n
    ok(`应用模板层 ${C('1', layer)}：${n} 个文件`)
  }
  total += await writeAgentFiles(target, agentInfo.entry, agentInfo.aiDir, agentInfo.label)
  ok(`生成 agent 入口 ${C('1', agentInfo.entry)} 与 AI 目录 ${C('1', agentInfo.aiDir + '/')}`)
  await writeFile(join(target, 'package.json'), buildPackageJson(name, opts.level), 'utf8')
  ok('生成 package.json（按级别裁剪依赖与脚本）')

  console.log()
  ok(`完成！共写入 ${total + 1} 个文件`)

  let cd
  try {
    cd = relative(process.cwd(), target) || '.'
  } catch {
    cd = target
  }

  // 自动安装依赖（--install）：禁用遥测、不启动 dev
  let installed = false
  if (opts.install) {
    console.log(`\n${C('1', '正在安装依赖（首次较慢，请耐心等待）...')}`)
    installed = await runNpmInstall(target)
    if (installed) ok('依赖安装完成')
    else errOut('依赖安装失败，请稍后手动进入目录执行 npm install')
  }

  console.log(`\n${C('1', '下一步：')}`)
  console.log(`  cd ${cd}`)
  if (!installed) console.log('  npm install')
  if (opts.level === 'full') console.log('  npx playwright install   # 首次安装浏览器（如需 E2E 测试）')
  console.log('  npm run dev              # 启动开发服务器 http://localhost:3000')
  console.log(`\n${C('1', '之后用 AI 开发时：')}`)
  console.log(`  · 根目录 ${agentInfo.entry} / AGENTS.md 会让 AI 自动遵循规范`)
  console.log('  · 新建页面：npm run new:page <名字>')
  console.log('  · 改完检查：npm run check')
  if (opts.level !== 'minimal') console.log('  · 出问题：npm run doctor，或在错误页点【复制诊断信息】')
  console.log()
}

main().catch((e) => {
  errOut(String(e?.stack || e))
  process.exitCode = 1
})
