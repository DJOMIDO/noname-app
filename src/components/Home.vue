<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TravelIntro from '@/components/TravelIntro.vue'
import HomeSummary from '@/components/HomeSummary.vue'
import ActionGrid from '@/components/ActionGrid.vue'
import hiking from '@/assets/images/hiking.svg'
import travelers from '@/assets/images/travelers.svg'
import { useAuthUser } from '@/composables/useAuthUser'
import { client } from '@/lib/neon'
import { airportByIata } from '@/lib/geo'
import { toast } from 'vue-sonner'
import type { RecentJourney } from '@/types/journeys'
import {
    FLIGHT_CARD_COLUMNS, TRAIN_CARD_COLUMNS,
    type FlightCardRow, type TrainCardRow,
} from '@/lib/journeyColumns'

const { user, isLoggedIn, ready, fetchUser } = useAuthUser()

const summaryLoading = ref(false)
const totalFlights = ref(0)
const totalTrains = ref(0)
const recent = ref<RecentJourney[]>([])

const displayName = computed(() => user.value?.name || 'Traveler')

const fetchSummary = async () => {
  if (!isLoggedIn.value || !user.value) return
  summaryLoading.value = true
  const uid = user.value.id

  const [flightRes, trainRes] = await Promise.all([
    client.from('flights').select(FLIGHT_CARD_COLUMNS, { count: 'exact' })
      .eq('user_id', uid)
      .order('departure_date', { ascending: false })
      .range(0, 4)
      .returns<FlightCardRow[]>(),
    client.from('trains').select(TRAIN_CARD_COLUMNS, { count: 'exact' })
      .eq('user_id', uid)
      .order('departure_date', { ascending: false })
      .range(0, 4)
      .returns<TrainCardRow[]>(),
  ])

  if (flightRes.error) toast.error(flightRes.error.message)
  else totalFlights.value = flightRes.count ?? 0

  if (trainRes.error) toast.error(trainRes.error.message)
  else totalTrains.value = trainRes.count ?? 0

  const flights: RecentJourney[] = (flightRes.data ?? []).map(f => ({
    id: f.id,
    type: 'flight' as const,
    routeLabel: `${airportByIata(f.departure_airport)?.city ?? f.departure_airport} → ${airportByIata(f.arrival_airport)?.city ?? f.arrival_airport}`,
    date: f.departure_date,
  }))

  const trains: RecentJourney[] = (trainRes.data ?? []).map(t => ({
    id: t.id,
    type: 'train' as const,
    routeLabel: `${t.departure_station} → ${t.arrival_station}`,
    date: t.departure_date,
  }))

  recent.value = [...flights, ...trains]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  summaryLoading.value = false
}

onMounted(async () => {
  await fetchUser()
  if (ready.value && isLoggedIn.value) fetchSummary()
})
</script>

<template>
  <section class="relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 pt-10 pb-24 transition-colors
    bg-gradient-to-b from-lilac/40 via-white to-white
    text-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 dark:text-gray-100">

    <!-- Ambient animated gradient blobs -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div
        class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-mint/30 blur-3xl dark:bg-mint/15" />
      <div
        class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-sunset/25 blur-3xl [animation-delay:5s] dark:bg-sunset/15" />
      <div
        class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-brand/20 blur-3xl [animation-delay:9s] dark:bg-brand/15" />
    </div>

    <!-- Decorative illustrations -->
    <img :src="hiking"
      class="pointer-events-none absolute bottom-6 left-4 hidden w-72 opacity-60 select-none border-0 outline-none will-change-transform xl:block dark:opacity-40" />
    <img :src="travelers"
      class="pointer-events-none absolute bottom-6 right-4 hidden w-72 opacity-60 select-none border-0 outline-none will-change-transform xl:block dark:opacity-40" />

    <div class="relative z-10 flex w-full flex-col items-center">
      <HomeSummary v-if="ready && isLoggedIn && !summaryLoading && (totalFlights > 0 || totalTrains > 0)"
        :display-name="displayName" :total-flights="totalFlights" :total-trains="totalTrains"
        :recent="recent" />
      <TravelIntro v-else />
      <ActionGrid />
    </div>
  </section>
</template>
