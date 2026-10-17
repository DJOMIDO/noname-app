<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { client } from '@/lib/neon'
import JourneyFormShell from '@/components/JourneyFormShell.vue'
import AddTrainBasic from '@/components/AddTrainBasic.vue'
import AddTrainDetailed from '@/components/AddTrainDetailed.vue'

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

const saving = ref(false)

const fields = [
    trainCompany, trainNumber, trainType, departureStation, arrivalStation,
    departureCity, arrivalCity, departureDate, departureTime, arrivalDate,
    arrivalTime, coach, seatNumber, price, currency, bookingRef, notes,
]

const handleSubmit = async () => {
    const isBlank = (val: string) => !val || val.trim() === ''

    if (
        isBlank(trainCompany.value) ||
        isBlank(trainNumber.value) ||
        isBlank(departureStation.value) ||
        isBlank(arrivalStation.value) ||
        isBlank(departureDate.value)
    ) {
        toast.error('Please fill in all required fields.')
        return
    }

    const {
        data: { user }
    } = await client.auth.getUser()

    if (!user) {
        toast.error('You must be logged in.')
        return
    }

    saving.value = true
    try {
        const { error } = await client.from('trains').insert({
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
            fields.forEach((field) => (field.value = ''))
        }
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <JourneyFormShell journey-type="train" title="Log a" highlight="Train Journey"
        subtitle="Record every ride — from regional hops to night trains." submit-label="Save Train Journey"
        :saving="saving" @submit="handleSubmit">
        <template #basic>
            <AddTrainBasic v-model:trainCompany="trainCompany" v-model:trainNumber="trainNumber"
                v-model:departureStation="departureStation" v-model:arrivalStation="arrivalStation"
                v-model:departureDate="departureDate" />
        </template>

        <template #detailed>
            <AddTrainDetailed v-model:trainCompany="trainCompany" v-model:trainNumber="trainNumber"
                v-model:trainType="trainType" v-model:departureStation="departureStation"
                v-model:arrivalStation="arrivalStation" v-model:departureCity="departureCity"
                v-model:arrivalCity="arrivalCity" v-model:departureDate="departureDate"
                v-model:departureTime="departureTime" v-model:arrivalDate="arrivalDate"
                v-model:arrivalTime="arrivalTime" v-model:coach="coach" v-model:seatNumber="seatNumber"
                v-model:price="price" v-model:currency="currency" v-model:bookingRef="bookingRef"
                v-model:notes="notes" />
        </template>
    </JourneyFormShell>
</template>
