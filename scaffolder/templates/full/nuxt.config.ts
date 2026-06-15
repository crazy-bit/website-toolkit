// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  // 调试能力：开发工具默认开启
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    // full 级别：接入官方 ESLint 模块，配合根目录 eslint.config.mjs 做机器兜底
    '@nuxt/eslint',
  ],

  css: ['~/assets/css/main.css'],

  ui: {
    // 图标统一走 Iconify（Lucide + MDI）
    icons: ['lucide', 'mdi'],
  },

  app: {
    head: {
      title: '__PROJECT_NAME__',
      meta: [
        { name: 'description', content: '__PROJECT_NAME__ - 基于 AI 建站工具规范创建' },
      ],
    },
    // 统一页面切换动画
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  colorMode: {
    preference: 'light',
  },

  // 需要后端时，接口写在 server/api/，或在此配置代理：
  // nitro: { devProxy: { '/api': { target: 'http://localhost:8080/api', changeOrigin: true } } },
})
