<script setup lang="ts">
import notFoundImg from '@/assets/images/404.svg'
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900 px-4 transition-colors">
    <img :src="notFoundImg" alt="404 not found" class="max-w-[400px] w-full mb-6 object-contain" />
    <p class="text-3xl text-gray-600 dark:text-gray-300 text-center">
      Sorry, the page you're looking for doesn't exist.
    </p>
  </div>
</template>