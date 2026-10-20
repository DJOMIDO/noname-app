<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { client } from '@/lib/neon'
import { useAuthUser } from '@/composables/useAuthUser'
import { invalidateJourneysCache } from '@/composables/useJourneys'
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts'
import JourneyFormShell from '@/components/JourneyFormShell.vue'
import FlightFormFields from '@/components/FlightFormFields.vue'

const DRAFT_KEY = 'flight'

const form = reactive({
    airlineCode: '',
    flightNumber: '',
    departureAirport: '',
    stopoverAirport: '',
    arrivalAirport: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    gate: '',
    seatNumber: '',
    aircraftType: '',
    aircraftReg: '',
    price: '',
    currency: '',
    bookingRef: '',
    notes: '',
})

const saving = ref(false)
const router = useRouter()
const { user, isLoggedIn, fetchUser, refresh } = useAuthUser()

onMounted(async () => {
    await fetchUser()
    // Restore a guest's draft so typed input survives the login round-trip.
    const draft = loadDraft<typeof form>(DRAFT_KEY)
    if (draft) Object.assign(form, draft)
})

const resetForm = () => {
    ;(Object.keys(form) as (keyof typeof form)[]).forEach((key) => {
        form[key] = ''
    })
}

const handleSubmit = async () => {
    if (!form.airlineCode || !form.flightNumber || !form.departureAirport || !form.arrivalAirport || !form.departureDate) {
        toast.error('Please fill in all required fields.')
        return
    }

    await refresh()
    if (!user.value) {
        // Keep what they typed, then send them to log in — returning restores the draft.
        saveDraft(DRAFT_KEY, form)
        router.push({ path: '/login', query: { next: '/add-flight' } })
        return
    }

    saving.value = true
    try {
        const { error } = await client.from('flights').insert({
            user_id: user.value.id,
            airline_code: form.airlineCode,
            flight_number: form.flightNumber,
            departure_airport: form.departureAirport,
            stopover_airport: form.stopoverAirport || null,
            arrival_airport: form.arrivalAirport,
            departure_date: form.departureDate,
            departure_time: form.departureTime || null,
            arrival_date: form.arrivalDate || null,
            arrival_time: form.arrivalTime || null,
            gate: form.gate || null,
            seat_number: form.seatNumber || null,
            aircraft_type: form.aircraftType || null,
            aircraft_reg: form.aircraftReg || null,
            price: Number(form.price) || null,
            currency: form.currency || null,
            booking_ref: form.bookingRef || null,
            notes: form.notes || null,
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Flight added successfully!')
            invalidateJourneysCache()
            resetForm()
            clearDraft(DRAFT_KEY)
        }
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <JourneyFormShell journey-type="flight" title="Log a" highlight="Flight"
        subtitle="Capture the essentials — add finer details anytime." submit-label="Save Flight" :saving="saving"
        :guest="!isLoggedIn" @submit="handleSubmit">
        <FlightFormFields v-model:airlineCode="form.airlineCode" v-model:flightNumber="form.flightNumber"
            v-model:departureAirport="form.departureAirport" v-model:stopoverAirport="form.stopoverAirport"
            v-model:arrivalAirport="form.arrivalAirport" v-model:departureDate="form.departureDate"
            v-model:departureTime="form.departureTime" v-model:arrivalDate="form.arrivalDate"
            v-model:arrivalTime="form.arrivalTime" v-model:gate="form.gate" v-model:seatNumber="form.seatNumber"
            v-model:aircraftType="form.aircraftType" v-model:aircraftReg="form.aircraftReg" v-model:price="form.price"
            v-model:currency="form.currency" v-model:bookingRef="form.bookingRef" v-model:notes="form.notes" />
    </JourneyFormShell>
</template>
