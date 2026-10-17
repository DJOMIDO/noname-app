<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AuthShell from '@/components/AuthShell.vue'
import { fieldClass } from '@/lib/formStyles'
import { client } from '@/lib/neon'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()

// Prefill the email carried over from the forgot-password step; the field
// stays editable so users who land here directly can still complete the flow.
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const handleReset = async () => {
  if (!email.value || !code.value || !password.value || !confirmPassword.value) {
    toast.error('Please fill out all fields.')
    return
  }

  if (password.value !== confirmPassword.value) {
    toast.error('Passwords do not match.')
    return
  }

  submitting.value = true
  try {
    const { error } = await client.auth.emailOtp.resetPassword({
      email: email.value,
      otp: code.value,
      password: password.value
    })

    if (error) {
      toast.error(error.message || 'Invalid or expired code. Please try again.')
    } else {
      toast.success('Password reset successfully. Please log in with your new password.')
      router.push('/login')
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
        Reset
        <span class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">password</span>
      </h1>
      <p class="mt-2 text-gray-500 dark:text-gray-300">Enter the 6-digit code we emailed you, plus your new password.</p>
    </div>

    <form class="mt-8 flex flex-col space-y-4" @submit.prevent="handleReset">
      <div class="space-y-1.5">
        <label for="reset-email" class="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
        <Input id="reset-email" type="email" placeholder="you@example.com" v-model="email" autocomplete="email"
          :class="fieldClass" />
      </div>

      <div class="space-y-1.5">
        <label for="reset-code" class="text-sm font-medium text-gray-700 dark:text-gray-200">Reset Code</label>
        <Input id="reset-code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" maxlength="6"
          v-model="code" :class="fieldClass" />
      </div>

      <div class="space-y-1.5">
        <label for="reset-password" class="text-sm font-medium text-gray-700 dark:text-gray-200">New Password</label>
        <Input id="reset-password" type="password" placeholder="••••••••" v-model="password"
          autocomplete="new-password" :class="fieldClass" />
      </div>

      <div class="space-y-1.5">
        <label for="reset-confirm" class="text-sm font-medium text-gray-700 dark:text-gray-200">Confirm New Password</label>
        <Input id="reset-confirm" type="password" placeholder="••••••••" v-model="confirmPassword"
          autocomplete="new-password" :class="fieldClass" />
      </div>

      <Button type="submit" class="mt-2 w-full border-0 bg-sunset font-semibold
        text-white shadow-lg shadow-sunset/30 transition-all duration-300
        hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40 disabled:pointer-events-none disabled:opacity-60"
        :disabled="submitting">
        {{ submitting ? 'Resetting…' : 'Reset Password' }}
      </Button>

      <p class="text-sm text-center text-gray-600 dark:text-gray-300">
        Changed your mind?
        <RouterLink to="/login" class="font-medium text-brand hover:underline dark:text-violet-300">Back to Log In</RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
