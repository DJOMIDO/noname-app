<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router';
import NavBar from '@/components/NavBar.vue'
import { Toaster } from '@/components/ui/sonner'

const route = useRoute()

// NavBar is hidden on auth pages: they render their own brand link instead
const isAuthPage = computed(() => /^\/(login|signup)$/.test(route.path))

// Apply the saved theme at app level: NavBar used to do this, but it is
// not rendered on auth pages, so a direct /login load lost the dark theme.
onMounted(() => {
  document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark')
})
</script>

<template>
  <NavBar v-if="!isAuthPage" />
  <RouterView />
  <Toaster position="top-right" richColors />
</template>

<style scoped>

</style>
