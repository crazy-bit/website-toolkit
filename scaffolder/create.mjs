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

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, 'templates')
const NAME_TOKEN = '__PROJECT_NAME__'

const LEVEL_LAYERS = {
  minimal: ['base'],
  standard: ['base', 'standard'],
  full: ['base', 'standard', 'full'],
}

const TEXT_EXT = new Set([
  '.ts', '.js', '.mjs', '.cjs', '.vue', '.json', '.css', '.md',
  '.html', '.txt', '.yml', '.yaml',
])
const TEXT_NAMES = new Set(['_gitignore', '_cursorrules', '_env', 'AGENTS.md', 'CLAUDE.md'])
const UNMASK = { _gitignore: '.gitignore', _cursorrules: '.cursorrules', _env: '.env' }

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

function parseArgs(argv) {
  const opts = { target: null, level: 'standard', name: null, force: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--force' || a === '-f') opts.force = true
    else if (a === '--level' || a === '-l') opts.level = argv[++i]
    else if (a === '--name' || a === '-n') opts.name = argv[++i]
    else if (a === '--help' || a === '-h') opts.help = true
    else if (!a.startsWith('-') && !opts.target) opts.target = a
  }
  return opts
}

function printHelp() {
  console.log(`
create-ai-web —— 将目录初始化为符合《AI 建站工具方案》规范的 Nuxt 3 项目

用法:
  npm create ai-web@latest <目标目录> -- [--level <级别>] [--name <名字>] [--force]
  npx create-ai-web <目标目录> [--level <级别>] [--name <名字>] [--force]

参数:
  --level, -l   minimal | standard | full   (默认 standard)
  --name,  -n   项目名 (默认取目标目录名)
  --force, -f   目标目录非空时仍继续并覆盖同名文件
`)
}

async function prompt() {
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const target = (await rl.question('项目目录名 (默认 my-site): ')).trim() || 'my-site'
    const lv = (await rl.question('级别 minimal/standard/full (默认 standard): ')).trim() || 'standard'
    return { target, level: LEVEL_LAYERS[lv] ? lv : 'standard', name: null, force: false }
  } finally {
    rl.close()
  }
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
  if (!existsSync(TEMPLATES_DIR)) {
    errOut(`找不到模板目录：${TEMPLATES_DIR}`)
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
  console.log()

  let total = 0
  for (const layer of LEVEL_LAYERS[opts.level]) {
    const n = await copyLayer(layer, target, name)
    total += n
    ok(`应用模板层 ${C('1', layer)}：${n} 个文件`)
  }
  await writeFile(join(target, 'package.json'), buildPackageJson(name, opts.level), 'utf8')
  ok('生成 package.json（按级别裁剪依赖与脚本）')

  console.log()
  ok(`完成！共写入 ${total + 1} 个文件`)

  console.log(`\n${C('1', '下一步：')}`)
  let cd
  try {
    cd = relative(process.cwd(), target) || '.'
  } catch {
    cd = target
  }
  console.log(`  cd ${cd}`)
  console.log('  npm install')
  if (opts.level === 'full') console.log('  npx playwright install   # 首次安装浏览器')
  console.log('  npm run dev')
  console.log(`\n${C('1', '之后用 AI 开发时：')}`)
  console.log('  · 根目录 AGENTS.md / .cursorrules 会让 AI 自动遵循规范')
  console.log('  · 新建页面：npm run new:page <名字>')
  console.log('  · 改完检查：npm run check')
  if (opts.level !== 'minimal') console.log('  · 出问题：npm run doctor，或在错误页点【复制诊断信息】')
  console.log()
}

main().catch((e) => {
  errOut(String(e?.stack || e))
  process.exitCode = 1
})
