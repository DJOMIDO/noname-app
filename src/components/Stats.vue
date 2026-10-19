<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthUser } from '@/composables/useAuthUser'
import { useJourneys } from '@/composables/useJourneys'
import { toast } from 'vue-sonner'
import { useJourneyStats } from '@/composables/useJourneyStats'
import { yearsOf } from '@/lib/stats'
import StatsHeader, { type StatsView } from '@/components/stats/StatsHeader.vue'
import StatOverview from '@/components/StatOverview.vue'
import FlightStats from '@/components/FlightStats.vue'
import TrainStats from '@/components/TrainStats.vue'
import EmptyTab from '@/components/stats/EmptyTab.vue'
import GuestState from '@/components/GuestState.vue'
import BackButton from '@/components/BackButton.vue'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import iconJourney from '@/assets/images/journey.png'
import iconFlight from '@/assets/images/flight.png'
import iconTrain from '@/assets/images/train.png'

const { flights, trains, loading, error, load } = useJourneys()
const activeTab = ref('overview')
const view = computed(() => activeTab.value as StatsView)

// Year filter: chips derive from the full dataset, the filtered rows feed
// every card, chart and the route map below.
const yearFilter = ref<number | null>(null)
const years = computed(() => yearsOf(flights.value, trains.value))
const inYear = (date: string | null | undefined) =>
    yearFilter.value === null || Boolean(date?.startsWith(String(yearFilter.value)))
const filteredFlights = computed(() => flights.value.filter(f => inYear(f.departure_date)))
const filteredTrains = computed(() => trains.value.filter(t => inYear(t.departure_date)))

const { user, isLoggedIn, ready, fetchUser } = useAuthUser()

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
} = useJourneyStats(filteredFlights, filteredTrains)

const hasJourneys = computed(() => flights.value.length > 0 || trains.value.length > 0)

onMounted(async () => {
    await fetchUser()
    if (isLoggedIn.value && user.value) {
        await load(user.value.id)
        if (error.value) toast.error(error.value)
    } else {
        loading.value = false
    }
})
</script>

<template>
    <section class="relative min-h-full overflow-hidden px-4 pb-[calc(6rem_+_env(safe-area-inset-bottom,0px))] lg:pb-16 pt-[calc(2.5rem_+_env(safe-area-inset-top,0px))] transition-colors
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
            <div v-if="!ready || loading"
                class="animate-in fade-in rounded-2xl border border-white/60 bg-white/60 p-4 shadow-xl shadow-brand/10 backdrop-blur-md sm:p-6 dark:border-white/10 dark:bg-white/5">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="i in 6" :key="i" class="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/10" />
                </div>
            </div>

            <!-- Guest: browsing without an account session -->
            <GuestState v-else-if="!isLoggedIn"
                title="Your story, in numbers"
                text="Log in to see your travel stats, or create an account to turn your trips into charts." />

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

            <!-- Header card carries the view switcher, so no page-level TabsList;
                 content keeps its own glass cards (no card-in-card nesting) -->
            <Tabs v-else v-model="activeTab" class="animate-in fade-in slide-in-from-bottom-8 w-full">
                <StatsHeader :view="view" :flights="filteredFlights" :trains="filteredTrains"
                    :years="years" :active-year="yearFilter" class="mb-8"
                    @year-change="yearFilter = $event" />

                <TabsContent value="overview">
                    <StatOverview :total-spent-by-currency="totalSpentByCurrency" :first-departure="firstDeparture"
                        :last-departure="lastDeparture" :top-city="topCity"
                        :most-used-transport="mostUsedTransport" :most-used-airline="mostUsedAirline"
                        :most-used-train-company="mostUsedTrainCompany" />
                </TabsContent>

                <TabsContent value="flights">
                    <FlightStats v-if="filteredFlights.length" :flights="filteredFlights" :total-spent-by-currency="totalFlightSpentByCurrency" />
                    <EmptyTab v-else :icon="iconFlight" text="No flights logged yet — they'll show up here once you add some."
                        to="/add-flight" cta="Add a flight" />
                </TabsContent>

                <TabsContent value="trains">
                    <TrainStats v-if="filteredTrains.length" :trains="filteredTrains" :total-spent-by-currency="totalTrainSpentByCurrency" />
                    <EmptyTab v-else :icon="iconTrain" text="No train journeys logged yet — they'll show up here once you add some."
                        to="/add-train" cta="Add a train" />
                </TabsContent>
            </Tabs>
        </div>
    </section>
</template>
