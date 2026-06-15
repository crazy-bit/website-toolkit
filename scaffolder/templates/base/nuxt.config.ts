// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  // 调试能力：开发工具默认开启
  devtools: { enabled: true },

  // 关闭 Nuxt 匿名遥测，避免安装/首次运行时出现"是否参与"的交互询问
  telemetry: false,

  modules: [
    '@nuxt/ui',
  ],

  css: ['~/assets/css/main.css'],

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
