<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AuthShell from '@/components/AuthShell.vue'
import { fieldClass } from '@/lib/formStyles'
import { client } from '@/lib/neon'
import { toast } from 'vue-sonner'

const email = ref('')
const submitting = ref(false)
const router = useRouter()

const handleForgot = async () => {
  if (!email.value) {
    toast.error('Please enter your email address.')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    toast.error('Invalid email format.')
    return
  }

  submitting.value = true
  try {
    const { error } = await client.auth.forgetPassword.emailOtp({ email: email.value })
    if (error) {
      toast.error(error.message || 'Unable to send the reset code. Please try again.')
      return
    }
    // better-auth answers identically whether or not the email is registered,
    // so never reveal existence here — the next step surfaces any mismatch.
    router.push({ path: '/reset-password', query: { email: email.value } })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="text-center">
      <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        Forgot
        <span class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">password?</span>
      </h1>
      <p class="mt-2 text-gray-500 dark:text-gray-300">Enter your email and we'll send you a reset code.</p>
    </div>

    <form class="mt-8 flex flex-col space-y-4" @submit.prevent="handleForgot">
      <div class="space-y-1.5">
        <label for="forgot-email" class="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
        <Input id="forgot-email" type="email" placeholder="you@example.com" v-model="email" autocomplete="email"
          :class="fieldClass" />
      </div>

      <Button type="submit" class="mt-2 w-full border-0 bg-sunset font-semibold
        text-white shadow-lg shadow-sunset/30 transition-all duration-300
        hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40 disabled:pointer-events-none disabled:opacity-60"
        :disabled="submitting">
        {{ submitting ? 'Sending code…' : 'Send Reset Code' }}
      </Button>

      <p class="text-sm text-center text-gray-600 dark:text-gray-300">
        Remembered it?
        <RouterLink to="/login" class="font-medium text-brand hover:underline dark:text-violet-300">Back to Log In</RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
