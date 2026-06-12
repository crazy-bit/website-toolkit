# 05 · 反向校验报告（以 maoxianjia 检验方案）

> 方法：用真实项目 `maoxianjia/` 反向检验"AI 建站工具"方案与脚手架模板是否站得住脚。
> 既检查 maoxianjia 是否符合规范，也反过来看规范/模板是否需要根据真实项目修正。
>
> 校验时间：2026-06-12　|　对象：`maoxianjia/`（Nuxt 3 真实业务项目）

---

## 1. 结论速览

| 维度 | 结论 |
|------|------|
| 技术栈选型 | ✅ **完全验证**。maoxianjia 与方案选型逐项一致，证明该栈在真实业务可行 |
| 目录/分层规范 | ✅ 大体一致，模板正是从 maoxianjia 抽象而来 |
| 规范的必要性 | ✅ **被强力验证**：maoxianjia 恰恰存在多处方案要消除的"混乱"（组件内直接 fetch、空 catch 吞错误、死代码） |
| 规范的完备性 | ⚠️ 需补强：缺 `utils/` 目录约定、缺"单页/多页两种页面模式"说明 |
| 缺失能力 | ⚠️ maoxianjia 缺 `AGENTS.md` / `error.vue` / `useLogger` / `tests/` —— 正是 standard/full 层要补齐的 |

> 一句话：**方案方向被真实项目证实是对的，而且 maoxianjia 自身就是"没有这套规范会变成什么样"的活样本。**

---

## 2. 符合项（验证了方案选型与规范）

| 检查点 | 结果 | 证据 |
|--------|------|------|
| 技术栈 | ✅ 一致 | `package.json`：nuxt ^3.16、@nuxt/ui ^3、gsap、lenis、@iconify-json/{lucide,mdi}、typescript |
| 样式写法 | ✅ 一致 | `assets/css/main.css` 用 `@import "tailwindcss"; @import "@nuxt/ui";`，与模板相同 |
| 全量 TypeScript | ✅ 通过 | 全库 **0 个 `.js` 业务文件**（搜索确认） |
| 目录分层 | ✅ 一致 | pages / components / composables / layouts / types / assets 均按职责使用 |
| 命名规范 | ✅ 通过 | 布局类 `App*`（AppSidebar/AppTopBar）、视图区块 `View*`（ViewOverview…）、composable `useXxx` |
| 动画封装 | ✅ 一致 | `useGsap.ts` 与模板几乎逐行一致（模板即源于此） |
| API 集中（部分） | ⚠️ 部分 | `useApi.ts` 集中了大部分请求，但组件存在绕过（见下） |

---

## 3. 偏差与违规项（暴露真实"混乱"，验证规范价值）

### 🔴 3.1 组件内直接 fetch，且重复定义已存在的 API 方法

- `components/AppTopBar.vue` 内**本地重新定义了一个 `apiRequestSync`**，直接 `fetch('/api/request-sync')`——而 `composables/useApi.ts` **已经导出同名 `apiRequestSync`**。
- `components/DataSourceIndicator.vue` 同样直接 `fetch('/api/data-source-status')` 和 `/api/request-sync`，而 useApi 也有 `apiGetDataSourceStatus`。

```js
// AppTopBar.vue（违规示例）
async function apiRequestSync(source: string) {   // 与 useApi.ts 同名，造成混淆
  try { await fetch('/api/request-sync', { ... }) } catch {}
}
```

> **校验意义**：这正是"页面一多就乱"的典型——同一个能力有两份实现、来源不一致。强力验证了规范第 4 条"**所有请求走 useApi.ts，组件禁止直接 fetch**"的必要性。

### 🔴 3.2 空 catch 吞掉错误（无任何日志）

`useDashboard.ts` 多处：
```js
async function refreshData() {
  try { /* ... */ } catch {}   // ← 错误被彻底吞掉
}
```
其余 `handleSync*` 也只把错误塞进 `syncError`，无日志、无堆栈。

> **校验意义**：这就是"出错看不见、调试困难"的根因。完美验证了方案的 **日志系统（useLogger）+ 禁止吞错误 + 全局错误捕获** 的价值。若接入 `useLogger`，这些静默失败会立刻可见。

### 🟠 3.3 useLenis 定义了却从未被调用（死代码 / 隐藏 bug）

- 全库搜索 `useLenis()` 仅命中其**定义处**，无任何调用点 → **平滑滚动实际从未生效**。
- 且其实现把 `onMounted/onUnmounted` 写在 composable 内部，强依赖"必须在组件 setup 中调用"，容易漏。

> **校验意义**：验证了模板把 Lenis 改为 **显式 `init()/destroy()` 并在 `app.vue` 统一调用** 的做法更稳——不易出现"定义了没生效"。

### 🟠 3.4 缺少 `utils/` 目录约定

- maoxianjia 实际使用了 `~/utils/mockData.ts`（被 `useDashboard.ts` 引用），但方案的目录约定与 `AGENTS.md` **未提及 `utils/`**。
- Nuxt 会自动导入 `utils/`，是放纯工具/常量/mock 的标准位置。

> **校验意义**：规范需补充 `utils/` 目录。

---

## 4. 真实项目的合理模式 → 反哺规范

### 4.1 单页（SPA 式）页面组织 vs 约定式多路由

- maoxianjia **只有 `pages/index.vue`**，内部用 `view` 状态 + URL hash 在 7 个 `View*` 组件间切换，而非每个视图一个 `pages/` 路由。
- 这与规范"新增页面只能放 pages/，文件名即路由"看似冲突，但对"单一大屏/仪表盘"是合理选择。

> **校验意义**：规范应明确**两种页面组织模式**并各自适用场景；同时**路由冒烟测试**在单页模式下覆盖不足（只测到 `/`），需要补充对"视图状态切换"的冒烟思路。

### 4.2 数据降级（mock fallback）

- `useDashboard.ts` 在后端不可用时回退到 `mockData`，保证前端可独立展示。这是值得写进规范的好实践（利于非程序人员本地预览）。

---

## 5. 缺失能力清单（对照 standard/full 模板）

| 能力 | maoxianjia | 模板层 |
|------|------------|--------|
| `AGENTS.md` / `.cursorrules` | ❌ 无 | base |
| `useLogger` 统一日志 | ❌ 无（且空 catch 吞错误） | standard |
| 全局错误捕获插件 | ❌ 无 | standard |
| `error.vue` 友好错误页 | ❌ 无 | standard |
| `DevPanel` 调试面板 | ❌ 无 | standard |
| `doctor` 体检脚本 | ❌ 无 | standard |
| `tests/`（单测 + E2E + 冒烟） | ❌ 无 | full |

---

## 6. 据校验得出的规范/模板修正项

| # | 修正 | 落地位置 | 状态 |
|---|------|----------|------|
| 1 | 目录约定补充 `utils/`（纯函数/常量/mock） | `AGENTS.md` 模板、`docs/01` | ✅ 已改 |
| 2 | 明确"单页 / 多页"两种页面模式及适用场景 | `AGENTS.md` 模板、`docs/01` | ✅ 已改 |
| 3 | 新增"反模式"清单：禁止组件内重复定义/直接 fetch、禁止空 catch 吞错误 | `AGENTS.md` 模板 | ✅ 已改 |
| 4 | 路由冒烟模板补充：单页模式下遍历视图状态的思路 | `smoke.routes.spec.ts` 注释 | ✅ 已改 |
| 5 | `useLenis` 统一为 `init/destroy` 显式调用并在 app.vue 接入 | 模板（已是此方案） | ✅ 已符合 |
| 6 | 推荐 mock 降级实践 | `docs/01` 备注 | ✅ 已改 |

> 说明：第 5 项模板本就采用了更稳的写法，反向校验进一步确认其优于 maoxianjia 的内部 onMounted 写法。

---

## 7. 总评

- **选型可行性**：✅ 真实项目逐项印证，零反例。
- **规范必要性**：✅ maoxianjia 的三类问题（绕过 useApi、空 catch 吞错误、死代码）正是规范要根除的，被真实样本强力背书。
- **规范完备性**：经本次校验补齐 `utils/`、页面模式、反模式清单后更完整。
- **后续建议**：可加一条轻量静态检查（lint 规则）自动拦截"组件内 fetch""空 catch"，把规范从"靠 AI 自觉"升级为"机器兜底"。

> 参考实现 `maoxianjia/` 的价值：既是脚手架的抽象来源，也是"无规范 → 混乱"的反面教材，建议长期保留作为对照样本。
