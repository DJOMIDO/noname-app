<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AuthShell from '@/components/AuthShell.vue'
import { client } from '@/lib/neon'
import { toast } from 'vue-sonner'

const email = ref('')
const password = ref('')
const submitting = ref(false)
const router = useRouter()

const handleLogin = async () => {
  if (!email.value || !password.value) {
    toast.error('Please enter both email and password.')
    return
  }

  submitting.value = true
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Logged in successfully!')
      console.log('User session:', data)
      router.push('/home')
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
        <span class="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">back</span>
      </h1>
      <p class="mt-2 text-gray-500 dark:text-gray-300">Log in to continue your journey.</p>
    </div>

    <form class="mt-8 flex flex-col space-y-4" @submit.prevent="handleLogin">
      <div class="space-y-1.5">
        <label for="login-email" class="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
        <Input id="login-email" type="email" placeholder="you@example.com" v-model="email" autocomplete="email"
          class="border-indigo-200/60 bg-white/70 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/40 dark:border-white/10 dark:bg-white/5" />
      </div>

      <div class="space-y-1.5">
        <label for="login-password" class="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
        <Input id="login-password" type="password" placeholder="••••••••" v-model="password"
          autocomplete="current-password"
          class="border-indigo-200/60 bg-white/70 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/40 dark:border-white/10 dark:bg-white/5" />
      </div>

      <div class="flex items-center justify-between text-sm">
        <label class="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
          <input type="checkbox" class="accent-indigo-500" />
          <span>Remember me</span>
        </label>
        <a href="#" class="text-indigo-500 hover:underline">Forgot password?</a>
      </div>

      <Button type="submit" class="mt-2 w-full border-0 bg-gradient-to-r from-indigo-500 to-violet-500 font-semibold
        text-white shadow-lg shadow-indigo-500/25 transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 disabled:pointer-events-none disabled:opacity-60"
        :disabled="submitting">
        {{ submitting ? 'Logging in…' : 'Log In' }}
      </Button>

      <p class="text-sm text-center text-gray-600 dark:text-gray-300">
        Don't have an account?
        <RouterLink to="/signup" class="font-medium text-indigo-500 hover:underline">Sign Up</RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
