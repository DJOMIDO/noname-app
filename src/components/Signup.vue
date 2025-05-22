<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

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

  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      emailRedirectTo: 'http://localhost:5173/login',
      data: {
        username: username.value
      }
    }
  })

  if (error) {
    if (error.message.includes('User already registered')) {
      toast.error('This email is already registered. Please log in.')
    } else {
      toast.error(error.message)
    }
  } else {
    console.log('Registration successful:', data)
    toast.success('Registration successful. Check your email to verify your account.')
  }
}

</script>

<template>
  <div class="flex flex-col md:flex-row min-h-screen dark:bg-gray-900 transition-colors">

    <div class="hidden md:flex w-1/2 items-center justify-center bg-white/80 dark:bg-gray-900">
      <img src="@/assets/images/Login.svg" class="max-w-full max-h-full object-contain" alt="Signup background" />
    </div>

    <img src="@/assets/images/Login.svg"
      class="block md:hidden absolute top-5 left-1/2 -translate-x-1/2 w-64 opacity-100 pointer-events-none select-none" />

    <div class="flex-1 flex items-center justify-center bg-white/80 dark:bg-gray-900">
      <Card
        class="w-[90%] max-w-[360px] h-[520px] backdrop-blur-sm bg-white/80 dark:bg-white/10 shadow-md transition-colors">
        <CardContent class="p-6 flex flex-col justify-between h-full">

          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Hello, there!</h1>
            <p class="text-xl text-gray-500 dark:text-gray-300">Please create your account.</p>
          </div>

          <div class="flex flex-col space-y-4 justify-center">
            <Input placeholder="Username" v-model="username" />
            <Input placeholder="Email" type="email" v-model="email" />
            <Input type="password" placeholder="Password" v-model="password" />
            <Input type="password" placeholder="Confirm Password" v-model="confirmPassword" />
          </div>

          <div class="flex flex-col space-y-3">
            <Button class="w-full" @click="handleSignup">Sign Up</Button>
            <p class="text-sm text-center text-gray-600 dark:text-gray-300">
              Already have an account?
              <RouterLink to="/login" class="text-indigo-500 hover:underline">Log In</RouterLink>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  </div>
</template>
