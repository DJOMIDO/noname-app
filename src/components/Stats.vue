<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { client } from '@/lib/neon'
import { toast } from 'vue-sonner'
import type { Flight, Train } from '@/types/journeys'
import { useJourneyStats } from '@/composables/useJourneyStats'
import StatOverview from '@/components/StatOverview.vue'
import FlightStats from '@/components/FlightStats.vue'
import TrainStats from '@/components/TrainStats.vue'
import BackButton from '@/components/BackButton.vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import iconJourney from '@/assets/images/journey.png'
import iconFlight from '@/assets/images/flight.png'
import iconTrain from '@/assets/images/train.png'

const flights = ref<Flight[]>([])
const trains = ref<Train[]>([])
const loading = ref(true)
const activeTab = ref('overview')

const {
    totalFlightSpentByCurrency,
    totalTrainSpentByCurrency,
    totalSpentByCurrency,
    firstDeparture,
    lastDeparture,
    topCity,
    mostUsedTransport,
    mostUsedAirline,
    mostUsedTrainCompany,
} = useJourneyStats(flights, trains)

const hasJourneys = computed(() => flights.value.length > 0 || trains.value.length > 0)

const fetchData = async () => {
    loading.value = true
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
        toast.error('You must be logged in.')
        loading.value = false
        return
    }

    const [flightRes, trainRes] = await Promise.all([
        client.from('flights').select('*').eq('user_id', user.id),
        client.from('trains').select('*').eq('user_id', user.id),
    ])

    if (flightRes.error) toast.error(flightRes.error.message)
    else flights.value = flightRes.data || []

    if (trainRes.error) toast.error(trainRes.error.message)
    else trains.value = trainRes.data || []

    loading.value = false
}

onMounted(fetchData)
</script>

<template>
    <section class="relative min-h-screen overflow-hidden px-4 pb-16 pt-10 transition-colors
        bg-gradient-to-b from-lilac/40 via-white to-white
        text-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 dark:text-gray-100">

        <!-- Ambient gradient blobs: muted recipe, consistent with the list & form pages -->
        <div aria-hidden="true" class="pointer-events-none absolute inset-0">
            <div
                class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-mint/15 blur-3xl dark:bg-mint/10" />
            <div
                class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-sunset/10 blur-3xl [animation-delay:5s] dark:bg-sunset/10" />
            <div
                class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-brand/8 blur-3xl [animation-delay:9s] dark:bg-brand/5" />
        </div>

        <div class="relative z-10 mx-auto max-w-6xl">
            <div class="mb-2">
                <BackButton />
            </div>

            <header class="animate-in fade-in slide-in-from-bottom-4 mb-8 text-center">
                <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Journey
                    <span
                        class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">Dashboard</span>
                </h1>
                <p class="mt-3 text-gray-600 dark:text-gray-300">Your travels, turned into numbers and stories.</p>
            </header>

            <!-- Loading: pulse skeleton grid -->
            <div v-if="loading"
                class="animate-in fade-in rounded-2xl border border-white/60 bg-white/60 p-4 shadow-xl shadow-brand/10 backdrop-blur-md sm:p-6 dark:border-white/10 dark:bg-white/5">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="i in 6" :key="i" class="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
                </div>
            </div>

            <!-- Empty: no journeys at all -->
            <div v-else-if="!hasJourneys"
                class="animate-in fade-in flex flex-col items-center gap-5 rounded-2xl border border-white/60 bg-white/60 px-4 py-16 text-center shadow-xl shadow-brand/10 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                <img :src="iconJourney" alt="" class="size-14 opacity-60" />
                <p class="max-w-sm text-gray-500 dark:text-gray-400">
                    No journeys logged yet — add your first trip to start seeing your story unfold.
                </p>
                <div class="flex flex-wrap items-center justify-center gap-3">
                    <RouterLink to="/add-flight"
                        class="inline-flex items-center gap-2 rounded-lg bg-sunset px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sunset/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40">
                        <img :src="iconFlight" alt="" class="h-4 w-4 object-contain" />
                        <span>Add a flight</span>
                    </RouterLink>
                    <RouterLink to="/add-train"
                        class="inline-flex items-center gap-2 rounded-lg border border-brand/30 bg-white/70 px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/50 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-violet-200">
                        <img :src="iconTrain" alt="" class="h-4 w-4 object-contain" />
                        <span>Add a train</span>
                    </RouterLink>
                </div>
            </div>

            <!-- Tabs -->
            <div v-else
                class="animate-in fade-in slide-in-from-bottom-8 rounded-2xl border border-white/60 bg-white/60 p-4 shadow-xl shadow-brand/10 backdrop-blur-md sm:p-6 dark:border-white/10 dark:bg-white/5">
                <Tabs v-model="activeTab" class="w-full">
                    <!-- Neutral iOS-style segmented control -->
                    <TabsList class="mx-auto mb-6 flex w-full max-w-md rounded-xl bg-gray-100 p-1 shadow-inner dark:bg-white/10">
                        <TabsTrigger value="overview"
                            class="flex-1 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="flights"
                            class="flex flex-1 items-center justify-center gap-2 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
                            <img :src="iconFlight" alt="" class="h-4 w-4 object-contain" />
                            <span>Flights</span>
                        </TabsTrigger>
                        <TabsTrigger value="trains"
                            class="flex flex-1 items-center justify-center gap-2 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
                            <img :src="iconTrain" alt="" class="h-4 w-4 object-contain" />
                            <span>Trains</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <StatOverview :flight-count="flights.length" :train-count="trains.length"
                            :total-spent-by-currency="totalSpentByCurrency" :first-departure="firstDeparture"
                            :last-departure="lastDeparture" :top-city="topCity"
                            :most-used-transport="mostUsedTransport" :most-used-airline="mostUsedAirline"
                            :most-used-train-company="mostUsedTrainCompany" />
                    </TabsContent>

                    <TabsContent value="flights">
                        <FlightStats :flights="flights" :total-spent-by-currency="totalFlightSpentByCurrency" />
                    </TabsContent>

                    <TabsContent value="trains">
                        <TrainStats :trains="trains" :total-spent-by-currency="totalTrainSpentByCurrency" />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    </section>
</template>
