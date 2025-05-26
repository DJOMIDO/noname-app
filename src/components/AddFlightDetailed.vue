<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{
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
    (e: `update:${keyof typeof props}`, value: string): void
}>()
</script>

<template>
    <Card class="relative z-10 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 shadow-md">
        <CardContent class="p-6 space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add a Flight – Detailed</h2>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="airlineCode" @update:modelValue="emit('update:airlineCode', $event)"
                    placeholder="Airline Code (e.g. AF)" />
                <Input :modelValue="flightNumber" @update:modelValue="emit('update:flightNumber', $event)"
                    placeholder="Flight Number (e.g. 1234)" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureAirport" @update:modelValue="emit('update:departureAirport', $event)"
                    placeholder="Departure Airport (IATA)" />
                <Input :modelValue="arrivalAirport" @update:modelValue="emit('update:arrivalAirport', $event)"
                    placeholder="Arrival Airport (IATA)" />
            </div>

            <Input :modelValue="stopoverAirport" @update:modelValue="emit('update:stopoverAirport', $event)"
                placeholder="Stopover Airport (optional)" />

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureDate" @update:modelValue="emit('update:departureDate', $event)"
                    type="date" />
                <Input :modelValue="departureTime" @update:modelValue="emit('update:departureTime', $event)"
                    type="time" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="arrivalDate" @update:modelValue="emit('update:arrivalDate', $event)" type="date" />
                <Input :modelValue="arrivalTime" @update:modelValue="emit('update:arrivalTime', $event)" type="time" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="gate" @update:modelValue="emit('update:gate', $event)"
                    placeholder="Gate (e.g. A23)" />
                <Input :modelValue="seatNumber" @update:modelValue="emit('update:seatNumber', $event)"
                    placeholder="Seat Number (e.g. 12A)" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="aircraftType" @update:modelValue="emit('update:aircraftType', $event)"
                    placeholder="Aircraft Type (e.g. A320)" />
                <Input :modelValue="aircraftReg" @update:modelValue="emit('update:aircraftReg', $event)"
                    placeholder="Registration (e.g. F-GKXA)" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="price" @update:modelValue="emit('update:price', $event)" type="number"
                    placeholder="Price (e.g. 89.50)" />
                <Input :modelValue="currency" @update:modelValue="emit('update:currency', $event)"
                    placeholder="Currency (e.g. EUR)" />
            </div>

            <Input :modelValue="bookingRef" @update:modelValue="emit('update:bookingRef', $event)"
                placeholder="Booking Reference (e.g. XYZ123)" />

            <Textarea :modelValue="notes" @update:modelValue="emit('update:notes', $event)"
                placeholder="Additional notes..." rows="3" />
        </CardContent>
    </Card>
</template>
