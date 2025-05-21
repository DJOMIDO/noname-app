<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'

const email = ref('')
const password = ref('')
const router = useRouter()

const handleLogin = async () => {
    if (!email.value || !password.value) {
        toast.error('Please enter both email and password.')
        return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
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
}
</script>

<template>
  <div class="flex flex-col md:flex-row min-h-screen dark:bg-gray-900 transition-colors">

    <div class="w-full md:w-1/2 flex items-center justify-center bg-white/80 dark:bg-gray-900">
      <img src="@/assets/images/Login.svg" class="max-w-full max-h-full object-contain" alt="Login background" />
    </div>

    <div class="hidden md:flex w-1/2 items-center justify-center bg-white/80 dark:bg-gray-900">
      <Card class="w-[90%] max-w-[360px] h-[520px] backdrop-blur-sm bg-white/80 dark:bg-white/10 shadow-md transition-colors">
        <CardContent class="p-6 flex flex-col justify-between h-full">

          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Welcome back,</h1>
            <p class="text-xl text-gray-500 dark:text-gray-300">please log in.</p>
          </div>

          <div class="flex flex-col space-y-4 justify-center">
            <Input placeholder="Email" type="email" v-model="email" />
            <Input type="password" placeholder="Password" v-model="password" />
            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                <input type="checkbox" class="accent-indigo-500" />
                <span>Remember me</span>
              </label>
              <a href="#" class="text-indigo-500 hover:underline">Forgot password?</a>
            </div>
          </div>

          <div class="flex flex-col space-y-3">
            <Button class="w-full" @click="handleLogin">Log In</Button>
            <p class="text-sm text-center text-gray-600 dark:text-gray-300">
              Don't have an account?
              <RouterLink to="/signup" class="text-indigo-500 hover:underline">Sign Up</RouterLink>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  </div>
</template>
