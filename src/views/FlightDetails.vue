<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton.vue'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import iconPlane from '@/assets/images/flight.png'
import airlines from '@/assets/data/airlines.json'
import airports from '@/assets/data/airports.json'
import AirlineSelector from '@/components/AirlineSelector.vue'
import AirportSelector from '@/components/AirportSelector.vue'
import CurrencySelector from '@/components/CurrencySelector.vue'

const route = useRoute()
const router = useRouter()

const isEditing = ref(false)
const flight = ref<any>(null)
const loading = ref(true)

const form = ref({
    airline_code: '',
    flight_number: '',
    departure_airport: '',
    arrival_airport: '',
    stopover_airport: '',
    departure_city: '',
    arrival_city: '',
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    seat_number: '',
    booking_ref: '',
    gate: '',
    aircraft_type: '',
    aircraft_reg: '',
    price: '',
    currency: '',
    notes: ''
})

const airlineDisplayName = computed(() => {
    const code = form.value.airline_code
    const match = airlines.find(a => a.code === code)
    return match ? match.name : code || 'Unknown Airline'
})

const getCityFromIATA = (code: string): string | null => {
    const match = airports.find(a => a.iata === code)
    return match?.city || null
}

const fetchFlight = async () => {
    const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('id', route.params.id)
        .single()

    if (error) {
        toast.error('Failed to load flight record.')
    } else {
        if (!data.departure_city) data.departure_city = getCityFromIATA(data.departure_airport) || ''
        if (!data.arrival_city) data.arrival_city = getCityFromIATA(data.arrival_airport) || ''

        flight.value = data
        Object.assign(form.value, data)
    }
    loading.value = false
}

const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this flight?')
    if (!confirmDelete) return

    const { error } = await supabase.from('flights').delete().eq('id', route.params.id)

    if (error) {
        toast.error('Delete failed: ' + error.message)
    } else {
        toast.success('Flight deleted.')
        router.push('/journeys')
    }
}

const handleUpdate = async () => {
    const { error } = await supabase.from('flights').update(form.value).eq('id', route.params.id)

    if (error) {
        toast.error('Update failed: ' + error.message)
    } else {
        toast.success('Flight updated.')
        isEditing.value = false
        fetchFlight()
    }
}

onMounted(fetchFlight)
</script>

<template>
    <section class="min-h-screen bg-white/80 dark:bg-gray-900 px-4 py-10 transition-colors">
        <div class="flex items-center justify-between max-w-2xl mx-auto mb-6">
            <div class="flex gap-2 items-center text-xl font-semibold text-gray-800 dark:text-white">
                <img :src="iconPlane" class="w-6 h-6 object-contain" />
                <span>{{ airlineDisplayName }} {{ form.flight_number }}</span>
            </div>
            <BackButton />
        </div>
        <Card class="max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 shadow-md">
            <CardContent class="p-6 space-y-6">
                <div v-if="loading" class="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                <div v-else-if="!flight" class="text-center text-red-500">Flight not found.</div>
                <div v-else class="space-y-6">

                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Flight Info</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <AirlineSelector :modelValue="form.airline_code" :disabled="!isEditing"
                                @update:modelValue="form.airline_code = $event" />
                            <Input v-model="form.flight_number" :disabled="!isEditing" placeholder="Flight Number" />
                            <Input v-model="form.aircraft_type" :disabled="!isEditing" placeholder="Aircraft Type" />
                            <Input v-model="form.aircraft_reg" :disabled="!isEditing"
                                placeholder="Aircraft Registration" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Airports</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <AirportSelector :modelValue="form.departure_airport" :disabled="!isEditing"
                                @update:modelValue="form.departure_airport = $event"
                                placeholder="Departure Airport" />
                            <AirportSelector :modelValue="form.arrival_airport" :disabled="!isEditing"
                                @update:modelValue="form.arrival_airport = $event" placeholder="Arrival Airport" />
                            <Input v-model="form.departure_city" :disabled="!isEditing" placeholder="Departure City" />
                            <Input v-model="form.arrival_city" :disabled="!isEditing" placeholder="Arrival City" />
                            <Input v-model="form.stopover_airport" :disabled="!isEditing"
                                placeholder="Stopover Airport" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Schedule</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <Input v-model="form.departure_date" :disabled="!isEditing" type="date" />
                            <Input v-model="form.departure_time" :disabled="!isEditing" type="time" />
                            <Input v-model="form.arrival_date" :disabled="!isEditing" type="date" />
                            <Input v-model="form.arrival_time" :disabled="!isEditing" type="time" />
                            <Input v-model="form.gate" :disabled="!isEditing" placeholder="Gate" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Passenger Info</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <Input v-model="form.seat_number" :disabled="!isEditing" placeholder="Seat Number" />
                            <Input v-model="form.booking_ref" :disabled="!isEditing" placeholder="Booking Reference" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Price</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <Input v-model="form.price" :disabled="!isEditing" type="number" placeholder="Price" />
                            <CurrencySelector :modelValue="form.currency" :disabled="!isEditing"
                                @update:modelValue="form.currency = $event" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Notes</h3>
                        <Textarea v-model="form.notes" :disabled="!isEditing" placeholder="Notes" rows="3" />

                        <div class="flex flex-wrap gap-4 pt-4">
                            <Button variant="destructive" @click="handleDelete">Delete</Button>
                            <Button v-if="!isEditing" @click="isEditing = true">Edit</Button>
                            <Button v-else @click="handleUpdate">Save</Button>
                            <Button v-if="isEditing" @click="isEditing = false" variant="secondary">Cancel</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </section>
</template>
