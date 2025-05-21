<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const router = useRouter()
const goBack = () => {
    router.back()
}
</script>

<template>
    <Button @click="goBack" variant="ghost" class="flex items-center gap-2">
        <ArrowLeft class="w-4 h-4" />
        Back
    </Button>
</template>
