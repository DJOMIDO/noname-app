<script setup lang="ts">
import { Input } from '@/components/ui/input'
import FormField from '@/components/FormField.vue'
import StationSelector from '@/components/StationSelector.vue'
import { fieldClass } from '@/lib/formStyles'

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
    <div class="space-y-4">
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

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Departure Station" required>
                <StationSelector :model-value="departureStation"
                    @update:model-value="emit('update:departureStation', $event)" placeholder="e.g. Gare de Lyon" />
            </FormField>

            <FormField label="Arrival Station" required>
                <StationSelector :model-value="arrivalStation"
                    @update:model-value="emit('update:arrivalStation', $event)" placeholder="e.g. London St Pancras" />
            </FormField>
        </div>

        <FormField label="Departure Date" required>
            <Input :model-value="departureDate" @update:model-value="emit('update:departureDate', String($event))"
                type="date" :class="fieldClass" />
        </FormField>
    </div>
</template>
