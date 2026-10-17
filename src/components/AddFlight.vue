<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { client } from '@/lib/neon'
import JourneyFormShell from '@/components/JourneyFormShell.vue'
import AddFlightBasic from '@/components/AddFlightBasic.vue'
import AddFlightDetailed from '@/components/AddFlightDetailed.vue'

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

const saving = ref(false)

const fields = [
    airlineCode, flightNumber, departureAirport, stopoverAirport, arrivalAirport,
    departureDate, departureTime, arrivalDate, arrivalTime, gate, seatNumber,
    aircraftType, aircraftReg, price, currency, bookingRef, notes,
]

const handleSubmit = async () => {
    if (!airlineCode.value || !flightNumber.value || !departureAirport.value || !arrivalAirport.value || !departureDate.value) {
        toast.error('Please fill in all required fields.')
        return
    }

    const {
        data: { user },
    } = await client.auth.getUser()

    if (!user) {
        toast.error('You must be logged in.')
        return
    }

    saving.value = true
    try {
        const { error } = await client.from('flights').insert({
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
            fields.forEach((field) => (field.value = ''))
        }
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <JourneyFormShell journey-type="flight" title="Log a" highlight="Flight"
        subtitle="Capture the essentials — add finer details anytime." submit-label="Save Flight" :saving="saving"
        @submit="handleSubmit">
        <template #basic>
            <AddFlightBasic v-model:airlineCode="airlineCode" v-model:flightNumber="flightNumber"
                v-model:departureAirport="departureAirport" v-model:arrivalAirport="arrivalAirport"
                v-model:departureDate="departureDate" />
        </template>

        <template #detailed>
            <AddFlightDetailed v-model:airlineCode="airlineCode" v-model:flightNumber="flightNumber"
                v-model:departureAirport="departureAirport" v-model:stopoverAirport="stopoverAirport"
                v-model:arrivalAirport="arrivalAirport" v-model:departureDate="departureDate"
                v-model:departureTime="departureTime" v-model:arrivalDate="arrivalDate"
                v-model:arrivalTime="arrivalTime" v-model:gate="gate" v-model:seatNumber="seatNumber"
                v-model:aircraftType="aircraftType" v-model:aircraftReg="aircraftReg" v-model:price="price"
                v-model:currency="currency" v-model:bookingRef="bookingRef" v-model:notes="notes" />
        </template>
    </JourneyFormShell>
</template>
