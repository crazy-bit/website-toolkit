<script setup lang="ts">
/**
 * 友好错误页：捕获致命错误。不把吓人的堆栈丢给普通用户，
 * 但提供【复制诊断信息】按钮，一键打包错误 + 最近日志 + 环境，供粘贴给 AI 修复。
 */
import { getLogBuffer } from '~/composables/useLogger'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message: string
    stack?: string
  }
}>()

const log = useLogger('error-page')
const copied = ref(false)
const route = useRoute()

log.error('页面致命错误', {
  statusCode: props.error.statusCode,
  message: props.error.message,
})

function buildDiagnostics(): string {
  return JSON.stringify({
    error: {
      statusCode: props.error.statusCode,
      statusMessage: props.error.statusMessage,
      message: props.error.message,
      stack: props.error.stack,
    },
    route: route.fullPath,
    time: new Date().toISOString(),
    userAgent: import.meta.client ? navigator.userAgent : 'server',
    recentLogs: getLogBuffer().slice(-50),
  }, null, 2)
}

async function copyDiagnostics() {
  try {
    await navigator.clipboard.writeText(buildDiagnostics())
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    copied.value = false
  }
}

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <UCard class="w-full max-w-lg text-center">
      <UIcon name="i-lucide-triangle-alert" class="mb-4 text-5xl text-amber-500" />
      <h1 class="mb-2 text-xl font-semibold">页面出了点问题</h1>
      <p class="mb-6 text-gray-500 dark:text-gray-400">
        别担心，这通常不是你的操作问题。点击下方按钮复制诊断信息，发给 AI 助手即可帮你修复。
      </p>

      <div class="flex justify-center gap-3">
        <UButton icon="i-lucide-clipboard-copy" @click="copyDiagnostics">
          {{ copied ? '已复制 ✓' : '复制诊断信息' }}
        </UButton>
        <UButton color="neutral" variant="soft" icon="i-lucide-home" @click="goHome">
          返回首页
        </UButton>
      </div>

      <details class="mt-6 text-left text-xs text-gray-400">
        <summary class="cursor-pointer select-none">技术细节（给开发者 / AI 看）</summary>
        <pre class="mt-2 whitespace-pre-wrap break-all">错误码：{{ error.statusCode }}
{{ error.message }}</pre>
      </details>
    </UCard>
  </div>
</template>
