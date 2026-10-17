<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import { Plane } from 'lucide-vue-next'
import { client } from '@/lib/neon'
import { invalidateJourneysCache } from '@/composables/useJourneys'
import { toast } from 'vue-sonner'
import airlines from '@/assets/data/airlines.json'
import { airportByIata, haversineKm, timezoneOffsetDiffHours } from '@/lib/geo'
import { getFlightDuration } from '@/utils/getFlightDuration'
import JourneyDetailShell from '@/components/JourneyDetailShell.vue'
import AddFlightDetailed from '@/components/AddFlightDetailed.vue'

const route = useRoute()
const router = useRouter()

const isEditing = ref(false)
const loading = ref(true)
const flight = ref<any>(null)

const form = reactive({
    airline_code: '',
    flight_number: '',
    departure_airport: '',
    stopover_airport: '',
    arrival_airport: '',
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    gate: '',
    seat_number: '',
    aircraft_type: '',
    aircraft_reg: '',
    price: '',
    currency: '',
    booking_ref: '',
    notes: '',
})

const airlineName = computed(() => {
    const code = form.airline_code
    const match = airlines.find(a => a.code === code)
    return match ? match.name : code || 'Unknown Airline'
})

const depAirport = computed(() => airportByIata(form.departure_airport))
const arrAirport = computed(() => airportByIata(form.arrival_airport))

const distanceKm = computed(() => {
    if (depAirport.value && arrAirport.value) return haversineKm(depAirport.value, arrAirport.value)
    return null
})

const timeDiffHours = computed(() =>
    timezoneOffsetDiffHours(form.departure_airport, form.arrival_airport, form.departure_date))

const durationLabel = computed(() => {
    const mins = getFlightDuration(
        form.departure_airport, form.departure_date, form.departure_time,
        form.arrival_airport, form.arrival_date, form.arrival_time,
    )
    if (mins === null) return null
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
    if (form.aircraft_type) list.push({ label: 'Aircraft', value: form.aircraft_type })
    if (form.aircraft_reg) list.push({ label: 'Registration', value: form.aircraft_reg })
    if (form.gate) list.push({ label: 'Gate', value: form.gate })
    if (form.seat_number) list.push({ label: 'Seat', value: form.seat_number })
    if (form.stopover_airport) list.push({ label: 'Stopover', value: form.stopover_airport })
    if (form.booking_ref) list.push({ label: 'Booking Ref', value: form.booking_ref })
    if (priceLabel.value) list.push({ label: 'Price', value: priceLabel.value })
    return list
})

const assign = (src: any) => {
    Object.keys(form).forEach((key) => {
        ;(form as any)[key] = src[key] ?? ''
    })
}

const fetchFlight = async () => {
    const { data, error } = await client.from('flights').select('*').eq('id', route.params.id).single()
    if (error) {
        toast.error('Failed to load flight record.')
    } else {
        flight.value = data
        assign(data)
    }
    loading.value = false
}

const startEdit = () => { isEditing.value = true }
const cancelEdit = () => {
    assign(flight.value)
    isEditing.value = false
}

const handleSave = async () => {
    const payload = { ...form, price: form.price === '' ? null : Number(form.price) }
    const { error } = await client.from('flights').update(payload).eq('id', route.params.id)
    if (error) {
        toast.error('Update failed: ' + error.message)
    } else {
        toast.success('Flight updated.')
        invalidateJourneysCache()
        isEditing.value = false
        fetchFlight()
    }
}

const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return
    const { error } = await client.from('flights').delete().eq('id', route.params.id)
    if (error) {
        toast.error('Delete failed: ' + error.message)
    } else {
        toast.success('Flight deleted.')
        invalidateJourneysCache()
        router.push('/journeys')
    }
}

onMounted(fetchFlight)
</script>

<template>
    <JourneyDetailShell :is-editing="isEditing" :loading="loading" @edit="startEdit" @cancel="cancelEdit"
        @save="handleSave" @delete="handleDelete">
        <template #label>
            <span class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                <Plane class="size-4 text-brand dark:text-violet-300" aria-hidden="true" /> Flight
            </span>
        </template>

        <!-- Edit mode: reuse the shared journey form -->
        <AddFlightDetailed v-if="isEditing" v-model:airlineCode="form.airline_code"
            v-model:flightNumber="form.flight_number" v-model:departureAirport="form.departure_airport"
            v-model:stopoverAirport="form.stopover_airport" v-model:arrivalAirport="form.arrival_airport"
            v-model:departureDate="form.departure_date" v-model:departureTime="form.departure_time"
            v-model:arrivalDate="form.arrival_date" v-model:arrivalTime="form.arrival_time"
            v-model:gate="form.gate" v-model:seatNumber="form.seat_number" v-model:aircraftType="form.aircraft_type"
            v-model:aircraftReg="form.aircraft_reg" v-model:price="form.price" v-model:currency="form.currency"
            v-model:bookingRef="form.booking_ref" v-model:notes="form.notes" />

        <!-- View mode: read-only boarding pass -->
        <div v-else-if="flight" class="animate-in fade-in space-y-6">
            <!-- Airline -->
            <div class="flex items-center gap-3">
                <div
                    class="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-violet-500 text-sm font-bold text-white shadow-md shadow-brand/20">
                    {{ form.airline_code || '?' }}
                </div>
                <div class="min-w-0">
                    <div class="truncate text-lg font-semibold text-gray-900 dark:text-white">{{ airlineName }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ form.flight_number }}<span v-if="form.aircraft_type"> · {{ form.aircraft_type }}</span>
                    </div>
                </div>
            </div>

            <!-- Route -->
            <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 text-left">
                    <div class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        {{ form.departure_airport }}
                    </div>
                    <div class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {{ depAirport?.city || depAirport?.name || '—' }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                        {{ formatDate(form.departure_date) }}<span v-if="form.departure_time"> · {{ formatTime(form.departure_time) }}</span>
                    </div>
                </div>

                <div class="flex flex-1 items-center gap-2 text-gray-300 dark:text-gray-600">
                    <span class="h-px flex-1 bg-current opacity-50" />
                    <Plane class="size-5 shrink-0 text-brand dark:text-violet-300" aria-hidden="true" />
                    <span class="h-px flex-1 bg-current opacity-50" />
                </div>

                <div class="min-w-0 text-right">
                    <div class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        {{ form.arrival_airport }}
                    </div>
                    <div class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {{ arrAirport?.city || arrAirport?.name || '—' }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500">
                        {{ form.arrival_date ? formatDate(form.arrival_date) : '' }}<span v-if="form.arrival_time"> · {{ formatTime(form.arrival_time) }}</span>
                    </div>
                </div>
            </div>

            <!-- Meta line -->
            <div class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span v-if="durationLabel">⏱ {{ durationLabel }}</span>
                <span v-if="distanceKm !== null">{{ distanceKm.toLocaleString() }} km</span>
                <span v-if="timeDiffHours !== null && timeDiffHours !== 0">
                    · time diff {{ timeDiffHours > 0 ? '+' : '' }}{{ timeDiffHours }}h
                </span>
            </div>

            <!-- Detail chips -->
            <div v-if="chips.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div v-for="chip in chips" :key="chip.label"
                    class="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
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

        <div v-else class="flex h-full items-center justify-center text-red-500">Flight not found.</div>
    </JourneyDetailShell>
</template>
