<script setup lang="ts">
import travelImg from '@/assets/images/Travel.svg'
</script>

<template>
  <div class="relative flex flex-col items-center text-center mb-8">
    <h1
      class="animate-in fade-in slide-in-from-bottom-6 mt-2 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
      Every Journey Has a
      <span
        class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">Story</span>
      <span class="mt-2 block text-2xl font-bold text-slate-500 sm:text-3xl dark:text-slate-400">
        Start Recording Yours
      </span>
    </h1>

    <p
      class="animate-in fade-in slide-in-from-bottom-6 mt-5 max-w-xl text-base text-gray-600 [animation-delay:200ms] sm:text-lg dark:text-gray-300">
      Keep track of your flights and train rides as you explore the world.
    </p>

    <div class="animate-in fade-in zoom-in mt-6 [animation-delay:350ms]">
      <img :src="travelImg" class="w-full max-w-[320px] animate-float drop-shadow-2xl" alt="Travel" />
    </div>
  </div>
</template>
