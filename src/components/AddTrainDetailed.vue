<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

defineProps<{
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
                <Input :modelValue="trainCompany" @update:modelValue="emit('update:trainCompany', String($event))"
                    placeholder="Train Company" />
                <Input :modelValue="trainNumber" @update:modelValue="emit('update:trainNumber', String($event))"
                    placeholder="Train Number" />
            </div>

            <Input :modelValue="trainType" @update:modelValue="emit('update:trainType', String($event))"
                placeholder="Train Type (e.g. TGV, ICE)" />

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureStation" @update:modelValue="emit('update:departureStation', String($event))"
                    placeholder="Departure Station" />
                <Input :modelValue="arrivalStation" @update:modelValue="emit('update:arrivalStation', String($event))"
                    placeholder="Arrival Station" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureCity" @update:modelValue="emit('update:departureCity', String($event))"
                    placeholder="Departure City (optional)" />
                <Input :modelValue="arrivalCity" @update:modelValue="emit('update:arrivalCity', String($event))"
                    placeholder="Arrival City (optional)" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="departureDate" @update:modelValue="emit('update:departureDate', String($event))"
                    type="date" />
                <Input :modelValue="departureTime" @update:modelValue="emit('update:departureTime', String($event))"
                    type="time" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="arrivalDate" @update:modelValue="emit('update:arrivalDate', String($event))" type="date" />
                <Input :modelValue="arrivalTime" @update:modelValue="emit('update:arrivalTime', String($event))" type="time" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="coach" @update:modelValue="emit('update:coach', String($event))" placeholder="Coach" />
                <Input :modelValue="seatNumber" @update:modelValue="emit('update:seatNumber', String($event))"
                    placeholder="Seat Number" />
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Input :modelValue="price" @update:modelValue="emit('update:price', String($event))" type="number"
                    placeholder="Price" />
                <Input :modelValue="currency" @update:modelValue="emit('update:currency', String($event))"
                    placeholder="Currency" />
            </div>

            <Input :modelValue="bookingRef" @update:modelValue="emit('update:bookingRef', String($event))"
                placeholder="Booking Reference" />
            <Textarea :modelValue="notes" @update:modelValue="emit('update:notes', String($event))"
                placeholder="Additional notes..." rows="3" />
        </CardContent>
    </Card>
</template>
