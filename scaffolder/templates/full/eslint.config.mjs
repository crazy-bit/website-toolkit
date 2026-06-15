// @ts-check
// ESLint 扁平配置：把"统一架构 / 日志规范"从靠 AI 自觉升级为机器兜底。
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      // 禁止裸 console —— 日志请用 useLogger（useLogger 内部已逐行 eslint-disable）
      'no-console': 'error',
      // 禁止空代码块，尤其是空 catch 吞错误（catch {}）
      'no-empty': ['error', { allowEmptyCatch: false }],
      // 禁止组件 / 页面内直接发起请求，统一走 composables/useApi.ts
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='fetch']",
          message: '禁止直接 fetch，请通过 composables/useApi.ts 统一发起请求。',
        },
        {
          selector: "CallExpression[callee.name='$fetch']",
          message: '禁止直接 $fetch，请通过 composables/useApi.ts 统一发起请求。',
        },
      ],
    },
  },
  {
    // useApi 是唯一允许直接发请求的地方；服务端接口同理
    files: ['composables/useApi.ts', 'server/**'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    // Node 脚本（doctor / new-page 等）允许使用 console
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
)
