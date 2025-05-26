<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton.vue'
import AddTrainBasic from '@/components/AddTrainBasic.vue'
import AddTrainDetailed from '@/components/AddTrainDetailed.vue'
import hiking from '@/assets/images/hiking.svg'
import travelers from '@/assets/images/travelers.svg'

const trainCompany = ref('')
const trainNumber = ref('')
const trainType = ref('')
const departureStation = ref('')
const arrivalStation = ref('')
const departureCity = ref('')
const arrivalCity = ref('')
const departureDate = ref('')
const departureTime = ref('')
const arrivalDate = ref('')
const arrivalTime = ref('')
const coach = ref('')
const seatNumber = ref('')
const price = ref('')
const currency = ref('')
const bookingRef = ref('')
const notes = ref('')

const currentTab = ref('basic')

const handleSubmit = async () => {
    const isBlank = (val: string) => !val || val.trim() === ''

    if (
        isBlank(trainCompany.value) ||
        isBlank(trainNumber.value) ||
        isBlank(departureStation.value) ||
        isBlank(arrivalStation.value) ||
        isBlank(departureDate.value)
    ) {
        toast.error('Please fill in all required fields.')
        return
    }

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        toast.error('You must be logged in.')
        return
    }

    const { error } = await supabase.from('trains').insert({
        user_id: user.id,
        train_company: trainCompany.value,
        train_number: trainNumber.value,
        train_type: trainType.value || null,
        departure_station: departureStation.value,
        arrival_station: arrivalStation.value,
        departure_city: departureCity.value || null,
        arrival_city: arrivalCity.value || null,
        departure_date: departureDate.value,
        departure_time: departureTime.value || null,
        arrival_date: arrivalDate.value || null,
        arrival_time: arrivalTime.value || null,
        coach: coach.value || null,
        seat_number: seatNumber.value || null,
        price: Number(price.value) || null,
        currency: currency.value || null,
        booking_ref: bookingRef.value || null,
        notes: notes.value || null
    })

    if (error) {
        toast.error(error.message)
    } else {
        toast.success('Train added successfully!')
        trainCompany.value = ''
        trainNumber.value = ''
        trainType.value = ''
        departureStation.value = ''
        arrivalStation.value = ''
        departureCity.value = ''
        arrivalCity.value = ''
        departureDate.value = ''
        departureTime.value = ''
        arrivalDate.value = ''
        arrivalTime.value = ''
        coach.value = ''
        seatNumber.value = ''
        price.value = ''
        currency.value = ''
        bookingRef.value = ''
        notes.value = ''
    }
}
</script>

<template>
    <section class="relative min-h-screen bg-white/80 dark:bg-gray-900 px-4 py-10 transition-colors">
        <img :src="hiking" class="hidden md:block absolute bottom-10 left-4 w-80 pointer-events-none select-none" />
        <img :src="travelers" class="hidden md:block absolute bottom-10 right-4 w-80 pointer-events-none select-none" />

        <Tabs v-model="currentTab" class="relative z-10 max-w-2xl mx-auto">
            <div class="flex items-center justify-between mb-6">
                <TabsList class="flex gap-2">
                    <TabsTrigger value="basic" class="flex items-center gap-2">Basic</TabsTrigger>
                    <TabsTrigger value="detailed" class="flex items-center gap-2">Detailed</TabsTrigger>
                </TabsList>
                <BackButton />
            </div>

            <TabsContent value="basic">
                <AddTrainBasic v-model:trainCompany="trainCompany" v-model:trainNumber="trainNumber"
                    v-model:departureStation="departureStation" v-model:arrivalStation="arrivalStation"
                    v-model:departureDate="departureDate" />
            </TabsContent>

            <TabsContent value="detailed">
                <AddTrainDetailed v-model:trainCompany="trainCompany" v-model:trainNumber="trainNumber"
                    v-model:trainType="trainType" v-model:departureStation="departureStation"
                    v-model:arrivalStation="arrivalStation" v-model:departureCity="departureCity"
                    v-model:arrivalCity="arrivalCity" v-model:departureDate="departureDate"
                    v-model:departureTime="departureTime" v-model:arrivalDate="arrivalDate"
                    v-model:arrivalTime="arrivalTime" v-model:coach="coach" v-model:seatNumber="seatNumber"
                    v-model:price="price" v-model:currency="currency" v-model:bookingRef="bookingRef"
                    v-model:notes="notes" />
            </TabsContent>

            <div class="mt-6">
                <Button class="w-full" @click="handleSubmit">Save Train Journey</Button>
            </div>
        </Tabs>
    </section>
</template>
