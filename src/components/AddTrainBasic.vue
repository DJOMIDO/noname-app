<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

defineProps<{
    trainCompany: string
    trainNumber: string
    departureStation: string
    arrivalStation: string
    departureDate: string
}>()

const emit = defineEmits<{
    (e: 'update:trainCompany', value: string): void
    (e: 'update:trainNumber', value: string): void
    (e: 'update:departureStation', value: string): void
    (e: 'update:arrivalStation', value: string): void
    (e: 'update:departureDate', value: string): void
}>()
</script>

<template>
    <Card class="relative z-10 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 shadow-md">
        <CardContent class="p-6 space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add a Train – Basic</h2>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="trainCompany" @update:modelValue="emit('update:trainCompany', String($event))"
                    placeholder="Train Company (e.g. SNCF)" />
                <Input :modelValue="trainNumber" @update:modelValue="emit('update:trainNumber', String($event))"
                    placeholder="Train Number (e.g. TGV 8475)" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureStation" @update:modelValue="emit('update:departureStation', String($event))"
                    placeholder="Departure Station" />
                <Input :modelValue="arrivalStation" @update:modelValue="emit('update:arrivalStation', String($event))"
                    placeholder="Arrival Station" />
            </div>

            <Input :modelValue="departureDate" @update:modelValue="emit('update:departureDate', String($event))" type="date" />
        </CardContent>
    </Card>
</template>
