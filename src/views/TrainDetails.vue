<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import { Train } from 'lucide-vue-next'
import { client } from '@/lib/neon'
import { invalidateJourneysCache } from '@/composables/useJourneys'
import { toast } from 'vue-sonner'
import JourneyDetailShell from '@/components/JourneyDetailShell.vue'
import AddTrainDetailed from '@/components/AddTrainDetailed.vue'
// Aliased: `Train` is already taken by the lucide icon above.
import type { Train as TrainRow } from '@/types/journeys'

const route = useRoute()
const router = useRouter()

const isEditing = ref(false)
const loading = ref(true)
const train = ref<TrainRow | null>(null)

const form = reactive({
    train_company: '',
    train_number: '',
    train_type: '',
    departure_station: '',
    arrival_station: '',
    departure_city: '',
    arrival_city: '',
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    coach: '',
    seat_number: '',
    price: '',
    currency: '',
    booking_ref: '',
    notes: '',
})

const companyInitials = computed(() => {
    const name = form.train_company?.trim()
    if (!name) return '?'
    const words = name.split(/\s+/)
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
})

const durationLabel = computed(() => {
    if (!form.departure_date || !form.departure_time || !form.arrival_date || !form.arrival_time) return null
    const from = DateTime.fromISO(`${form.departure_date}T${form.departure_time}`)
    const to = DateTime.fromISO(`${form.arrival_date}T${form.arrival_time}`)
    if (!from.isValid || !to.isValid) return null
    const mins = Math.round(to.diff(from, 'minutes').as('minutes'))
    if (mins <= 0) return null
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
})

const formatDate = (d?: string | null) => {
    if (!d) return ''
    const dt = DateTime.fromISO(d)
    return dt.isValid ? dt.toFormat('EEE, MMM d') : d
}
const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : '')

const priceLabel = computed(() => {
    if (form.price === '' || form.price === null || Number.isNaN(Number(form.price))) return null
    const amount = Number(form.price).toLocaleString(undefined, { maximumFractionDigits: 2 })
    return form.currency ? `${form.currency} ${amount}` : amount
})

const chips = computed(() => {
    const list: { label: string; value: string }[] = []
    if (form.train_type) list.push({ label: 'Type', value: form.train_type })
    if (form.coach) list.push({ label: 'Coach', value: form.coach })
    if (form.seat_number) list.push({ label: 'Seat', value: form.seat_number })
    if (form.booking_ref) list.push({ label: 'Booking Ref', value: form.booking_ref })
    if (priceLabel.value) list.push({ label: 'Price', value: priceLabel.value })
    return list
})

// Row values arrive as null for optional columns; the form binds strings, so
// normalise every field on the way in.
type TrainForm = typeof form

const assign = (src: TrainRow) => {
    ;(Object.keys(form) as (keyof TrainForm)[]).forEach((key) => {
        const value = src[key]
        form[key] = value === null || value === undefined ? '' : String(value)
    })
}

const fetchTrain = async () => {
    const { data, error } = await client
        .from('trains')
        .select('*')
        .eq('id', route.params.id)
        .returns<TrainRow>()
        .single()
    if (error) {
        toast.error('Failed to load train record.')
    } else if (data) {
        train.value = data
        assign(data)
    }
    loading.value = false
}

const startEdit = () => { isEditing.value = true }
const cancelEdit = () => {
    if (train.value) assign(train.value)
    isEditing.value = false
}

const handleSave = async () => {
    const payload = { ...form, price: form.price === '' ? null : Number(form.price) }
    const { error } = await client.from('trains').update(payload).eq('id', route.params.id)
    if (error) {
        toast.error('Update failed: ' + error.message)
    } else {
        toast.success('Train journey updated.')
        invalidateJourneysCache()
        isEditing.value = false
        fetchTrain()
    }
}

const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this train journey?')) return
    const { error } = await client.from('trains').delete().eq('id', route.params.id)
    if (error) {
        toast.error('Delete failed: ' + error.message)
    } else {
        toast.success('Train journey deleted.')
        invalidateJourneysCache()
        router.push('/journeys')
    }
}

onMounted(fetchTrain)
</script>

<template>
    <JourneyDetailShell :is-editing="isEditing" :loading="loading" @edit="startEdit" @cancel="cancelEdit"
        @save="handleSave" @delete="handleDelete">
        <template #label>
            <span class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                <Train class="size-4 text-brand dark:text-violet-300" aria-hidden="true" /> Train
            </span>
        </template>

        <!-- Edit mode: reuse the shared journey form -->
        <AddTrainDetailed v-if="isEditing" v-model:trainCompany="form.train_company"
            v-model:trainNumber="form.train_number" v-model:trainType="form.train_type"
            v-model:departureStation="form.departure_station" v-model:arrivalStation="form.arrival_station"
            v-model:departureCity="form.departure_city" v-model:arrivalCity="form.arrival_city"
            v-model:departureDate="form.departure_date" v-model:departureTime="form.departure_time"
            v-model:arrivalDate="form.arrival_date" v-model:arrivalTime="form.arrival_time"
            v-model:coach="form.coach" v-model:seatNumber="form.seat_number" v-model:price="form.price"
            v-model:currency="form.currency" v-model:bookingRef="form.booking_ref" v-model:notes="form.notes" />

        <!-- View mode: read-only ticket -->
        <div v-else-if="train" class="animate-in fade-in space-y-6">
            <!-- Company -->
            <div class="flex items-center gap-3">
                <div
                    class="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-violet-500 text-sm font-bold text-white shadow-md shadow-brand/20">
                    {{ companyInitials }}
                </div>
                <div class="min-w-0">
                    <div class="truncate text-lg font-semibold text-gray-900 dark:text-white">{{ form.train_company }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ form.train_number }}<span v-if="form.train_type"> · {{ form.train_type }}</span>
                    </div>
                </div>
            </div>

            <!-- Route -->
            <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 text-left">
                    <div class="truncate text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        {{ form.departure_city || form.departure_station }}
                    </div>
                    <div class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{{ form.departure_station }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                        {{ formatDate(form.departure_date) }}<span v-if="form.departure_time"> · {{ formatTime(form.departure_time) }}</span>
                    </div>
                </div>

                <div class="flex flex-1 items-center gap-2 text-gray-300 dark:text-gray-600">
                    <span class="h-px flex-1 bg-current opacity-50" />
                    <Train class="size-5 shrink-0 text-brand dark:text-violet-300" aria-hidden="true" />
                    <span class="h-px flex-1 bg-current opacity-50" />
                </div>

                <div class="min-w-0 text-right">
                    <div class="truncate text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        {{ form.arrival_city || form.arrival_station }}
                    </div>
                    <div class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{{ form.arrival_station }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                        {{ form.arrival_date ? formatDate(form.arrival_date) : '' }}<span v-if="form.arrival_time"> · {{ formatTime(form.arrival_time) }}</span>
                    </div>
                </div>
            </div>

            <!-- Meta line -->
            <div v-if="durationLabel" class="text-center text-sm text-gray-500 dark:text-gray-400">
                ⏱ {{ durationLabel }}
            </div>

            <!-- Detail chips -->
            <div v-if="chips.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div v-for="chip in chips" :key="chip.label" class="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                    <div class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{{ chip.label }}</div>
                    <div class="mt-0.5 truncate text-sm font-medium text-gray-800 dark:text-gray-100">{{ chip.value }}</div>
                </div>
            </div>

            <!-- Notes -->
            <div v-if="form.notes" class="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                <div class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Notes</div>
                <p class="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{{ form.notes }}</p>
            </div>
        </div>

        <div v-else class="flex h-full items-center justify-center text-red-500">Train not found.</div>
    </JourneyDetailShell>
</template>
