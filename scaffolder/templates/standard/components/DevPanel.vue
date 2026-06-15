<script setup lang="ts">
/**
 * 开发态调试面板（右下角浮层），实时显示日志流 / 当前路由。
 * 生产环境自动不渲染。
 */
import { getLogBuffer, clearLogBuffer, type LogEntry } from '~/composables/useLogger'

// import.meta 不能直接写在 <template> 表达式里（Vite 无法解析），改用普通常量
const isDev = import.meta.dev

const open = ref(false)
const logs = ref<LogEntry[]>([])
const route = useRoute()
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (!import.meta.dev) return
  timer = setInterval(() => {
    logs.value = getLogBuffer().slice(-100).reverse()
  }, 500)
})
onUnmounted(() => timer && clearInterval(timer))

const errorCount = computed(() => logs.value.filter(l => l.level === 'error').length)

function levelClass(l: string) {
  return l === 'error' ? 'text-red-400'
    : l === 'warn' ? 'text-amber-400'
      : l === 'info' ? 'text-indigo-300'
        : 'text-gray-400'
}

function copyAll() {
  navigator.clipboard.writeText(JSON.stringify(getLogBuffer(), null, 2))
}
</script>

<template>
  <ClientOnly>
    <div v-if="isDev" class="fixed bottom-4 right-4 z-[9999] font-mono">
      <button
        class="relative flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-700"
        title="调试面板"
        @click="open = !open"
      >
        🐞
        <span
          v-if="errorCount"
          class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px]"
        >{{ errorCount }}</span>
      </button>

      <div
        v-if="open"
        class="mt-2 flex h-[340px] w-[460px] flex-col overflow-hidden rounded-lg bg-black/90 text-xs text-white shadow-2xl backdrop-blur"
      >
        <div class="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span class="text-gray-300">路由：{{ route.fullPath }}</span>
          <span class="flex gap-2">
            <button class="text-gray-400 hover:text-white" @click="copyAll">复制全部</button>
            <button class="text-gray-400 hover:text-white" @click="clearLogBuffer(); logs = []">清空</button>
          </span>
        </div>
        <div class="flex-1 overflow-auto p-2">
          <div v-if="!logs.length" class="p-4 text-center text-gray-500">暂无日志</div>
          <div
            v-for="(l, i) in logs"
            :key="i"
            class="border-b border-white/5 py-1 leading-relaxed"
          >
            <span :class="levelClass(l.level)">[{{ l.level }}]</span>
            <span class="text-emerald-400"> {{ l.module }}</span>
            <span> · {{ l.message }}</span>
            <span v-if="l.context" class="text-gray-500"> {{ JSON.stringify(l.context) }}</span>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
