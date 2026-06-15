# website-toolkit · 面向非程序人员的 AI 建站工具

> 一套**让 AI 在护栏内工作、并能自动获得反馈**的工程化脚手架（Guardrails + Feedback Loop for AI Coding）。

很多没有技术背景的人用 AI 直接生成网站，单页阶段体验很好，但页面一多就**代码混乱、调试困难、错误频出**。
本工具用一条命令把目录初始化为规范化的 Nuxt 3 项目，之后你在该目录里用 AI 开发，就会**自动遵循统一架构、日志、测试与调试规范**。

## 四大支柱

```
统一架构  ──►  约束 AI 怎么写        Nuxt 3 + Nuxt UI + GSAP + Lenis + Iconify + TS
日志系统  ──►  出错时看得见           useLogger + 全局错误捕获 + 结构化日志
测试体系  ──►  自动验证不破坏功能      Vitest + Playwright + 路由冒烟 + ESLint
调试能力  ──►  快速定位并修复          友好错误页 + 调试面板 + 一键诊断
      ＋ 贯穿主线：AI 协作规范（AGENTS.md）+ 一键命令

  描述需求 → AI 写代码+测试 → npm run check → 红灯则看日志自修复 → 绿灯
```

## 快速开始

脚手架工具在 [`scaffolder/`](./scaffolder)，提供两套**功能完全等价**的 CLI，任选其一。

### 方式 A：Windows 一键（最省事）

双击运行 [`scaffolder/init-standard.bat`](./scaffolder/init-standard.bat)，按提示输入项目名即可（固定 `standard` 级别，自动选用 Node，无则回退 Python）。项目会生成在该脚本所在的当前目录下。

### 方式 B：Node 版（推荐，只需 Node）

```bash
# 交互式（询问目录与级别）
npx create-ai-web

# 指定参数
npx create-ai-web my-site --level full --name my-site

# 本地未发布时，在 scaffolder/ 目录直接运行：
node scaffolder/create.mjs my-site --level full
```

### 方式 C：Python 版

```bash
python scaffolder/init_site.py my-site --level standard --name my-site
```

### 初始化后

```bash
cd my-site
npm install
# full 级别首次需安装浏览器：npx playwright install
npm run dev
```

## 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `<目标目录>` | 不存在会自动创建 | 必填（Node 版可交互输入） |
| `--level` / `-l` | 模板级别 `minimal` / `standard` / `full` | `standard` |
| `--name` / `-n` | 项目名（写入 package.json / 页面标题） | 目标目录名 |
| `--force` / `-f` | 目标目录非空时仍继续并覆盖同名文件 | 关闭 |

## 模板级别（累加）

| 级别 | 包含 | 适用 |
|------|------|------|
| `minimal` | 统一架构 + `AGENTS.md` 规则 + 页面生成器 | 快速 Demo |
| `standard` | + 日志系统（`useLogger`）+ 友好错误页 + 调试面板 + `doctor` | 日常建站（**推荐**） |
| `full` | + Vitest 单测 + Playwright E2E + 路由冒烟 + **ESLint 机器兜底** + CI | 长期维护的正式站点 |

## 生成项目里的常用命令

| 想做的事 | 命令 |
|----------|------|
| 启动开发 | `npm run dev` |
| 新建页面 | `npm run new:page <名字>` |
| 改完检查 | `npm run check`（full：lint + 类型 + 单测 + 路由冒烟） |
| 出问题诊断 | `npm run doctor`，或在错误页点【复制诊断信息】粘贴给 AI |

## 为什么能让 AI 不写乱

- **AGENTS.md / .cursorrules / CLAUDE.md**：把技术栈、目录约定、命名规范、"必须/禁止"清单写死，每次 AI 对话自动遵守。
- **ESLint 机器兜底**（full）：自动拦截"裸 `console.log`""空 `catch` 吞错误""组件内直接 `fetch`"等反模式，不靠人工 review。
- **路由冒烟测试**：自动遍历所有页面，断言"能打开、无报错、非白屏"，新增页面零成本获得保护。
- **统一日志 + 友好错误页**：出错时一键复制诊断信息交给 AI，闭环修复。

## 目录结构

```
website-toolkit/
├── README.md          本文件
├── docs/              完整方案设计文档（可行性分析 + 四大支柱 + 反向校验）
└── scaffolder/        脚手架工具
    ├── create.mjs     Node 版 CLI（npx create-ai-web）
    ├── init_site.py   Python 版 CLI
    ├── package.json   create-ai-web npm 包清单
    └── templates/     分级模板（base / standard / full）
```

## 文档

完整方案设计与原理见 [`docs/`](./docs)：可行性分析、统一架构规范、日志系统、测试体系、调试能力，以及一份用真实项目检验方案的反向校验报告。

## License

MIT
