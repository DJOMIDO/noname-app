<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Lock } from 'lucide-vue-next'

/**
 * GuestState — friendly placeholder shown on data pages (Journeys / Statistics)
 * when a visitor is browsing without an account session. Replaces the old
 * "You must be logged in" error toast with a proper call to action.
 */
defineProps<{
    title?: string
    text: string
}>()
</script>

<template>
    <div class="animate-in fade-in flex flex-col items-center gap-5 rounded-2xl border border-white/60 bg-white/60 px-4 py-16 text-center
        shadow-xl shadow-brand/10 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
        <span
            class="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-sky-400/10 ring-1 ring-inset ring-brand/15">
            <Lock class="size-6 text-brand dark:text-violet-300" aria-hidden="true" />
        </span>

        <h2 v-if="title" class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ title }}</h2>
        <p class="max-w-sm text-gray-500 dark:text-gray-400">{{ text }}</p>

        <div class="flex flex-wrap items-center justify-center gap-3">
            <RouterLink to="/login"
                class="inline-flex items-center rounded-lg bg-sunset px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sunset/30
                transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40">
                Log in
            </RouterLink>
            <RouterLink to="/signup"
                class="inline-flex items-center rounded-lg border border-brand/30 bg-white/70 px-5 py-2.5 text-sm font-semibold text-brand shadow-sm
                transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:bg-white
                dark:border-white/15 dark:bg-white/5 dark:text-violet-200">
                Sign up
            </RouterLink>
        </div>
    </div>
</template>
