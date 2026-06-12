# __PROJECT_NAME__

> 本项目由「AI 建站工具」脚手架初始化，已内置统一架构、日志、测试与调试规范。
> 你只需用自然语言向 AI 描述需求，AI 会自动遵循 `AGENTS.md` 中的规范进行开发。

## 快速开始

```bash
npm install           # 安装依赖
npm run dev           # 启动开发服务器 http://localhost:3000
```

## 常用命令

| 想做的事 | 命令 |
|----------|------|
| 启动开发 | `npm run dev` |
| 新建页面 | `npm run new:page <名字>`（如 `npm run new:page about`） |
| 改完检查 | `npm run check`（类型检查；full 级别含单测 + 路由冒烟） |
| 构建上线 | `npm run build` → `npm run preview` |
| 打包诊断（standard+） | `npm run doctor` |
| 跑测试（full） | `npm run test:unit` / `npm run test:e2e` |

## 技术栈

Nuxt 3 · Nuxt UI 3 · Tailwind CSS · GSAP · Lenis · Iconify · TypeScript

## 项目结构

```
pages/        页面（文件名即路由）
components/    可复用组件（自动导入）
composables/   逻辑/状态（useApi 请求、useLogger 日志、useGsap、useLenis）
layouts/       布局
types/         类型定义
assets/css/    全局样式
server/api/    服务端接口（按需）
tests/         测试（full 级别）
AGENTS.md      ⭐ AI 协作规范（开发约束都写在这）
```

## 给使用者的提示

- 出现报错时，页面会显示友好的错误提示，点击 **【复制诊断信息】**，把内容粘贴给 AI 即可帮你定位修复。
- 开发时页面右下角有 🐞 调试按钮，可实时查看日志。
- 不要手动改乱目录结构，让 AI 遵循 `AGENTS.md` 即可保持整洁。

---

完整方案文档见仓库 `docs/`。
