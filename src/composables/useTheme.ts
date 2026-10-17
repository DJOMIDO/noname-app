import { ref } from 'vue'

// Shared across all navigation surfaces: a single source of truth for the
// dark-mode state so the toggle stays in sync between the sidebar and menus.
const isDark = ref(false)

function apply(dark: boolean) {
    document.documentElement.classList.toggle('dark', dark)
}

export function useTheme() {
    // Read the stored preference once at app start (previously done inline in App.vue).
    const init = () => {
        isDark.value = localStorage.getItem('theme') === 'dark'
        apply(isDark.value)
    }

    const toggle = () => {
        isDark.value = !isDark.value
        apply(isDark.value)
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }

    return { isDark, init, toggle }
}
