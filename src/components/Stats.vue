<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'
import StatOverview from '@/components/StatOverview.vue'
import BackButton from '@/components/BackButton.vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import airlines from '@/assets/data/airlines.json'

import FlightStats from './FlightStats.vue'
import TrainStats from './TrainStats.vue'

const flights = ref<any[]>([])
const trains = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('overview')

const allJourneys = computed(() => [...flights.value, ...trains.value])

const firstDepartureDate = computed(() => {
    const allDates = allJourneys.value
        .map(j => j.departure_date)
        .filter(Boolean)
        .sort()
    return allDates[0] || null
})

const lastDepartureDate = computed(() => {
    const allDates = allJourneys.value
        .map(j => j.departure_date)
        .filter(Boolean)
        .sort()
    return allDates[allDates.length - 1] || null
})

const mostVisitedCity = computed(() => {
    const cities = [...flights.value.map(f => f.arrival_city), ...trains.value.map(t => t.arrival_city)]
    const count: Record<string, number> = {}

    for (const c of cities) {
        if (c) count[c] = (count[c] || 0) + 1
    }

    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
})

const mostUsedTransport = computed(() => {
    const f = flights.value.length
    const t = trains.value.length
    return f > t ? 'Flight' : f < t ? 'Train' : 'Equal'
})

const mostUsedAirline = computed(() => {
    const airlinesUsed = flights.value.map(f => f.airline_code).filter(Boolean)
    const count: Record<string, number> = {}
    for (const code of airlinesUsed) {
        count[code] = (count[code] || 0) + 1
    }

    const topCode = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0]

    if (!topCode) return 'N/A'

    const matched = airlines.find(a => a.code === topCode)
    return matched ? `${matched.name} (${matched.code})` : topCode
})

const mostUsedTrainCompany = computed(() => {
    const companies = trains.value.map(t => t.train_company).filter(Boolean)
    const count: Record<string, number> = {}
    for (const c of companies) count[c] = (count[c] || 0) + 1
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
})

const mostUsedFlightNo = computed(() => {
    const combos = flights.value
        .filter(f => f.airline_code && f.flight_number)
        .map(f => `${f.airline_code}${f.flight_number}`)

    const count: Record<string, number> = {}
    for (const combo of combos) {
        count[combo] = (count[combo] || 0) + 1
    }

    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
})

const mostCommonFlightRoute = computed(() => {
    const routes = flights.value.map(f => `${f.departure_airport} → ${f.arrival_airport}`).filter(Boolean)
    const count: Record<string, number> = {}
    for (const r of routes) count[r] = (count[r] || 0) + 1
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
})

const mostCommonTrainRoute = computed(() => {
    const routes = trains.value.map(t => `${t.departure_station} → ${t.arrival_station}`).filter(Boolean)
    const count: Record<string, number> = {}
    for (const r of routes) count[r] = (count[r] || 0) + 1
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
})

const fetchData = async () => {
    loading.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        toast.error('You must be logged in.')
        loading.value = false
        return
    }

    const [flightRes, trainRes] = await Promise.all([
        supabase.from('flights').select('*').eq('user_id', user.id),
        supabase.from('trains').select('*').eq('user_id', user.id)
    ])

    if (flightRes.error) toast.error(flightRes.error.message)
    else flights.value = flightRes.data || []

    if (trainRes.error) toast.error(trainRes.error.message)
    else trains.value = trainRes.data || []

    loading.value = false
}

onMounted(fetchData)

const totalSpent = computed(() => {
    const flightSum = flights.value.reduce((acc, f) => acc + (f.price || 0), 0)
    const trainSum = trains.value.reduce((acc, t) => acc + (t.price || 0), 0)
    return flightSum + trainSum
})
</script>

<template>
    <section class="min-h-screen bg-white/80 dark:bg-gray-900 px-4 py-10 transition-colors">
        <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Journey Dashboard</h1>

        <div v-if="loading" class="text-center text-gray-500 dark:text-gray-300">Loading...</div>

        <Tabs v-model="activeTab" default-value="overview" class="w-full max-w-4xl mx-auto">
            <div class="flex justify-between mb-6">
                <TabsList class="flex gap-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="flights">Flights</TabsTrigger>
                    <TabsTrigger value="trains">Trains</TabsTrigger>
                </TabsList>
                <BackButton />
            </div>

            <TabsContent value="overview">
                <StatOverview :flight-count="flights.length" :train-count="trains.length" :total-spent="totalSpent"
                    :first-departure="firstDepartureDate" :last-departure="lastDepartureDate"
                    :top-city="mostVisitedCity" :most-used-transport="mostUsedTransport"
                    :most-used-airline="mostUsedAirline" :most-used-train-company="mostUsedTrainCompany"
                    :most-common-flight-route="mostCommonFlightRoute" :most-common-train-route="mostCommonTrainRoute"
                    :most-used-flight-number="mostUsedFlightNo" />
            </TabsContent>

            <TabsContent value="flights">
                <FlightStats :flights="flights" />
            </TabsContent>

            <TabsContent value="trains">
                <TrainStats :trains="trains" />
            </TabsContent>

        </Tabs>

    </section>
</template>
