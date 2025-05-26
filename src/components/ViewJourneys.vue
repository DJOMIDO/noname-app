<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import BackButton from '@/components/BackButton.vue'
import Pagination from '@/components/Pagination.vue'
import { toast } from 'vue-sonner'
import iconFlight from '@/assets/images/flight.png'
import iconTrain from '@/assets/images/train.png'
import hiking from '@/assets/images/hiking.svg'
import travelers from '@/assets/images/travelers.svg'

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

const fetchFlights = async () => {
    loadingFlights.value = true
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        toast.error('You must be logged in.')
        loadingFlights.value = false
        return
    }

    const from = (currentFlightPage.value - 1) * flightsPerPage
    const to = from + flightsPerPage - 1

    const { data, count, error } = await supabase
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        toast.error('You must be logged in.')
        loadingTrains.value = false
        return
    }

    const from = (currentTrainPage.value - 1) * trainsPerPage
    const to = from + trainsPerPage - 1

    const { data, count, error } = await supabase
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
    <section class="relative min-h-screen bg-white/80 dark:bg-gray-900 px-4 py-10 transition-colors">
        <img :src="hiking" class="hidden md:block absolute bottom-10 left-4 w-80 pointer-events-none select-none" />
        <img :src="travelers" class="hidden md:block absolute bottom-10 right-4 w-80 pointer-events-none select-none" />
        <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">My Journeys</h1>

        <Tabs v-model="activeTab" default-value="flights" class="w-full max-w-4xl mx-auto">
            <div class="flex items-center justify-between mb-6">
                <TabsList class="flex gap-2">
                    <TabsTrigger value="flights" class="flex items-center gap-2">
                        <img :src="iconFlight" class="w-5 h-5 object-contain" />
                        <span>Flights</span>
                    </TabsTrigger>
                    <TabsTrigger value="trains" class="flex items-center gap-2">
                        <img :src="iconTrain" class="w-5 h-5 object-contain" />
                        <span>Trains</span>
                    </TabsTrigger>
                </TabsList>
                <BackButton />
            </div>

            <TabsContent value="flights">
                <div v-if="loadingFlights" class="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                <div v-else-if="flights.length === 0" class="text-center text-gray-600 dark:text-gray-400">No flights
                    found.</div>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card v-for="flight in flights" :key="flight.id"
                        @click="$router.push(`/journeys/flight/${flight.id}`)"
                        class="z-10 cursor-pointer transition-all shadow-sm hover:shadow-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl">
                        <CardContent class="p-4 space-y-2">
                            <div class="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                                <div class="font-bold text-gray-900 dark:text-white text-base">
                                    {{ flight.airline_code }}{{ flight.flight_number }}
                                </div>
                                <div>{{ flight.departure_date }}</div>
                            </div>
                            <div class="text-center text-gray-800 dark:text-white font-medium text-lg">
                                {{ flight.departure_city || flight.departure_airport }} → {{ flight.arrival_city ||
                                    flight.arrival_airport }}
                            </div>
                            <div class="text-center text-sm text-gray-500 dark:text-gray-400 tracking-wide">
                                {{ flight.departure_airport }} → {{ flight.arrival_airport }}
                            </div>
                            <div
                                class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <div>Seat {{ flight.seat_number || '—' }}</div>
                                <div>{{ flight.aircraft_type || '—' }}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Pagination :current-page="currentFlightPage" :total-pages="totalFlightPages"
                    @prev="currentFlightPage--" @next="currentFlightPage++" />
            </TabsContent>

            <TabsContent value="trains">
                <div v-if="loadingTrains" class="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                <div v-else-if="trains.length === 0" class="text-center text-gray-600 dark:text-gray-400">No train
                    journeys found.</div>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card v-for="train in trains" :key="train.id" @click="$router.push(`/journeys/train/${train.id}`)"
                        class="z-10 cursor-pointer transition-all shadow-sm hover:shadow-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl">
                        <CardContent class="p-4 space-y-2">
                            <div class="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                                <div class="font-bold text-gray-900 dark:text-white text-base">
                                    {{ train.train_company }} {{ train.train_number }}
                                </div>
                                <div>{{ train.train_type || '—' }}</div>
                                <div>{{ train.departure_date }}</div>
                            </div>
                            <div class="text-center text-gray-800 dark:text-white font-medium text-lg">
                                {{ train.departure_station }} → {{ train.arrival_station }}
                            </div>
                            <div class="text-center text-sm text-gray-500 dark:text-gray-400 tracking-wide">
                                {{ train.departure_time?.slice(0, 5) }} → {{ train.arrival_time?.slice(0, 5) }}
                            </div>
                            <div
                                class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                                <div>{{ train.coach || '—' }}</div>
                                <div>Seat {{ train.seat_number || '—' }}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Pagination :current-page="currentTrainPage" :total-pages="totalTrainPages" @prev="currentTrainPage--"
                    @next="currentTrainPage++" />
            </TabsContent>
        </Tabs>
    </section>
</template>
