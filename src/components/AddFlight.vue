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

const airlineCode = ref('')
const flightNumber = ref('')
const departureAirport = ref('')
const stopoverAirport = ref('')
const arrivalAirport = ref('')
const departureDate = ref('')
const departureTime = ref('')
const arrivalDate = ref('')
const arrivalTime = ref('')
const gate = ref('')
const seatNumber = ref('')
const aircraftType = ref('')
const aircraftReg = ref('')
const price = ref('')
const currency = ref('')
const bookingRef = ref('')
const notes = ref('')

const handleSubmit = async () => {
    if (!airlineCode.value || !flightNumber.value || !departureAirport.value || !arrivalAirport.value || !departureDate.value) {
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

    const { error } = await supabase.from('flights').insert({
        user_id: user.id,
        airline_code: airlineCode.value,
        flight_number: flightNumber.value,
        departure_airport: departureAirport.value,
        stopover_airport: stopoverAirport.value || null,
        arrival_airport: arrivalAirport.value,
        departure_date: departureDate.value,
        departure_time: departureTime.value || null,
        arrival_date: arrivalDate.value || null,
        arrival_time: arrivalTime.value || null,
        gate: gate.value || null,
        seat_number: seatNumber.value || null,
        aircraft_type: aircraftType.value || null,
        aircraft_reg: aircraftReg.value || null,
        price: Number(price.value) || null,
        currency: currency.value || null,
        booking_ref: bookingRef.value || null,
        notes: notes.value || null
    })

    if (error) {
        toast.error(error.message)
    } else {
        toast.success('Flight added successfully!')
        
        airlineCode.value = ''
        flightNumber.value = ''
        departureAirport.value = ''
        stopoverAirport.value = ''
        arrivalAirport.value = ''
        departureDate.value = ''
        departureTime.value = ''
        arrivalDate.value = ''
        arrivalTime.value = ''
        gate.value = ''
        seatNumber.value = ''
        aircraftType.value = ''
        aircraftReg.value = ''
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

                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add a Flight</h2>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="airlineCode" placeholder="Airline Code (e.g. AF)" />
                    <Input v-model="flightNumber" placeholder="Flight Number (e.g. 1234)" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="departureAirport" placeholder="Departure Airport (IATA)" />
                    <Input v-model="arrivalAirport" placeholder="Arrival Airport (IATA)" />
                </div>

                <Input v-model="stopoverAirport" placeholder="Stopover Airport (optional)" />

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="departureDate" type="date" />
                    <Input v-model="departureTime" type="time" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="arrivalDate" type="date" />
                    <Input v-model="arrivalTime" type="time" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="gate" placeholder="Gate (e.g. A23)" />
                    <Input v-model="seatNumber" placeholder="Seat Number (e.g. 12A)" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="aircraftType" placeholder="Aircraft Type (e.g. A320)" />
                    <Input v-model="aircraftReg" placeholder="Registration (e.g. F-GKXA)" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <Input v-model="price" type="number" placeholder="Price (e.g. 89.50)" />
                    <Input v-model="currency" placeholder="Currency (e.g. EUR)" />
                </div>

                <Input v-model="bookingRef" placeholder="Booking Reference (e.g. XYZ123)" />

                <Textarea v-model="notes" placeholder="Additional notes..." rows="3" />

                <Button class="w-full mt-4" @click="handleSubmit">Save Flight</Button>
            </CardContent>
        </Card>
    </section>
</template>
