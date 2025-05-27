<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import AirlineSelector from '@/components/AirlineSelector.vue'
import AirportSelector from '@/components/AirportSelector.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'

defineProps<{
    airlineCode: string
    flightNumber: string
    departureAirport: string
    stopoverAirport: string
    arrivalAirport: string
    departureDate: string
    departureTime: string
    arrivalDate: string
    arrivalTime: string
    gate: string
    seatNumber: string
    aircraftType: string
    aircraftReg: string
    price: string
    currency: string
    bookingRef: string
    notes: string
}>()

const emit = defineEmits<{
    (e: 'update:airlineCode', value: string): void
    (e: 'update:flightNumber', value: string): void
    (e: 'update:departureAirport', value: string): void
    (e: 'update:stopoverAirport', value: string): void
    (e: 'update:arrivalAirport', value: string): void
    (e: 'update:departureDate', value: string): void
    (e: 'update:departureTime', value: string): void
    (e: 'update:arrivalDate', value: string): void
    (e: 'update:arrivalTime', value: string): void
    (e: 'update:gate', value: string): void
    (e: 'update:seatNumber', value: string): void
    (e: 'update:aircraftType', value: string): void
    (e: 'update:aircraftReg', value: string): void
    (e: 'update:price', value: string): void
    (e: 'update:currency', value: string): void
    (e: 'update:bookingRef', value: string): void
    (e: 'update:notes', value: string): void
}>()
</script>

<template>
    <Card class="relative z-10 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 shadow-md">
        <CardContent class="p-6 space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add a Flight – Detailed</h2>

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

            <Input :modelValue="stopoverAirport" @update:modelValue="emit('update:stopoverAirport', String($event))"
                placeholder="Stopover Airport (optional)" />

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureDate" @update:modelValue="emit('update:departureDate', String($event))"
                    type="date" />
                <Input :modelValue="departureTime" @update:modelValue="emit('update:departureTime', String($event))"
                    type="time" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="arrivalDate" @update:modelValue="emit('update:arrivalDate', String($event))"
                    type="date" />
                <Input :modelValue="arrivalTime" @update:modelValue="emit('update:arrivalTime', String($event))"
                    type="time" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="gate" @update:modelValue="emit('update:gate', String($event))"
                    placeholder="Gate (e.g. A23)" />
                <Input :modelValue="seatNumber" @update:modelValue="emit('update:seatNumber', String($event))"
                    placeholder="Seat Number (e.g. 12A)" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="aircraftType" @update:modelValue="emit('update:aircraftType', String($event))"
                    placeholder="Aircraft Type (e.g. A320)" />
                <Input :modelValue="aircraftReg" @update:modelValue="emit('update:aircraftReg', String($event))"
                    placeholder="Registration (e.g. F-GKXA)" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="price" @update:modelValue="emit('update:price', String($event))" type="number"
                    placeholder="Price (e.g. 89.50)" />
                <CurrencySelector :modelValue="currency" @update:modelValue="emit('update:currency', $event)" />
            </div>

            <Input :modelValue="bookingRef" @update:modelValue="emit('update:bookingRef', String($event))"
                placeholder="Booking Reference (e.g. XYZ123)" />

            <Textarea :modelValue="notes" @update:modelValue="emit('update:notes', String($event))"
                placeholder="Additional notes..." rows="3" />
        </CardContent>
    </Card>
</template>
