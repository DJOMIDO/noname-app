import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { client } from '@/lib/neon'

const user = ref<any | null>(null)
let inflight: Promise<void> | null = null

export function useAuthUser() {
    const router = useRouter()

    // Shared across the sidebar and bottom bar (both stay mounted); fetch once.
    const fetchUser = async () => {
        if (!inflight) {
            inflight = client.auth.getUser().then(({ data }) => {
                user.value = data.user ?? null
            })
        }
        await inflight
    }

    const logout = async () => {
        await client.auth.signOut()
        user.value = null
        inflight = null
        router.push('/')
    }

    return { user, fetchUser, logout }
}
