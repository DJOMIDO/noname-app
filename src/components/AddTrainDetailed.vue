<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FormField from '@/components/FormField.vue'
import StationSelector from '@/components/StationSelector.vue'
import CitySelector from '@/components/CitySelector.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import { fieldClass } from '@/lib/formStyles'

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
    (e: 'update:trainCompany', value: string): void
    (e: 'update:trainNumber', value: string): void
    (e: 'update:trainType', value: string): void
    (e: 'update:departureStation', value: string): void
    (e: 'update:arrivalStation', value: string): void
    (e: 'update:departureCity', value: string): void
    (e: 'update:arrivalCity', value: string): void
    (e: 'update:departureDate', value: string): void
    (e: 'update:departureTime', value: string): void
    (e: 'update:arrivalDate', value: string): void
    (e: 'update:arrivalTime', value: string): void
    (e: 'update:coach', value: string): void
    (e: 'update:seatNumber', value: string): void
    (e: 'update:price', value: string): void
    (e: 'update:currency', value: string): void
    (e: 'update:bookingRef', value: string): void
    (e: 'update:notes', value: string): void
}>()
</script>

<template>
    <div class="space-y-6">
        <!-- Route -->
        <fieldset class="space-y-4">
            <legend class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Route</legend>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Train Company" required>
                    <Input :model-value="trainCompany"
                        @update:model-value="emit('update:trainCompany', String($event))" placeholder="e.g. SNCF"
                        :class="fieldClass" />
                </FormField>
                <FormField label="Train Number" required>
                    <Input :model-value="trainNumber" @update:model-value="emit('update:trainNumber', String($event))"
                        placeholder="e.g. TGV 8475" :class="fieldClass" />
                </FormField>
            </div>

            <FormField label="Train Type">
                <Input :model-value="trainType" @update:model-value="emit('update:trainType', String($event))"
                    placeholder="e.g. TGV, ICE" :class="fieldClass" />
            </FormField>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Departure Station" required>
                    <StationSelector :model-value="departureStation"
                        @update:model-value="emit('update:departureStation', $event)"
                        placeholder="e.g. Gare de Lyon" />
                </FormField>
                <FormField label="Arrival Station" required>
                    <StationSelector :model-value="arrivalStation"
                        @update:model-value="emit('update:arrivalStation', $event)"
                        placeholder="e.g. London St Pancras" />
                </FormField>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Departure City">
                    <CitySelector :model-value="departureCity"
                        @update:model-value="emit('update:departureCity', $event)" placeholder="Optional" />
                </FormField>
                <FormField label="Arrival City">
                    <CitySelector :model-value="arrivalCity"
                        @update:model-value="emit('update:arrivalCity', $event)" placeholder="Optional" />
                </FormField>
            </div>
        </fieldset>

        <!-- Schedule -->
        <fieldset class="space-y-4">
            <legend class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Schedule</legend>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Departure Date" required>
                    <Input :model-value="departureDate"
                        @update:model-value="emit('update:departureDate', String($event))" type="date"
                        :class="fieldClass" />
                </FormField>
                <FormField label="Departure Time">
                    <Input :model-value="departureTime"
                        @update:model-value="emit('update:departureTime', String($event))" type="time"
                        :class="fieldClass" />
                </FormField>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Arrival Date">
                    <Input :model-value="arrivalDate"
                        @update:model-value="emit('update:arrivalDate', String($event))" type="date"
                        :class="fieldClass" />
                </FormField>
                <FormField label="Arrival Time">
                    <Input :model-value="arrivalTime"
                        @update:model-value="emit('update:arrivalTime', String($event))" type="time"
                        :class="fieldClass" />
                </FormField>
            </div>
        </fieldset>

        <!-- Seat -->
        <fieldset class="space-y-4">
            <legend class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Seat</legend>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Coach">
                    <Input :model-value="coach" @update:model-value="emit('update:coach', String($event))"
                        placeholder="e.g. 12" :class="fieldClass" />
                </FormField>
                <FormField label="Seat Number">
                    <Input :model-value="seatNumber" @update:model-value="emit('update:seatNumber', String($event))"
                        placeholder="e.g. 45B" :class="fieldClass" />
                </FormField>
            </div>
        </fieldset>

        <!-- Booking -->
        <fieldset class="space-y-4">
            <legend class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Booking</legend>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Price">
                    <Input :model-value="price" @update:model-value="emit('update:price', String($event))" type="number"
                        placeholder="e.g. 120.00" :class="fieldClass" />
                </FormField>
                <FormField label="Currency">
                    <CurrencySelector :model-value="currency"
                        @update:model-value="emit('update:currency', $event)" />
                </FormField>
            </div>

            <FormField label="Booking Reference">
                <Input :model-value="bookingRef" @update:model-value="emit('update:bookingRef', String($event))"
                    placeholder="e.g. XYZ123" :class="fieldClass" />
            </FormField>

            <FormField label="Notes">
                <Textarea :model-value="notes" @update:model-value="emit('update:notes', String($event))"
                    placeholder="Additional notes..." rows="3" :class="fieldClass" />
            </FormField>
        </fieldset>
    </div>
</template>
