<script setup lang="ts">
import TravelIntro from '@/components/TravelIntro.vue'
import ActionGrid from '@/components/ActionGrid.vue'
import hiking from '@/assets/images/hiking.svg'
import travelers from '@/assets/images/travelers.svg'
</script>

<template>
  <section class="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-10 transition-colors
    bg-gradient-to-b from-lilac/40 via-white to-white
    text-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 dark:text-gray-100">

    <!-- Ambient animated gradient blobs -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div
        class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-mint/30 blur-3xl dark:bg-mint/15" />
      <div
        class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-sunset/25 blur-3xl [animation-delay:5s] dark:bg-sunset/15" />
      <div
        class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-brand/20 blur-3xl [animation-delay:9s] dark:bg-brand/15" />
    </div>

    <!-- Decorative illustrations -->
    <img :src="hiking"
      class="pointer-events-none absolute bottom-6 left-4 hidden w-72 opacity-60 select-none border-0 outline-none will-change-transform xl:block dark:opacity-40" />
    <img :src="travelers"
      class="pointer-events-none absolute bottom-6 right-4 hidden w-72 opacity-60 select-none border-0 outline-none will-change-transform xl:block dark:opacity-40" />

    <div class="relative z-10">
      <TravelIntro />
      <ActionGrid />
    </div>
  </section>
</template>
