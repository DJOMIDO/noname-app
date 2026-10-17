<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AuthShell from '@/components/AuthShell.vue'
import { authRedirectUrl, client } from '@/lib/neon'
import { toast } from 'vue-sonner'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const handleSignup = async () => {

  if (!username.value) {
    toast.error('Please enter a username.')
    return
  }

  if (!email.value || !password.value || !confirmPassword.value) {
    toast.error('Please fill out all fields.')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    toast.error('Invalid email format.')
    return
  }

  if (password.value !== confirmPassword.value) {
    toast.error('Passwords do not match.')
    return
  }

  submitting.value = true
  try {
    const { data, error } = await client.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          displayName: username.value
        },
        emailRedirectTo: authRedirectUrl
      }
    })

    if (error) {
      if (error.code === 'user_already_exists' || error.code === 'email_exists') {
        toast.error('This email is already registered. Please log in.')
      } else if (error.code === 'session_not_found') {
        // Neon Auth creates the account but withholds the session until the
        // email address is verified.
        toast.success('Registration successful. Check your email to verify your account.')
      } else {
        toast.error(error.message)
      }
    } else {
      console.log('Registration successful:', data)
      toast.success('Registration successful. You are now logged in.')
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
        Hello,
        <span class="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">there</span>!
      </h1>
      <p class="mt-2 text-gray-500 dark:text-gray-300">Create your account and start your story.</p>
    </div>

    <form class="mt-8 flex flex-col space-y-4" @submit.prevent="handleSignup">
      <div class="space-y-1.5">
        <label for="signup-username" class="text-sm font-medium text-gray-700 dark:text-gray-200">Username</label>
        <Input id="signup-username" placeholder="Your name" v-model="username" autocomplete="name"
          class="border-indigo-200/60 bg-white/70 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/40 dark:border-white/10 dark:bg-white/5" />
      </div>

      <div class="space-y-1.5">
        <label for="signup-email" class="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
        <Input id="signup-email" type="email" placeholder="you@example.com" v-model="email" autocomplete="email"
          class="border-indigo-200/60 bg-white/70 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/40 dark:border-white/10 dark:bg-white/5" />
      </div>

      <div class="space-y-1.5">
        <label for="signup-password" class="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
        <Input id="signup-password" type="password" placeholder="••••••••" v-model="password"
          autocomplete="new-password"
          class="border-indigo-200/60 bg-white/70 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/40 dark:border-white/10 dark:bg-white/5" />
      </div>

      <div class="space-y-1.5">
        <label for="signup-confirm" class="text-sm font-medium text-gray-700 dark:text-gray-200">Confirm Password</label>
        <Input id="signup-confirm" type="password" placeholder="••••••••" v-model="confirmPassword"
          autocomplete="new-password"
          class="border-indigo-200/60 bg-white/70 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/40 dark:border-white/10 dark:bg-white/5" />
      </div>

      <Button type="submit" class="mt-2 w-full border-0 bg-gradient-to-r from-indigo-500 to-violet-500 font-semibold
        text-white shadow-lg shadow-indigo-500/25 transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 disabled:pointer-events-none disabled:opacity-60"
        :disabled="submitting">
        {{ submitting ? 'Creating account…' : 'Sign Up' }}
      </Button>

      <p class="text-sm text-center text-gray-600 dark:text-gray-300">
        Already have an account?
        <RouterLink to="/login" class="font-medium text-indigo-500 hover:underline">Log In</RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
