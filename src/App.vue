<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SideNav from '@/components/SideNav.vue'
import BottomTabBar from '@/components/BottomTabBar.vue'
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()

// Auth pages render their own brand link and full-screen layout (AuthShell),
// so they live outside the app shell and show no navigation chrome.
const isAuthPage = computed(() => /^\/(login|signup)$/.test(route.path))

// Apply the saved theme once at app start (was previously inline here).
const { init: initTheme } = useTheme()
onMounted(initTheme)
</script>

<template>
    <!-- Auth: full-screen, no shell -->
    <RouterView v-if="isAuthPage" />

    <!-- App shell: desktop sidebar + scrollable main; mobile bottom tab bar -->
    <div v-else class="flex h-dvh overflow-hidden">
        <SideNav />
        <main class="relative min-h-0 flex-1 overflow-y-auto">
            <RouterView />
        </main>
        <BottomTabBar />
    </div>

    <Toaster position="top-right" richColors />
</template>
