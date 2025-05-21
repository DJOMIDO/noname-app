<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton.vue'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'
import hiking from '@/assets/images/hiking.svg'
import travelers from '@/assets/images/travelers.svg'

const trainCompany = ref('')
const trainNumber = ref('')
const trainType = ref('')
const departureStation = ref('')
const arrivalStation = ref('')
const departureCity = ref('')
const arrivalCity = ref('')
const departureDate = ref('')
const departureTime = ref('')
const arrivalDate = ref('')
const arrivalTime = ref('')
const coach = ref('')
const seatNumber = ref('')
const price = ref('')
const currency = ref('')
const bookingRef = ref('')
const notes = ref('')

const handleSubmit = async () => {
    if (!trainCompany.value || !trainNumber.value || !departureStation.value || !arrivalStation.value || !departureDate.value) {
        toast.error('Please fill in all required fields.')
        return
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        toast.error('You must be logged in.')
        return
    }

    const { error } = await supabase.from('trains').insert({
        user_id: user.id,
        train_company: trainCompany.value,
        train_number: trainNumber.value,
        train_type: trainType.value || null,
        departure_station: departureStation.value,
        arrival_station: arrivalStation.value,
        departure_city: departureCity.value || null,
        arrival_city: arrivalCity.value || null,
        departure_date: departureDate.value,
        departure_time: departureTime.value || null,
        arrival_date: arrivalDate.value || null,
        arrival_time: arrivalTime.value || null,
        coach: coach.value || null,
        seat_number: seatNumber.value || null,
        price: Number(price.value) || null,
        currency: currency.value || null,
        booking_ref: bookingRef.value || null,
        notes: notes.value || null
    })

    if (error) {
        toast.error(error.message)
    } else {
        toast.success('Train added successfully!')
        trainCompany.value = ''
        trainNumber.value = ''
        trainType.value = ''
        departureStation.value = ''
        arrivalStation.value = ''
        departureCity.value = ''
        arrivalCity.value = ''
        departureDate.value = ''
        departureTime.value = ''
        arrivalDate.value = ''
        arrivalTime.value = ''
        coach.value = ''
        seatNumber.value = ''
        price.value = ''
        currency.value = ''
        bookingRef.value = ''
        notes.value = ''
    }
}
</script>

<template>
    <section class="relative min-h-screen bg-white/80 dark:bg-gray-900 px-4 py-10 transition-colors">
        <img :src="hiking" class="hidden md:block absolute bottom-10 left-4 w-80 pointer-events-none select-none" />
        <img :src="travelers" class="hidden md:block absolute bottom-10 right-4 w-80 pointer-events-none select-none" />
        <Card class="relative z-10 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 shadow-md">

            <CardContent class="p-6 space-y-4">
                <BackButton />

                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add a Train Journey</h2>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="trainCompany" placeholder="Train Company (e.g. SNCF)" />
                    <Input v-model="trainNumber" placeholder="Train Number (e.g. TGV 8475)" />
                </div>

                <Input v-model="trainType" placeholder="Train Type (e.g. TGV, ICE)" />

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="departureStation" placeholder="Departure Station" />
                    <Input v-model="arrivalStation" placeholder="Arrival Station" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="departureCity" placeholder="Departure City (optional)" />
                    <Input v-model="arrivalCity" placeholder="Arrival City (optional)" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="departureDate" type="date" />
                    <Input v-model="departureTime" type="time" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="arrivalDate" type="date" />
                    <Input v-model="arrivalTime" type="time" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="coach" placeholder="Coach (e.g. 12)" />
                    <Input v-model="seatNumber" placeholder="Seat Number (e.g. 34A)" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="price" type="number" placeholder="Price (e.g. 89.50)" />
                    <Input v-model="currency" placeholder="Currency (e.g. EUR)" />
                </div>

                <Input v-model="bookingRef" placeholder="Booking Reference (e.g. ABC123)" />

                <Textarea v-model="notes" placeholder="Additional notes..." rows="3" />

                <Button class="w-full mt-4" @click="handleSubmit">Save Train Journey</Button>
            </CardContent>
        </Card>
    </section>
</template>
