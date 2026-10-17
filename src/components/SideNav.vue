<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Sun, Moon, LogOut, LogIn, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { navItems } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { useTheme } from '@/composables/useTheme'
import { useAuthUser } from '@/composables/useAuthUser'

const route = useRoute()
const { isDark, toggle } = useTheme()
const { user, fetchUser, logout } = useAuthUser()

const collapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
const toggleCollapse = () => {
    collapsed.value = !collapsed.value
    localStorage.setItem('sidebar-collapsed', String(collapsed.value))
}

onMounted(fetchUser)

const isActive = (to: string) =>
    route.path === to || (to !== '/home' && route.path.startsWith(`${to}/`))

const displayName = computed(() => user.value?.user_metadata?.displayName || 'User')
</script>

<template>
    <aside :class="cn(
        'group relative z-20 hidden shrink-0 flex-col border-r border-slate-200/70 bg-white/70 backdrop-blur-xl transition-[width] duration-300',
        'lg:flex dark:border-white/10 dark:bg-gray-950/60',
        collapsed ? 'w-20' : 'w-64',
    )">

        <!-- Collapse toggle: circular, rides on the right border -->
        <button @click="toggleCollapse"
            :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            :class="cn(
                'absolute -right-3 top-6 z-30 flex size-6 items-center justify-center rounded-full',
                'border border-slate-200/70 bg-white shadow-sm',
                'text-gray-400 transition-[opacity,color,border-color] duration-200 hover:border-gray-300 hover:text-gray-700',
                'dark:border-white/15 dark:bg-gray-900 dark:text-gray-500 dark:hover:border-white/30 dark:hover:text-gray-200',
                collapsed && 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
            )">
            <ChevronRight v-if="collapsed" class="size-3.5" />
            <ChevronLeft v-else class="size-3.5" />
        </button>

        <!-- Brand -->
        <div :class="cn('flex items-center py-5', collapsed ? 'justify-center px-2' : 'px-5')">
            <RouterLink to="/home" aria-label="vivavia home"
                class="font-display flex items-center justify-center text-3xl font-bold tracking-tight
                bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">
                <span v-if="!collapsed">vivavia</span>
                <span v-else>v</span>
            </RouterLink>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-1 px-3">
            <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" :title="item.label"
                :class="cn(
                    'group flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors',
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                    isActive(item.to)
                        ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-violet-200'
                        : 'text-gray-500 hover:bg-black/5 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100',
                )">
                <component :is="item.icon" class="size-5 shrink-0"
                    :class="isActive(item.to) ? '' : 'text-gray-400 transition-colors group-hover:text-brand dark:text-gray-500'" />
                <span v-if="!collapsed">{{ item.label }}</span>
            </RouterLink>
        </nav>

        <!-- Footer: theme + account -->
        <div :class="cn('space-y-3 border-t border-slate-200/70 py-4 dark:border-white/10', collapsed ? 'px-3' : 'px-4')">
            <button @click="toggle" :title="isDark ? 'Light mode' : 'Dark mode'"
                :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                :class="cn(
                    'flex items-center rounded-xl py-2 text-sm font-medium text-gray-500 transition-colors',
                    'hover:bg-black/5 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100',
                    collapsed ? 'w-full justify-center px-0' : 'w-full gap-3 px-3',
                )">
                <Sun v-if="isDark" class="size-5 shrink-0" />
                <Moon v-else class="size-5 shrink-0" />
                <span v-if="!collapsed">{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
            </button>

            <!-- Logged in -->
            <div v-if="user" :class="cn('flex items-center rounded-xl bg-black/5 dark:bg-white/5', collapsed ? 'justify-center px-0 py-2' : 'gap-2 px-3 py-2')">
                <template v-if="collapsed">
                    <button @click="logout" title="Log out" aria-label="Log out"
                        class="flex items-center justify-center text-brand dark:text-violet-200">
                        <LogOut class="size-5" />
                    </button>
                </template>
                <template v-else>
                    <span class="truncate text-sm text-gray-600 dark:text-gray-300">Hi, {{ displayName }}</span>
                    <button @click="logout"
                        class="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand/10 dark:text-violet-200">
                        <LogOut class="size-4" />
                        <span>Log out</span>
                    </button>
                </template>
            </div>

            <!-- Logged out -->
            <div v-else :class="cn(collapsed ? 'flex justify-center' : 'flex items-center gap-2')">
                <template v-if="collapsed">
                    <RouterLink to="/login" title="Login" aria-label="Login"
                        class="flex items-center justify-center rounded-lg py-2 text-brand dark:text-violet-200">
                        <LogIn class="size-5" />
                    </RouterLink>
                </template>
                <template v-else>
                    <RouterLink to="/login"
                        class="flex-1 rounded-lg border border-brand/40 px-3 py-2 text-center text-sm font-semibold text-brand transition-colors hover:bg-brand/10 dark:border-violet-300/40 dark:text-violet-200">
                        Login
                    </RouterLink>
                    <RouterLink to="/signup"
                        class="flex-1 rounded-lg bg-sunset px-3 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-sunset/30 transition-all hover:bg-orange-500">
                        Sign up
                    </RouterLink>
                </template>
            </div>
        </div>
    </aside>
</template>
