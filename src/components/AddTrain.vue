<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { client } from '@/lib/neon'
import { useAuthUser } from '@/composables/useAuthUser'
import { invalidateJourneysCache } from '@/composables/useJourneys'
import { saveDraft, loadDraft, clearDraft } from '@/lib/drafts'
import JourneyFormShell from '@/components/JourneyFormShell.vue'
import AddTrainBasic from '@/components/AddTrainBasic.vue'
import AddTrainDetailed from '@/components/AddTrainDetailed.vue'

const DRAFT_KEY = 'train'

const form = reactive({
    trainCompany: '',
    trainNumber: '',
    trainType: '',
    departureStation: '',
    arrivalStation: '',
    departureCity: '',
    arrivalCity: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    coach: '',
    seatNumber: '',
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
    const isBlank = (val: string) => !val || val.trim() === ''

    if (
        isBlank(form.trainCompany) ||
        isBlank(form.trainNumber) ||
        isBlank(form.departureStation) ||
        isBlank(form.arrivalStation) ||
        isBlank(form.departureDate)
    ) {
        toast.error('Please fill in all required fields.')
        return
    }

    await refresh()
    if (!isLoggedIn.value) {
        // Keep what they typed, then send them to log in — returning restores the draft.
        saveDraft(DRAFT_KEY, form)
        router.push({ path: '/login', query: { next: '/add-train' } })
        return
    }

    saving.value = true
    try {
        const { error } = await client.from('trains').insert({
            user_id: user.value.id,
            train_company: form.trainCompany,
            train_number: form.trainNumber,
            train_type: form.trainType || null,
            departure_station: form.departureStation,
            arrival_station: form.arrivalStation,
            departure_city: form.departureCity || null,
            arrival_city: form.arrivalCity || null,
            departure_date: form.departureDate,
            departure_time: form.departureTime || null,
            arrival_date: form.arrivalDate || null,
            arrival_time: form.arrivalTime || null,
            coach: form.coach || null,
            seat_number: form.seatNumber || null,
            price: Number(form.price) || null,
            currency: form.currency || null,
            booking_ref: form.bookingRef || null,
            notes: form.notes || null
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Train added successfully!')
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
    <JourneyFormShell journey-type="train" title="Log a" highlight="Train Journey"
        subtitle="Record every ride — from regional hops to night trains." submit-label="Save Train Journey"
        :saving="saving" :guest="!isLoggedIn" @submit="handleSubmit">
        <template #basic>
            <AddTrainBasic v-model:trainCompany="form.trainCompany" v-model:trainNumber="form.trainNumber"
                v-model:departureStation="form.departureStation" v-model:arrivalStation="form.arrivalStation"
                v-model:departureDate="form.departureDate" />
        </template>

        <template #detailed>
            <AddTrainDetailed v-model:trainCompany="form.trainCompany" v-model:trainNumber="form.trainNumber"
                v-model:trainType="form.trainType" v-model:departureStation="form.departureStation"
                v-model:arrivalStation="form.arrivalStation" v-model:departureCity="form.departureCity"
                v-model:arrivalCity="form.arrivalCity" v-model:departureDate="form.departureDate"
                v-model:departureTime="form.departureTime" v-model:arrivalDate="form.arrivalDate"
                v-model:arrivalTime="form.arrivalTime" v-model:coach="form.coach" v-model:seatNumber="form.seatNumber"
                v-model:price="form.price" v-model:currency="form.currency" v-model:bookingRef="form.bookingRef"
                v-model:notes="form.notes" />
        </template>
    </JourneyFormShell>
</template>
