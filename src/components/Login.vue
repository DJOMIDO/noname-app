<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AuthShell from '@/components/AuthShell.vue'
import { fieldClass } from '@/lib/formStyles'
import { client } from '@/lib/neon'
import { useAuthUser } from '@/composables/useAuthUser'
import { toast } from 'vue-sonner'

const email = ref('')
const password = ref('')
const submitting = ref(false)
const router = useRouter()
const route = useRoute()
const { refresh } = useAuthUser()

// Only allow in-app redirects (single leading slash, no protocol-relative //).
const safeNext = () => {
  const next = route.query.next
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) return next
  return '/home'
}

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.error('Please enter both email and password.')
    return
  }

  submitting.value = true
  try {
    const { error } = await client.auth.signIn.email({
      email: email.value,
      password: password.value
    })

    if (error) {
      toast.error(error.message || 'Invalid email or password.')
    } else {
      toast.success('Logged in successfully!')
      // Update the shared session so pages switch to the member view immediately.
      await refresh()
      router.push(safeNext())
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="text-center">
      <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        Welcome
        <span class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">back</span>
      </h1>
      <p class="mt-2 text-gray-500 dark:text-gray-300">Log in to continue your journey.</p>
    </div>

    <form class="mt-8 flex flex-col space-y-4" @submit.prevent="handleLogin">
      <div class="space-y-1.5">
        <label for="login-email" class="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
        <Input id="login-email" type="email" placeholder="you@example.com" v-model="email" autocomplete="email"
          :class="fieldClass" />
      </div>

      <div class="space-y-1.5">
        <label for="login-password" class="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
        <Input id="login-password" type="password" placeholder="••••••••" v-model="password"
          autocomplete="current-password"
          :class="fieldClass" />
      </div>

      <div class="flex items-center justify-end text-sm">
        <RouterLink to="/forgot-password" class="text-brand hover:underline dark:text-violet-300">Forgot password?</RouterLink>
      </div>

      <Button type="submit" class="mt-2 w-full border-0 bg-sunset font-semibold
        text-white shadow-lg shadow-sunset/30 transition-all duration-300
        hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40 disabled:pointer-events-none disabled:opacity-60"
        :disabled="submitting">
        {{ submitting ? 'Logging in…' : 'Log In' }}
      </Button>

      <p class="text-sm text-center text-gray-600 dark:text-gray-300">
        Don't have an account?
        <RouterLink to="/signup" class="font-medium text-brand hover:underline dark:text-violet-300">Sign Up</RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
