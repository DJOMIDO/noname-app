<script setup lang="ts">
import { client } from '@/lib/neon'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const props = withDefaults(
  defineProps<{
    icon: string
    title: string
    to: string
    index?: number
  }>(),
  { index: 0 }
)

const router = useRouter()

const handleClick = async () => {
  const { data } = await client.auth.getUser()
  if (!data.user) {
    toast.error('Please log in to access this feature.')
    return
  }

  router.push(props.to)
}
</script>

<template>
  <button type="button" @click="handleClick"
    :style="{ animationDelay: `${450 + index * 120}ms` }"
    class="group animate-in fade-in slide-in-from-bottom-8 relative z-10 flex cursor-pointer flex-col items-center rounded-2xl
      border border-white/60 bg-white/60 p-6 text-center shadow-lg shadow-indigo-500/5 backdrop-blur-md
      transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/80 hover:shadow-xl hover:shadow-indigo-500/20
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
      dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:focus-visible:ring-offset-gray-900">
    <span
      class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10
        ring-1 ring-inset ring-indigo-500/15 transition-transform duration-300 group-hover:scale-110">
      <img :src="icon" alt="" class="h-9 w-9 object-contain" />
    </span>
    <span class="text-lg font-semibold text-gray-800 dark:text-gray-100">
      {{ title }}
    </span>
    <span
      class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-500 opacity-0 transition-all duration-300
        group-hover:opacity-100 dark:text-indigo-300">
      Go <span class="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
    </span>
  </button>
</template>
