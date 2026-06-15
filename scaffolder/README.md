# AI 建站脚手架工具（create-ai-web）

把任意目录一键初始化为符合《AI 建站工具方案》规范的 Nuxt 3 项目骨架。
非程序人员在生成的目录里用 AI 开发，即自动遵循统一架构 / 日志 / 测试 / 调试规范。

> 完整方案设计见仓库 `docs/`。

提供两套**功能完全等价**的 CLI，二选一即可：

| CLI | 命令 | 适合 |
|-----|------|------|
| **Windows 一键** | 双击 `init.bat` | 最省事，输入项目名并选择级别 |
| **Node 版（推荐）** | `npx create-ai-web` | 只需 Node，无需 Python；可发布到 npm 直接 `npm create` |
| Python 版 | `python init_site.py` | 已装 Python 的环境 |

## 用法 A：Windows 一键脚本

双击 `init.bat`：脚本本身是一个纯 ASCII 瘦启动器（避免中文批处理在 `chcp 65001` 下的解析 bug），它会调用 Node 版 CLI 完成全部中文交互——依次询问项目名、级别（回车默认 full）、AI agent（回车默认 codebuddy），随后**自动 `npm install`**（已禁用 Nuxt 遥测，不会自动启动 dev）。未安装 Node 时回退到 Python 版仅做项目生成。

## 用法 B：Node 版（npx / npm create）

```bash
# 交互式（无参数时会询问目录与级别）
npx create-ai-web

# 指定参数
npx create-ai-web my-site --level full --name my-site

# 发布到 npm 后还可用 npm create：
npm create ai-web@latest my-site -- --level standard
```

> 本地未发布时，可在 `scaffolder/` 目录直接运行：`node create.mjs my-site --level full`。

## 用法 C：Python 版

```bash
python init_site.py <目标目录> [--level minimal|standard|full] [--name 项目名] [--force]
```

环境要求：Python 3.8+（生成的项目运行需 Node.js 18+）。

### 参数（两版一致）

| 参数 | 说明 | 默认 |
|------|------|------|
| `target`（位置参数） | 目标目录，不存在会自动创建 | 必填 |
| `--level` / `-l` | 模板级别（见下） | `standard` |
| `--name` / `-n` | 项目名（写入 package.json / 页面标题） | 目标目录名 |
| `--agent` / `-a` | 使用的 AI agent 工具（见下） | `codebuddy` |
| `--entry` | 自定义入口文件名（`--agent other` 时必填） | 按 agent 预设 |
| `--ai-dir` | 自定义 AI(skill/rule) 目录（`--agent other` 时必填） | 按 agent 预设 |
| `--force` / `-f` | 目标目录非空时仍继续并覆盖同名文件 | 关闭 |

### Agent 工具（决定入口文件与 AI 目录）

初始化会按所选 agent 生成对应的**默认加载入口文件**与 **AI(skill/rule) 存放目录**，
完整规范始终写在根目录 `AGENTS.md`，入口文件与 AI 目录下的规则均指向它。

| `--agent` | 默认加载入口文件 | AI(skill/rule) 目录 |
|-----------|------------------|---------------------|
| `codebuddy`（默认） | `CODEBUDDY.md` | `.codebuddy/` |
| `claude-code` | `CLAUDE.md` | `.claude/` |
| `claude-internal` | `CLAUDE.md` | `.claude/` |
| `workbuddy` | `CODEBUDDY.md` | `.codebuddy/` |
| `other` | 由 `--entry` 指定 | 由 `--ai-dir` 指定 |

> Windows 一键脚本（`init.bat`）与 Node 版交互模式都会在问答中让你选择 agent；
> 选 `other` 时会进一步询问入口文件名与 AI 目录。

### 模板级别（累加）

| 级别 | 包含 | 适用 |
|------|------|------|
| `minimal` | 统一架构 + `AGENTS.md` 规则 + 页面生成器 | 快速 Demo |
| `standard` | + 日志系统（`useLogger`）+ 友好错误页 + 调试面板 + `doctor` | 日常建站（**推荐**） |
| `full` | + Vitest 单测 + Playwright E2E + 路由冒烟 + **ESLint 机器兜底** + CI | 长期维护的正式站点 |

## 示例

```bash
# Node 版：在当前目录下创建 my-site（standard 级别）
npx create-ai-web my-site

# 全功能 + 指定项目名
npx create-ai-web my-site --level full --name my-cool-site

# Python 版：在已有（非空）目录就地初始化
python init_site.py . --level standard --force
```

## 初始化后

```bash
cd <目标目录>
npm install
# full 级别首次需安装浏览器：
# npx playwright install
npm run dev
```

之后用 AI 开发时：
- 根目录的入口文件（如 `CODEBUDDY.md` / `CLAUDE.md`）与 `AGENTS.md` 会让 AI 自动遵循规范；
- 新建页面：`npm run new:page <名字>`；
- 改完检查：`npm run check`；
- 出问题：`npm run doctor` 或在错误页点【复制诊断信息】，粘贴给 AI。

## 生成内容一览

```
<目标目录>/
├── AGENTS.md                              ⭐ AI 协作规范（完整规则，事实源）
├── <入口文件>                              按 agent 生成（CODEBUDDY.md / CLAUDE.md / 自定义）
├── <AI 目录>/rules/project.md             按 agent 生成（.codebuddy / .claude / 自定义）
├── nuxt.config.ts / app.config.ts / tsconfig.json
├── package.json                           按级别裁剪依赖与脚本
├── app.vue / error.vue(standard+)
├── assets/css/main.css
├── layouts/default.vue
├── pages/index.vue
├── components/DevPanel.vue(standard+)
├── composables/  useApi / useGsap / useLenis / useLogger(standard+) / useFormat(full)
├── plugins/error-capture.client.ts(standard+)
├── scripts/  new-page.mjs / doctor.mjs(standard+)
├── types/index.ts
├── eslint.config.mjs(full)                机器兜底：禁止裸console/空catch/组件内fetch
└── tests/(full)  unit + e2e(含路由冒烟) + .github/workflows/check.yml
```

> full 级别的 `npm run check` = `lint`（ESLint）+ `typecheck` + 单测 + 路由冒烟，全绿才算改完。

## 模板维护

模板文件位于 `templates/<层>/`，层之间**累加且后层覆盖前层**（`base` → `standard` → `full`）。
- 文本文件中的 `__PROJECT_NAME__` 会被替换为项目名。
- 点文件用 `_gitignore` / `_env` 占位存储，生成时还原为 `.gitignore` / `.env`。
- AI 协作规范完整内容在 `templates/base/AGENTS.md`（事实源）。
- agent 入口文件（`CODEBUDDY.md` / `CLAUDE.md` / 自定义）与 AI 目录下的 `rules/project.md`
  由 CLI 按所选 agent **动态生成**（均指向 `AGENTS.md`），不在模板里。
- `package.json` 由 CLI（`create.mjs` 与 `init_site.py`）按级别动态生成（不在模板里），两版逻辑保持一致。
- 两套 CLI 共享同一份 `templates/`，新增/修改模板对两版同时生效。
