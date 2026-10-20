<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FormField from '@/components/FormField.vue'
import FormDisclosure from '@/components/FormDisclosure.vue'
import AirlineSelector from '@/components/AirlineSelector.vue'
import AirportSelector from '@/components/AirportSelector.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'
import { fieldClass } from '@/lib/formStyles'

/**
 * FlightFormFields — the whole flight form in one view: the essentials
 * (carrier, number, route, schedule, seat) stay visible, and the finer details
 * collapse behind a "More details" disclosure. Shared by the Add Flight page and
 * the flight edit view. `expandMore` seeds that disclosure open, so the edit page
 * can reveal fields a record already has values for.
 */
const props = withDefaults(defineProps<{
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
    expandMore?: boolean
}>(), { expandMore: false })

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

const moreOpen = ref(props.expandMore)
</script>

<template>
    <div class="space-y-6">
        <!-- Route -->
        <fieldset class="space-y-4">
            <legend class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Route</legend>
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
                        @update:model-value="emit('update:arrivalAirport', $event)"
                        placeholder="e.g. LHR or Heathrow" />
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
                <FormField label="Seat Number">
                    <Input :model-value="seatNumber"
                        @update:model-value="emit('update:seatNumber', String($event))" placeholder="e.g. 12A"
                        :class="fieldClass" />
                </FormField>
            </div>
        </fieldset>

        <!-- Everything else, collapsed by default -->
        <FormDisclosure v-model:open="moreOpen" label="More details" hint="Stopover, aircraft, fare, notes">
            <div class="space-y-4">
                <FormField label="Stopover Airport">
                    <AirportSelector :model-value="stopoverAirport"
                        @update:model-value="emit('update:stopoverAirport', $event)"
                        placeholder="Optional — e.g. JFK" />
                </FormField>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Gate">
                        <Input :model-value="gate" @update:model-value="emit('update:gate', String($event))"
                            placeholder="e.g. A23" :class="fieldClass" />
                    </FormField>
                    <FormField label="Booking Reference">
                        <Input :model-value="bookingRef"
                            @update:model-value="emit('update:bookingRef', String($event))" placeholder="e.g. XYZ123"
                            :class="fieldClass" />
                    </FormField>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Aircraft Type">
                        <Input :model-value="aircraftType"
                            @update:model-value="emit('update:aircraftType', String($event))" placeholder="e.g. A320"
                            :class="fieldClass" />
                    </FormField>
                    <FormField label="Registration">
                        <Input :model-value="aircraftReg"
                            @update:model-value="emit('update:aircraftReg', String($event))" placeholder="e.g. F-GKXA"
                            :class="fieldClass" />
                    </FormField>
                </div>

                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Price">
                        <Input :model-value="price" @update:model-value="emit('update:price', String($event))"
                            type="number" placeholder="e.g. 89.50" :class="fieldClass" />
                    </FormField>
                    <FormField label="Currency">
                        <CurrencySelector :model-value="currency"
                            @update:model-value="emit('update:currency', $event)" />
                    </FormField>
                </div>

                <FormField label="Notes">
                    <Textarea :model-value="notes" @update:model-value="emit('update:notes', String($event))"
                        placeholder="Additional notes..." rows="3" :class="fieldClass" />
                </FormField>
            </div>
        </FormDisclosure>
    </div>
</template>
