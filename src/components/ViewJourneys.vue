<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { client } from '@/lib/neon'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import BackButton from '@/components/BackButton.vue'
import Pagination from '@/components/Pagination.vue'
import { toast } from 'vue-sonner'
import iconFlight from '@/assets/images/flight.png'
import iconTrain from '@/assets/images/train.png'
import airports from '@/assets/data/airports.json'
import { getFlightDuration } from '@/utils/getFlightDuration.ts'

const activeTab = ref('flights')

const flights = ref<any[]>([])
const loadingFlights = ref(false)
const currentFlightPage = ref(1)
const totalFlightCount = ref(0)
const flightsPerPage = 6
const totalFlightPages = computed(() => Math.ceil(totalFlightCount.value / flightsPerPage))

const trains = ref<any[]>([])
const loadingTrains = ref(false)
const currentTrainPage = ref(1)
const totalTrainCount = ref(0)
const trainsPerPage = 6
const totalTrainPages = computed(() => Math.ceil(totalTrainCount.value / trainsPerPage))

const getCityFromIATA = (iata: string): string | undefined => {
    const match = airports.find(a => a.iata === iata)
    return match?.city
}

const getFlightDurationDisplay = (flight: any) => {
    const duration = getFlightDuration(
        flight.departure_airport,
        flight.departure_date,
        flight.departure_time,
        flight.arrival_airport,
        flight.arrival_date,
        flight.arrival_time
    )

    if (duration === null) return null

    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return `${hours}h ${minutes}m`
}

const fetchFlights = async () => {
    loadingFlights.value = true
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
        toast.error('You must be logged in.')
        loadingFlights.value = false
        return
    }

    const from = (currentFlightPage.value - 1) * flightsPerPage
    const to = from + flightsPerPage - 1

    const { data, count, error } = await client
        .from('flights')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('departure_date', { ascending: false })
        .range(from, to)

    if (error) {
        toast.error(error.message)
    } else {
        flights.value = data
        totalFlightCount.value = count || 0
    }
    loadingFlights.value = false
}

const fetchTrains = async () => {
    loadingTrains.value = true
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
        toast.error('You must be logged in.')
        loadingTrains.value = false
        return
    }

    const from = (currentTrainPage.value - 1) * trainsPerPage
    const to = from + trainsPerPage - 1

    const { data, count, error } = await client
        .from('trains')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('departure_date', { ascending: false })
        .range(from, to)

    if (error) {
        toast.error(error.message)
    } else {
        trains.value = data
        totalTrainCount.value = count || 0
    }
    loadingTrains.value = false
}

onMounted(() => {
    fetchFlights()
    fetchTrains()
})

watch(currentFlightPage, fetchFlights)
watch(currentTrainPage, fetchTrains)
</script>

<template>
    <section class="relative min-h-full overflow-hidden px-4 pb-24 lg:pb-16 pt-10 transition-colors
        bg-gradient-to-b from-lilac/40 via-white to-white
        text-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 dark:text-gray-100">

        <!-- Ambient gradient blobs: muted recipe, same as the form pages -->
        <div aria-hidden="true" class="pointer-events-none absolute inset-0">
            <div
                class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-mint/15 blur-3xl dark:bg-mint/10" />
            <div
                class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-sunset/10 blur-3xl [animation-delay:5s] dark:bg-sunset/10" />
            <div
                class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-brand/8 blur-3xl [animation-delay:9s] dark:bg-brand/5" />
        </div>

        <div class="relative z-10 mx-auto max-w-4xl">
            <!-- Escape hatch top-left, consistent with the form pages -->
            <div class="mb-2">
                <BackButton />
            </div>

            <header class="animate-in fade-in slide-in-from-bottom-4 mb-8 text-center">
                <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    My
                    <span
                        class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">Journeys</span>
                </h1>
                <p class="mt-3 text-gray-600 dark:text-gray-300">Every trip you've logged, ready to revisit.</p>
            </header>

            <Tabs v-model="activeTab" class="w-full">
                <div class="animate-in fade-in slide-in-from-bottom-8 rounded-2xl border border-white/60 bg-white/60 p-4
                    shadow-xl shadow-brand/10 backdrop-blur-md sm:p-6
                    dark:border-white/10 dark:bg-white/5 dark:shadow-brand/5">

                    <!-- Neutral iOS-style segmented control -->
                    <TabsList
                        class="mb-6 flex w-full max-w-xs rounded-xl bg-gray-100 p-1 shadow-inner dark:bg-white/10">
                        <TabsTrigger value="flights"
                            class="flex flex-1 items-center gap-2 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500
                            data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow
                            dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
                            <img :src="iconFlight" alt="" class="h-4 w-4 object-contain" />
                            <span>Flights</span>
                        </TabsTrigger>
                        <TabsTrigger value="trains"
                            class="flex flex-1 items-center gap-2 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500
                            data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow
                            dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
                            <img :src="iconTrain" alt="" class="h-4 w-4 object-contain" />
                            <span>Trains</span>
                        </TabsTrigger>
                    </TabsList>

                    <!-- Flights -->
                    <TabsContent value="flights" class="mt-0">
                        <div v-if="loadingFlights" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div v-for="i in 3" :key="i" class="h-44 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
                        </div>

                        <div v-else-if="flights.length === 0" class="flex flex-col items-center gap-5 py-14 text-center">
                            <img :src="iconFlight" alt="" class="size-12 opacity-50" />
                            <p class="max-w-sm text-gray-500 dark:text-gray-400">
                                No flights yet — your story starts with the first takeoff.
                            </p>
                            <RouterLink to="/add-flight"
                                class="rounded-lg bg-sunset px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sunset/30
                                transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40">
                                Add your first flight
                            </RouterLink>
                        </div>

                        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <RouterLink v-for="flight in flights" :key="flight.id"
                                :to="`/journeys/flight/${flight.id}`"
                                class="group rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-md
                                    transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/15
                                    dark:border-white/10 dark:bg-white/5 dark:hover:border-brand/40">
                                <div class="flex items-center justify-between gap-2 text-sm">
                                    <span class="font-semibold text-gray-900 dark:text-white">
                                        {{ flight.airline_code }}{{ flight.flight_number }}
                                    </span>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ flight.departure_date }}</span>
                                </div>

                                <div class="mt-3 text-lg font-semibold leading-snug text-gray-900 dark:text-white">
                                    {{ getCityFromIATA(flight.departure_airport) || flight.departure_airport }}
                                    <span class="text-gray-400 transition-colors group-hover:text-sunset">→</span>
                                    {{ getCityFromIATA(flight.arrival_airport) || flight.arrival_airport }}
                                </div>
                                <div class="mt-0.5 text-xs tracking-widest text-gray-500 dark:text-gray-400">
                                    {{ flight.departure_airport }} → {{ flight.arrival_airport }}
                                </div>

                                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span v-if="getFlightDurationDisplay(flight)"
                                        class="rounded-full bg-lilac/60 px-2.5 py-0.5 font-medium text-brand
                                            dark:bg-brand/15 dark:text-violet-200">
                                        {{ getFlightDurationDisplay(flight) }}
                                    </span>
                                    <span>Seat {{ flight.seat_number || '—' }}</span>
                                    <span v-if="flight.aircraft_type">· {{ flight.aircraft_type }}</span>
                                </div>
                            </RouterLink>
                        </div>

                        <Pagination :current-page="currentFlightPage" :total-pages="totalFlightPages"
                            @prev="currentFlightPage--" @next="currentFlightPage++" />
                    </TabsContent>

                    <!-- Trains -->
                    <TabsContent value="trains" class="mt-0">
                        <div v-if="loadingTrains" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div v-for="i in 3" :key="i" class="h-44 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
                        </div>

                        <div v-else-if="trains.length === 0" class="flex flex-col items-center gap-5 py-14 text-center">
                            <img :src="iconTrain" alt="" class="size-12 opacity-50" />
                            <p class="max-w-sm text-gray-500 dark:text-gray-400">
                                No train journeys yet — every great route starts at a platform.
                            </p>
                            <RouterLink to="/add-train"
                                class="rounded-lg bg-sunset px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sunset/30
                                transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40">
                                Add your first train journey
                            </RouterLink>
                        </div>

                        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <RouterLink v-for="train in trains" :key="train.id"
                                :to="`/journeys/train/${train.id}`"
                                class="group rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-md
                                    transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/15
                                    dark:border-white/10 dark:bg-white/5 dark:hover:border-brand/40">
                                <div class="flex items-center justify-between gap-2 text-sm">
                                    <span class="font-semibold text-gray-900 dark:text-white">
                                        {{ train.train_company }} {{ train.train_number }}
                                    </span>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ train.departure_date }}</span>
                                </div>

                                <div class="mt-3 text-lg font-semibold leading-snug text-gray-900 dark:text-white">
                                    {{ train.departure_station }}
                                    <span class="text-gray-400 transition-colors group-hover:text-sunset">→</span>
                                    {{ train.arrival_station }}
                                </div>
                                <div class="mt-0.5 text-xs tracking-widest text-gray-500 dark:text-gray-400">
                                    {{ train.departure_time?.slice(0, 5) }} → {{ train.arrival_time?.slice(0, 5) }}
                                </div>

                                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span v-if="train.train_type"
                                        class="rounded-full bg-lilac/60 px-2.5 py-0.5 font-medium text-brand
                                            dark:bg-brand/15 dark:text-violet-200">
                                        {{ train.train_type }}
                                    </span>
                                    <span v-if="train.coach">Coach {{ train.coach }}</span>
                                    <span>Seat {{ train.seat_number || '—' }}</span>
                                </div>
                            </RouterLink>
                        </div>

                        <Pagination :current-page="currentTrainPage" :total-pages="totalTrainPages"
                            @prev="currentTrainPage--" @next="currentTrainPage++" />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    </section>
</template>
