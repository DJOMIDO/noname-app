<script setup lang="ts">
import { supabase } from '@/lib/supabase'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const props = defineProps<{
  icon: string
  title: string
  to: string
}>()

const router = useRouter()

const handleClick = async () => {
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    toast.error('Please log in to access this feature.')
    return
  }

  router.push(props.to)
}
</script>

<template>
  <div @click="handleClick"
    class="relative z-10 cursor-pointer bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-colors flex flex-col items-center text-center">
    <img :src="icon" alt="icon" class="w-12 h-12 mb-3 object-contain" />
    <div class="text-lg font-semibold text-gray-800 dark:text-gray-100">
      {{ title }}
    </div>
  </div>
</template>
