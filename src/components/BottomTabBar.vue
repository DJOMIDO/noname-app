<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Plus, Menu, Sun, Moon, LogOut, X } from 'lucide-vue-next'
import { mobileTabItems, addItems } from '@/lib/nav'
import { useTheme } from '@/composables/useTheme'
import { useAuthUser } from '@/composables/useAuthUser'

const route = useRoute()
const { isDark, toggle } = useTheme()
const { user, fetchUser, logout } = useAuthUser()

const showAdd = ref(false)
const showMenu = ref(false)

onMounted(fetchUser)

const isActive = (to: string) =>
    route.path === to || (to !== '/home' && route.path.startsWith(`${to}/`))

const displayName = computed(() => user.value?.name || 'User')

// Close any open sheet whenever the route changes.
watch(() => route.fullPath, () => {
    showAdd.value = false
    showMenu.value = false
})

const closeSheets = () => {
    showAdd.value = false
    showMenu.value = false
}
</script>

<template>
    <div class="lg:hidden">
        <!-- Backdrop for sheets -->
        <div v-if="showAdd || showMenu" class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            @click="closeSheets" />

        <!-- Add sheet -->
        <div v-if="showAdd"
            class="fixed inset-x-0 bottom-20 z-50 mx-auto w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-4
            rounded-2xl border border-white/60 bg-white/90 p-3 shadow-xl shadow-brand/10 backdrop-blur-md dark:border-white/10 dark:bg-gray-900/90">
            <div class="mb-1 flex items-center justify-between px-2">
                <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">Add a journey</span>
                <button @click="showAdd = false" aria-label="Close" class="text-gray-400 hover:text-gray-600">
                    <X class="size-4" />
                </button>
            </div>
            <RouterLink v-for="item in addItems" :key="item.to" :to="item.to"
                class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700
                transition-colors hover:bg-brand/10 hover:text-brand dark:text-gray-200 dark:hover:text-violet-200">
                <component :is="item.icon" class="size-5 text-brand dark:text-violet-300" />
                <span>{{ item.label }}</span>
            </RouterLink>
        </div>

        <!-- Menu sheet -->
        <div v-if="showMenu"
            class="fixed inset-x-0 bottom-20 z-50 mx-auto w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-4
            rounded-2xl border border-white/60 bg-white/90 p-3 shadow-xl shadow-brand/10 backdrop-blur-md dark:border-white/10 dark:bg-gray-900/90">
            <div class="mb-1 flex items-center justify-between px-2">
                <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {{ user ? `Hi, ${displayName}` : 'Account' }}
                </span>
                <button @click="showMenu = false" aria-label="Close" class="text-gray-400 hover:text-gray-600">
                    <X class="size-4" />
                </button>
            </div>

            <button @click="toggle"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700
                transition-colors hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/5">
                <Sun v-if="isDark" class="size-5 text-brand dark:text-violet-300" />
                <Moon v-else class="size-5 text-brand dark:text-violet-300" />
                <span>{{ isDark ? 'Light mode' : 'Dark mode' }}</span>
            </button>

            <template v-if="user">
                <button @click="logout"
                    class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700
                    transition-colors hover:bg-black/5 dark:text-gray-200 dark:hover:bg-white/5">
                    <LogOut class="size-5 text-brand dark:text-violet-300" />
                    <span>Log out</span>
                </button>
            </template>
            <div v-else class="flex items-center gap-2 px-1 py-2">
                <RouterLink to="/login"
                    class="flex-1 rounded-lg border border-brand/40 px-3 py-2 text-center text-sm font-semibold text-brand dark:border-violet-300/40 dark:text-violet-200">
                    Login
                </RouterLink>
                <RouterLink to="/signup"
                    class="flex-1 rounded-lg bg-sunset px-3 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-sunset/30 transition-colors hover:bg-orange-500">
                    Sign up
                </RouterLink>
            </div>
        </div>

        <!-- The bar -->
        <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/70 bg-white/85 backdrop-blur-xl
            dark:border-white/10 dark:bg-gray-950/80">
            <div class="mx-auto grid max-w-md grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)] pt-2">
                <RouterLink v-for="item in [mobileTabItems[0], mobileTabItems[1]]" :key="item.to" :to="item.to"
                    :class="[
                        'flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors',
                        isActive(item.to) ? 'text-brand dark:text-violet-200' : 'text-gray-400 dark:text-gray-500',
                    ]">
                    <component :is="item.icon" class="size-6" />
                    <span>{{ item.label }}</span>
                </RouterLink>

                <!-- Center add -->
                <div class="flex justify-center">
                    <button @click="showMenu = false; showAdd = !showAdd" aria-label="Add a journey"
                        class="-mt-6 flex size-14 items-center justify-center rounded-full bg-sunset text-white
                        shadow-lg shadow-sunset/40 ring-4 ring-white transition-transform active:scale-95 dark:ring-gray-950">
                        <Plus class="size-7" />
                    </button>
                </div>

                <RouterLink :to="mobileTabItems[2].to"
                    :class="[
                        'flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors',
                        isActive(mobileTabItems[2].to) ? 'text-brand dark:text-violet-200' : 'text-gray-400 dark:text-gray-500',
                    ]">
                    <component :is="mobileTabItems[2].icon" class="size-6" />
                    <span>{{ mobileTabItems[2].label }}</span>
                </RouterLink>

                <button @click="showAdd = false; showMenu = !showMenu" aria-label="Menu"
                    :class="[
                        'flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors',
                        showMenu ? 'text-brand dark:text-violet-200' : 'text-gray-400 dark:text-gray-500',
                    ]">
                    <Menu class="size-6" />
                    <span>Menu</span>
                </button>
            </div>
        </nav>
    </div>
</template>
