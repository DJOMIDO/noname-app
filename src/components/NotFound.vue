<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import notFoundImg from '@/assets/images/404.svg'

const router = useRouter()

const goBack = () => {
  // Fall back to the home page when there is no in-app history to return to.
  if (window.history.length > 1) router.back()
  else router.push('/home')
}
</script>

<template>
  <section class="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 pt-[calc(2.5rem_+_env(safe-area-inset-top,0px))] pb-[calc(6rem_+_env(safe-area-inset-bottom,0px))] transition-colors
    bg-gradient-to-b from-lilac/40 via-white to-white
    text-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 dark:text-gray-100">

    <!-- Ambient animated gradient blobs -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div
        class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-mint/30 blur-3xl dark:bg-mint/15" />
      <div
        class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-sunset/25 blur-3xl [animation-delay:5s] dark:bg-sunset/15" />
      <div
        class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-brand/20 blur-3xl [animation-delay:9s] dark:bg-brand/15" />
    </div>

    <div class="relative z-10 flex w-full flex-col items-center text-center">
      <img :src="notFoundImg" alt="404 not found"
        class="animate-in fade-in zoom-in w-full max-w-[360px] animate-float object-contain drop-shadow-2xl" />

      <h1 class="animate-in fade-in slide-in-from-bottom-6 mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
        <span class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">404</span>
      </h1>

      <p class="animate-in fade-in slide-in-from-bottom-6 mt-4 max-w-md text-base text-gray-600 [animation-delay:150ms] sm:text-lg dark:text-gray-300">
        Looks like this stop isn't on your itinerary.
      </p>

      <div class="animate-in fade-in slide-in-from-bottom-6 mt-8 flex flex-wrap items-center justify-center gap-3 [animation-delay:300ms]">
        <Button class="border-0 bg-sunset font-semibold
          text-white shadow-lg shadow-sunset/30 transition-all duration-300
          hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40"
          @click="router.push('/home')">
          Back to Home
        </Button>
        <Button variant="outline" class="font-semibold" @click="goBack">
          Go back
        </Button>
      </div>
    </div>
  </section>
</template>
