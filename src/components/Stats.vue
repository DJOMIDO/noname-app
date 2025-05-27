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
    return matched ? matched.name : topCode
})

const mostUsedTrainCompany = computed(() => {
    const companies = trains.value.map(t => t.train_company).filter(Boolean)
    const count: Record<string, number> = {}
    for (const c of companies) count[c] = (count[c] || 0) + 1
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

const totalFlightSpentByCurrency = computed(() => {
    const totals: Record<string, number> = {}

    flights.value.forEach(f => {
        const price = Number(f.price)
        const currency = f.currency
        if (!currency || !price) return
        if (!totals[currency]) totals[currency] = 0
        totals[currency] += price
    })

    return totals
})

const totalTrainSpentByCurrency = computed(() => {
    const totals: Record<string, number> = {}

    trains.value.forEach(t => {
        const price = Number(t.price)
        const currency = t.currency
        if (!currency || !price) return
        if (!totals[currency]) totals[currency] = 0
        totals[currency] += price
    })

    return totals
})

const totalSpentByCurrency = computed(() => {
    const merged: Record<string, number> = { ...totalFlightSpentByCurrency.value }

    for (const [currency, amount] of Object.entries(totalTrainSpentByCurrency.value)) {
        if (!merged[currency]) merged[currency] = 0
        merged[currency] += amount
    }

    return merged
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
                <StatOverview :flight-count="flights.length" :train-count="trains.length"
                    :total-spent-by-currency="totalSpentByCurrency" :first-departure="firstDepartureDate"
                    :last-departure="lastDepartureDate" :top-city="mostVisitedCity"
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

    </section>
</template>
