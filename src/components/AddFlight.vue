<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton.vue'
import AddFlightBasic from '@/components/AddFlightBasic.vue'
import AddFlightDetailed from '@/components/AddFlightDetailed.vue'
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

const currentTab = ref('basic')

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
        notes: notes.value || null,
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

        <Tabs v-model="currentTab" class="relative z-10 max-w-2xl mx-auto">
            <div class="flex items-center justify-between mb-6">
                <TabsList class="flex gap-2">
                    <TabsTrigger value="basic" class="flex items-center gap-2">
                        <span>Basic</span>
                    </TabsTrigger>
                    <TabsTrigger value="detailed" class="flex items-center gap-2">
                        <span>Detailed</span>
                    </TabsTrigger>
                </TabsList>
                <BackButton />
            </div>

            <TabsContent value="basic">
                <AddFlightBasic v-model:airlineCode="airlineCode" v-model:flightNumber="flightNumber"
                    v-model:departureAirport="departureAirport" v-model:arrivalAirport="arrivalAirport"
                    v-model:departureDate="departureDate" />
            </TabsContent>

            <TabsContent value="detailed">
                <AddFlightDetailed v-model:airlineCode="airlineCode" v-model:flightNumber="flightNumber"
                    v-model:departureAirport="departureAirport" v-model:stopoverAirport="stopoverAirport"
                    v-model:arrivalAirport="arrivalAirport" v-model:departureDate="departureDate"
                    v-model:departureTime="departureTime" v-model:arrivalDate="arrivalDate"
                    v-model:arrivalTime="arrivalTime" v-model:gate="gate" v-model:seatNumber="seatNumber"
                    v-model:aircraftType="aircraftType" v-model:aircraftReg="aircraftReg" v-model:price="price"
                    v-model:currency="currency" v-model:bookingRef="bookingRef" v-model:notes="notes" />
            </TabsContent>

            <div class="mt-6">
                <Button class="w-full" @click="handleSubmit">Save Flight</Button>
            </div>
        </Tabs>
    </section>
</template>
