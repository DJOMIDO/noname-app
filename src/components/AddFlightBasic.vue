<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import AirlineSelector from '@/components/AirlineSelector.vue'
import AirportSelector from '@/components/AirportSelector.vue'

defineProps<{
    airlineCode: string
    flightNumber: string
    departureAirport: string
    arrivalAirport: string
    departureDate: string
}>()

const emit = defineEmits<{
    (e: 'update:airlineCode', value: string): void
    (e: 'update:flightNumber', value: string): void
    (e: 'update:departureAirport', value: string): void
    (e: 'update:arrivalAirport', value: string): void
    (e: 'update:departureDate', value: string): void
}>()
</script>

<template>
    <Card class="relative z-10 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 shadow-md">
        <CardContent class="p-6 space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add a Flight – Basic</h2>

            <div class="grid grid-cols-2 gap-4">
                <AirlineSelector :modelValue="airlineCode" @update:modelValue="emit('update:airlineCode', $event)" />

                <Input :modelValue="flightNumber" @update:modelValue="emit('update:flightNumber', String($event))"
                    placeholder="Flight Number (e.g. 1234)" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <AirportSelector :modelValue="departureAirport"
                    @update:modelValue="emit('update:departureAirport', $event)"
                    placeholder="Departure Airport (e.g. CDG or Charles de Gaulle)" />

                <AirportSelector :modelValue="arrivalAirport" @update:modelValue="emit('update:arrivalAirport', $event)"
                    placeholder="Arrival Airport (e.g. LHR or Heathrow)" />

            </div>

            <Input :modelValue="departureDate" @update:modelValue="emit('update:departureDate', String($event))"
                type="date" />
        </CardContent>
    </Card>
</template>
