<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

import sun from '@/assets/images/sun.png'
import moon from '@/assets/images/moon.png'

const user = ref<any>(null)
const router = useRouter()

const fetchUser = async () => {
    const { data } = await supabase.auth.getUser()
    user.value = data.user
}

onMounted(() => {
    fetchUser()

    isDark.value = localStorage.getItem('theme') === 'dark'
    document.documentElement.classList.toggle('dark', isDark.value)
})

const handleLogout = async () => {
    await supabase.auth.signOut()
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
            class="text-xl font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 hover:scale-105 transition">
            NoNameApp
        </router-link>

        <div class="flex items-center space-x-4">

            <button @click="toggleDark" class="w-6 h-6 hover:scale-110 transition"
                :aria-label="isDark ? 'Light mode' : 'Dark mode'">
                <img :src="isDark ? moon : sun" alt="Toggle theme" class="w-full h-full object-contain" />
            </button>

            <template v-if="user">
                <span class="text-gray-700 dark:text-gray-200">
                    Welcome, {{ user.user_metadata?.username || 'User' }}
                </span>
                <button @click="handleLogout"
                    class="px-3 py-1 border border-indigo-400 dark:border-indigo-300 text-indigo-600 dark:text-indigo-200 rounded hover:bg-indigo-50 dark:hover:bg-indigo-800 hover:text-indigo-900 dark:hover:text-white">
                    Log Out
                </button>
            </template>
            <template v-else>
                <router-link to="/login"
                    class="px-3 py-1 border border-indigo-400 dark:border-indigo-300 text-indigo-600 dark:text-indigo-200 rounded hover:bg-indigo-50 dark:hover:bg-indigo-800 hover:text-indigo-900 dark:hover:text-white">Login</router-link>
                <router-link to="/signup"
                    class="px-3 py-1 border border-indigo-400 dark:border-indigo-300 text-indigo-600 dark:text-indigo-200 rounded hover:bg-indigo-50 dark:hover:bg-indigo-800 hover:text-indigo-900 dark:hover:text-white">Sign
                    Up</router-link>
            </template>
        </div>
    </nav>
</template>
