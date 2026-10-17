<script setup lang="ts">
/**
 * AuthShell — shared layout for Login / Signup pages.
 * Matches the welcome page style (feat/redesign-welcome-page):
 * gradient background + animated blobs + floating illustration + glass card.
 */
defineProps<{
  illustrationAlt?: string
}>()
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden transition-colors
    bg-gradient-to-b from-indigo-50 via-white to-white
    dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">

    <!-- Ambient animated gradient blobs -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div
        class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20" />
      <div
        class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-violet-400/25 blur-3xl [animation-delay:5s] dark:bg-violet-500/20" />
      <div
        class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-sky-400/25 blur-3xl [animation-delay:9s] dark:bg-sky-500/15" />
    </div>

    <!-- Brand link (auth pages render without NavBar, see App.vue) -->
    <router-link to="/"
      class="animate-in fade-in relative z-20 px-6 py-5 text-xl font-semibold text-indigo-600 transition hover:scale-105 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100">
      NoNameApp
    </router-link>

    <div class="relative z-10 flex flex-1 items-center justify-center px-4 pb-10 lg:px-16">
      <div class="flex w-full max-w-5xl items-center justify-center gap-16">

        <!-- Illustration: desktop only, floating like the welcome hero -->
        <div class="hidden flex-1 lg:block">
          <slot name="illustration">
            <img src="@/assets/images/Login.svg" :alt="illustrationAlt || 'Travel'"
              class="animate-in fade-in zoom-in mx-auto w-full max-w-[420px] animate-float drop-shadow-2xl" />
          </slot>
        </div>

        <!-- Form column -->
        <div class="w-full max-w-[400px]">
          <div class="animate-in fade-in slide-in-from-bottom-8 rounded-2xl border border-white/60 bg-white/60
            p-8 shadow-xl shadow-indigo-500/10 backdrop-blur-md
            dark:border-white/10 dark:bg-white/5 dark:shadow-indigo-500/5">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
