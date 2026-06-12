<script setup lang="ts">
// 默认布局：顶栏 + 内容区。可按需扩展侧边栏（AppSidebar）。
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
      <div class="mx-auto flex h-14 items-center justify-between px-4" style="max-width: var(--app-max-width)">
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
          <UIcon name="i-lucide-rocket" class="text-primary text-xl" />
          <span>__PROJECT_NAME__</span>
        </NuxtLink>
        <UButton
          icon="i-lucide-github"
          color="neutral"
          variant="ghost"
          to="https://nuxt.com/docs"
          target="_blank"
        />
      </div>
    </header>

    <main class="mx-auto px-4 py-8" style="max-width: var(--app-max-width)">
      <slot />
    </main>
  </div>
</template>
