<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton.vue'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

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

const fetchFlight = async () => {
    const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('id', route.params.id)
        .single()

    if (error) {
        toast.error('Failed to load flight record.')
    } else {
        flight.value = data
        Object.assign(form.value, data)
    }
    loading.value = false
}

const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this flight?')
    if (!confirmDelete) return

    const { error } = await supabase
        .from('flights')
        .delete()
        .eq('id', route.params.id)

    if (error) {
        toast.error('Delete failed: ' + error.message)
    } else {
        toast.success('Flight deleted.')
        router.push('/journeys')
    }
}

const handleUpdate = async () => {
    const { error } = await supabase
        .from('flights')
        .update(form.value)
        .eq('id', route.params.id)

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
        <Card class="max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 shadow-md">
            <CardContent class="p-6 space-y-4">
                <div v-if="loading" class="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                <div v-else-if="!flight" class="text-center text-red-500">Flight not found.</div>
                <div v-else class="space-y-4">
                    <BackButton />
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                        {{ flight.airline_code }}{{ flight.flight_number }}
                    </h2>

                    <div class="grid grid-cols-2 gap-4">
                        <Input v-model="form.airline_code" :disabled="!isEditing" placeholder="Airline Code" />
                        <Input v-model="form.flight_number" :disabled="!isEditing" placeholder="Flight Number" />
                        <Input v-model="form.departure_airport" :disabled="!isEditing"
                            placeholder="Departure Airport" />
                        <Input v-model="form.arrival_airport" :disabled="!isEditing" placeholder="Arrival Airport" />
                        <Input v-model="form.stopover_airport" :disabled="!isEditing" placeholder="Stopover Airport" />
                        <Input v-model="form.departure_city" :disabled="!isEditing" placeholder="Departure City" />
                        <Input v-model="form.arrival_city" :disabled="!isEditing" placeholder="Arrival City" />
                        <Input v-model="form.departure_date" :disabled="!isEditing" type="date" />
                        <Input v-model="form.departure_time" :disabled="!isEditing" type="time" />
                        <Input v-model="form.arrival_date" :disabled="!isEditing" type="date" />
                        <Input v-model="form.arrival_time" :disabled="!isEditing" type="time" />
                        <Input v-model="form.seat_number" :disabled="!isEditing" placeholder="Seat Number" />
                        <Input v-model="form.booking_ref" :disabled="!isEditing" placeholder="Booking Ref" />
                        <Input v-model="form.gate" :disabled="!isEditing" placeholder="Gate" />
                        <Input v-model="form.aircraft_type" :disabled="!isEditing" placeholder="Aircraft Type" />
                        <Input v-model="form.aircraft_reg" :disabled="!isEditing" placeholder="Aircraft Registration" />
                        <Input v-model="form.price" :disabled="!isEditing" type="number" placeholder="Price" />
                        <Input v-model="form.currency" :disabled="!isEditing" placeholder="Currency" />
                    </div>

                    <Textarea v-model="form.notes" :disabled="!isEditing" placeholder="Notes" class="mt-2" />

                    <div class="flex flex-wrap gap-4 pt-4">
                        <Button variant="destructive" @click="handleDelete">Delete</Button>
                        <Button v-if="!isEditing" @click="isEditing = true">Edit</Button>
                        <Button v-else @click="handleUpdate">Save</Button>
                        <Button v-if="isEditing" @click="isEditing = false" variant="secondary">Cancel</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </section>
</template>
