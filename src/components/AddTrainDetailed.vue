<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{
    trainCompany: string
    trainNumber: string
    trainType: string
    departureStation: string
    arrivalStation: string
    departureCity: string
    arrivalCity: string
    departureDate: string
    departureTime: string
    arrivalDate: string
    arrivalTime: string
    coach: string
    seatNumber: string
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
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add a Train – Detailed</h2>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="trainCompany" @update:modelValue="emit('update:trainCompany', $event)"
                    placeholder="Train Company" />
                <Input :modelValue="trainNumber" @update:modelValue="emit('update:trainNumber', $event)"
                    placeholder="Train Number" />
            </div>

            <Input :modelValue="trainType" @update:modelValue="emit('update:trainType', $event)"
                placeholder="Train Type (e.g. TGV, ICE)" />

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureStation" @update:modelValue="emit('update:departureStation', $event)"
                    placeholder="Departure Station" />
                <Input :modelValue="arrivalStation" @update:modelValue="emit('update:arrivalStation', $event)"
                    placeholder="Arrival Station" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureCity" @update:modelValue="emit('update:departureCity', $event)"
                    placeholder="Departure City (optional)" />
                <Input :modelValue="arrivalCity" @update:modelValue="emit('update:arrivalCity', $event)"
                    placeholder="Arrival City (optional)" />
            </div>

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
                <Input :modelValue="coach" @update:modelValue="emit('update:coach', $event)" placeholder="Coach" />
                <Input :modelValue="seatNumber" @update:modelValue="emit('update:seatNumber', $event)"
                    placeholder="Seat Number" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="price" @update:modelValue="emit('update:price', $event)" type="number"
                    placeholder="Price" />
                <Input :modelValue="currency" @update:modelValue="emit('update:currency', $event)"
                    placeholder="Currency" />
            </div>

            <Input :modelValue="bookingRef" @update:modelValue="emit('update:bookingRef', $event)"
                placeholder="Booking Reference" />
            <Textarea :modelValue="notes" @update:modelValue="emit('update:notes', $event)"
                placeholder="Additional notes..." rows="3" />
        </CardContent>
    </Card>
</template>
