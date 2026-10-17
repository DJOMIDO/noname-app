<script setup lang="ts">
import { Input } from '@/components/ui/input'
import FormField from '@/components/FormField.vue'
import AirlineSelector from '@/components/AirlineSelector.vue'
import AirportSelector from '@/components/AirportSelector.vue'
import { fieldClass } from '@/lib/formStyles'

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
    <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Airline" required>
                <AirlineSelector :model-value="airlineCode"
                    @update:model-value="emit('update:airlineCode', $event)" />
            </FormField>

            <FormField label="Flight Number" required>
                <Input :model-value="flightNumber" @update:model-value="emit('update:flightNumber', String($event))"
                    placeholder="e.g. 1234" :class="fieldClass" />
            </FormField>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Departure Airport" required>
                <AirportSelector :model-value="departureAirport"
                    @update:model-value="emit('update:departureAirport', $event)"
                    placeholder="e.g. CDG or Charles de Gaulle" />
            </FormField>

            <FormField label="Arrival Airport" required>
                <AirportSelector :model-value="arrivalAirport"
                    @update:model-value="emit('update:arrivalAirport', $event)" placeholder="e.g. LHR or Heathrow" />
            </FormField>
        </div>

        <FormField label="Departure Date" required>
            <Input :model-value="departureDate" @update:model-value="emit('update:departureDate', String($event))"
                type="date" :class="fieldClass" />
        </FormField>
    </div>
</template>
