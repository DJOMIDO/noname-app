<script setup lang="ts">
import { RouterLink } from 'vue-router'

/** EmptyTab — friendly placeholder for a stats sub-tab with no data yet. */
defineProps<{
    icon: string
    text: string
    to: string
    cta: string
}>()
</script>

<template>
    <div class="flex flex-col items-center gap-5 rounded-2xl border border-white/60 bg-white/60 px-4 py-16 text-center
        shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <img :src="icon" alt="" class="size-12 opacity-50" />
        <p class="max-w-sm text-gray-500 dark:text-gray-400">{{ text }}</p>
        <RouterLink :to="to"
            class="inline-flex items-center rounded-lg bg-sunset px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sunset/30
            transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40">
            {{ cta }}
        </RouterLink>
    </div>
</template>
