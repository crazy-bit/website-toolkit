<script setup lang="ts">
// 首页示例。新增页面请放 pages/ 目录，文件名即路由。
const { animateIn, animateStagger } = useGsap()

const features = [
  { icon: 'i-lucide-layout-grid', title: '统一架构', desc: 'Nuxt 3 + Nuxt UI + GSAP + Lenis + Iconify' },
  { icon: 'i-lucide-scroll-text', title: '完善日志', desc: 'useLogger 结构化日志，错误自动捕获' },
  { icon: 'i-lucide-flask-conical', title: '自动测试', desc: 'Vitest + Playwright + 路由冒烟' },
  { icon: 'i-lucide-bug', title: '调试能力', desc: '友好错误页 + 调试面板 + 一键诊断' },
]

onMounted(() => {
  animateIn('.hero', { y: 16 })
  animateStagger('.feature-card', { y: 20, stagger: 0.08, delay: 0.1 })
})
</script>

<template>
  <div>
    <section class="hero text-center py-12">
      <h1 class="text-4xl font-bold tracking-tight">
        欢迎使用 <span class="text-primary">__PROJECT_NAME__</span>
      </h1>
      <p class="mt-4 text-lg text-gray-500 dark:text-gray-400">
        本项目已按规范初始化，直接用 AI 描述你的需求开始开发吧。
      </p>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard v-for="f in features" :key="f.title" class="feature-card">
        <UIcon :name="f.icon" class="text-primary text-2xl mb-2" />
        <h3 class="font-semibold">{{ f.title }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ f.desc }}</p>
      </UCard>
    </section>
  </div>
</template>
