<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { client } from '@/lib/neon'

import sun from '@/assets/images/sun.png'
import moon from '@/assets/images/moon.png'

const user = ref<any>(null)
const router = useRouter()

const fetchUser = async () => {
    const { data } = await client.auth.getUser()
    user.value = data.user
}

onMounted(() => {
    fetchUser()

    // Reflect the current theme for the toggle icon; applying it to <html>
    // is handled once in App.vue.
    isDark.value = localStorage.getItem('theme') === 'dark'
})

const handleLogout = async () => {
    await client.auth.signOut()
    user.value = null
    router.push('/')
}

const isDark = ref(false)

const toggleDark = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>

<template>
    <nav class="sticky top-0 z-50 flex items-center justify-between px-6 py-4
         bg-white/80 dark:bg-gray-900 backdrop-blur border-b border-slate-200
         dark:border-slate-700">
        <router-link to="/"
            class="font-display text-xl font-semibold tracking-tight text-brand dark:text-violet-300 hover:text-violet-700 dark:hover:text-violet-200 hover:scale-105 transition">
            vivavia
        </router-link>

        <div class="flex items-center space-x-4">

            <button @click="toggleDark" class="w-6 h-6 hover:scale-110 transition"
                :aria-label="isDark ? 'Light mode' : 'Dark mode'">
                <img :src="isDark ? moon : sun" alt="Toggle theme" class="w-full h-full object-contain" />
            </button>

            <template v-if="user">
                <span class="hidden md:block text-gray-700 dark:text-gray-200">
                    Welcome, {{ user.user_metadata?.displayName || 'User' }}
                </span>
                <button @click="handleLogout"
                    class="px-3 py-1 border border-brand/50 dark:border-violet-300/50 text-brand dark:text-violet-200 rounded hover:bg-brand/10 dark:hover:bg-brand/25 hover:text-violet-800 dark:hover:text-white">
                    Log Out
                </button>
            </template>
            <template v-else>
                <router-link to="/login"
                    class="px-3 py-1 border border-brand/50 dark:border-violet-300/50 text-brand dark:text-violet-200 rounded hover:bg-brand/10 dark:hover:bg-brand/25 hover:text-violet-800 dark:hover:text-white">Login</router-link>
                <router-link to="/signup"
                    class="px-3 py-1 border border-brand/50 dark:border-violet-300/50 text-brand dark:text-violet-200 rounded hover:bg-brand/10 dark:hover:bg-brand/25 hover:text-violet-800 dark:hover:text-white">Sign
                    Up</router-link>
            </template>
        </div>
    </nav>
</template>
