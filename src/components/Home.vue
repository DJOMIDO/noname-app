<script setup lang="ts">
import TravelIntro from '@/components/TravelIntro.vue'
import ActionGrid from '@/components/ActionGrid.vue'
import hiking from '@/assets/images/hiking.svg'
import travelers from '@/assets/images/travelers.svg'
</script>

<template>
  <section
    class="relative min-h-screen px-4 py-10 bg-white/80 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
    <img :src="hiking" class="hidden md:block absolute bottom-10 left-4 w-80 pointer-events-none select-none" />
    <img :src="travelers" class="hidden md:block absolute bottom-10 right-4 w-80 pointer-events-none select-none" />
    <TravelIntro />
    <ActionGrid />
  </section>
</template>
