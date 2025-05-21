<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import NavBar from '@/components/NavBar.vue'
import { Toaster } from '@/components/ui/sonner'

const route = useRoute()
</script>

<template>
  <NavBar v-if="!['/login', '/signup'].includes(route.path)" />
  <RouterView />
  <Toaster position="top-right" richColors />
</template>

<style scoped>

</style>
