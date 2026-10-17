import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { client } from '@/lib/neon'

// Session user shape as returned by the Neon Auth client (`User | null`).
type AuthSession = Awaited<ReturnType<typeof client.auth.getSession>>['data']['session']
export type AuthUser = NonNullable<AuthSession>['user']

const user = ref<AuthUser | null>(null)
// Whether the first session read has settled, so pages can tell
// "still resolving" apart from "resolved, no user" and avoid flashing
// the guest state on load.
const ready = ref(false)
let inflight: Promise<void> | null = null

export function useAuthUser() {
    const router = useRouter()

    const resolve = async () => {
        const { data } = await client.auth.getSession()
        user.value = data?.user ?? null
        ready.value = true
    }

    // Shared across the sidebar and bottom bar (both stay mounted); fetch once.
    const fetchUser = async () => {
        if (!inflight) {
            inflight = resolve()
        }
        await inflight
    }

    // Force a fresh read of the session (after login/signup) so pages can
    // transition from guest to member without a full reload.
    const refresh = async () => {
        inflight = resolve()
        await inflight
    }

    const logout = async () => {
        await client.auth.signOut()
        user.value = null
        inflight = null
        router.push('/')
    }

    const isLoggedIn = computed(() => user.value !== null)

    return { user, isLoggedIn, ready, fetchUser, refresh, logout }
}
