<script setup lang="ts">
// 平滑滚动（Lenis）统一在此初始化
const { init, destroy } = useLenis()

onMounted(() => init())
onBeforeUnmount(() => destroy())
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- 开发态调试面板，生产自动隐藏 -->
    <DevPanel />
  </UApp>
</template>

<style>
/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.25s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
