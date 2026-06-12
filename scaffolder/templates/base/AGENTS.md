# 本项目 AI 协作规范（AGENTS.md）

> 这是给 AI 编程助手（Cursor / Claude / Copilot 等）阅读的规则。
> 你（AI）在本项目中工作时，**必须严格遵守以下约定**，这是保证项目长期不混乱的前提。
> 普通用户无需理解本文件，只管用自然语言提需求即可。

## 一、技术栈（不要替换、不要新增同类库）

- 框架：**Nuxt 3**（约定式路由 + 自动导入）
- UI 组件库：**Nuxt UI 3**（配套 Tailwind CSS）
- 动画：**GSAP**（统一通过 `useGsap()` 调用）
- 平滑滚动：**Lenis**（统一通过 `useLenis()`）
- 图标：**Iconify**（`<UIcon name="i-lucide-xxx" />` 或 `i-mdi-xxx`）
- 语言：**TypeScript**（全量 TS）

## 二、目录约定（新增文件必须放对位置）

| 要做的事 | 放哪里 |
|----------|--------|
| 新增页面 | `pages/`，文件名即路由（如 `pages/about.vue` → `/about`） |
| 可复用 UI | `components/`（自动导入，无需 import） |
| 逻辑 / 状态 / 计算 | `composables/`（`useXxx.ts`，自动导入） |
| 所有后端请求 | `composables/useApi.ts`（唯一出入口） |
| 类型定义 | `types/index.ts` |
| 全局样式 | `assets/css/main.css` |
| 服务端接口 | `server/api/`（需要后端时） |

## 三、必须遵守

1. 新页面只能放 `pages/`，**不手写路由表**。
2. 可复用 UI 拆到 `components/`，**单文件不超过 ~300 行**，超了就拆。
3. 业务逻辑 / 状态写进 `composables/`，**组件里不堆逻辑**。
4. **所有网络请求走 `composables/useApi.ts`**，组件内禁止直接 `fetch`。
5. 日志统一用 `useLogger('模块名')`，参见"日志规范"。
6. 图标只用 Iconify；动画只用 `useGsap()`；滚动只用 `useLenis()`。
7. 全 TypeScript，类型集中在 `types/`。
8. 命名规范：
   - 页面文件：小写中划线（`user-profile.vue`）
   - 组件文件：大驼峰（`UserCard.vue`），布局类用 `App` 前缀，视图区块用 `View` 前缀
   - composable：`use` 前缀小驼峰（`useDashboard.ts`）
   - 类型：大驼峰；常量：全大写下划线

## 四、禁止

- ❌ 引入新的 UI 库 / 动画库 / 图标方案
- ❌ 在组件里直接 `fetch`（必须经 `useApi.ts`）
- ❌ 裸用 `console.log`（必须用 `useLogger`）
- ❌ 新建 `.js` 业务文件（用 `.ts`）
- ❌ 手写路由表（用约定式 `pages/`）
- ❌ 用 `.skip` 或注释掉测试来"绕过"红灯

## 五、日志规范

- 每个 composable / 关键组件顶部：`const log = useLogger('模块名')`
- 关键流程用 `log.info`，可恢复异常用 `log.warn`，失败用 `log.error`
- `error` 级别必须带上下文：`log.error('xxx 失败', { error: String(e) })`
- 不要在日志里打印密码 / token / 手机号等敏感信息

## 六、错误与调试规范

- 致命错误交给 `error.vue` 兜底，不要在页面里裸 `try/catch` 把错误吞掉
- 可恢复错误：`log.warn` + 给用户友好提示（`UToast` / `UAlert`）
- 开发态保留 `<DevPanel />`，生产自动隐藏
- 排查问题先看 DevPanel 日志流 / `error.vue` 的诊断信息

## 七、每次改完代码后（务必执行）

1. 为新增 / 改动的纯逻辑补单测（新增页面由路由冒烟自动覆盖，无需手写）。
2. 运行 `npm run check`。
3. 若红灯：结合失败用例信息 + 应用日志定位，修复后重跑，直到全绿。
4. **不要绕过测试**。绿灯才算"改完了"。
