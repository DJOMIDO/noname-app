<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { toast } from 'vue-sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton.vue'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import iconTrain from '@/assets/images/train.png'

const route = useRoute()
const router = useRouter()

const isEditing = ref(false)
const train = ref<any>(null)
const loading = ref(true)

const form = ref({
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
    booking_ref: '',
    price: '',
    currency: '',
    notes: ''
})

const fetchTrain = async () => {
    const { data, error } = await supabase.from('trains').select('*').eq('id', route.params.id).single()

    if (error) {
        toast.error('Failed to load train record.')
    } else {
        train.value = data
        Object.assign(form.value, data)
    }
    loading.value = false
}

const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this train journey?')
    if (!confirmDelete) return

    const { error } = await supabase.from('trains').delete().eq('id', route.params.id)

    if (error) {
        toast.error('Delete failed: ' + error.message)
    } else {
        toast.success('Train journey deleted.')
        router.push('/journeys')
    }
}

const handleUpdate = async () => {
    const { error } = await supabase.from('trains').update(form.value).eq('id', route.params.id)

    if (error) {
        toast.error('Update failed: ' + error.message)
    } else {
        toast.success('Train journey updated.')
        isEditing.value = false
        fetchTrain()
    }
}

onMounted(fetchTrain)
</script>

<template>
    <section class="min-h-screen bg-white/80 dark:bg-gray-900 px-4 py-10 transition-colors">
        <div class="flex items-center justify-between max-w-2xl mx-auto mb-6">
            <div class="flex gap-2 items-center text-xl font-semibold text-gray-800 dark:text-white">
                <img :src="iconTrain" class="w-6 h-6 object-contain" />
                <span>{{ form.train_company }} {{ form.train_number }}</span>
            </div>
            <BackButton />
        </div>
        <Card class="max-w-2xl mx-auto bg-gray-50 dark:bg-gray-800 shadow-md">
            <CardContent class="p-6 space-y-6">
                <div v-if="loading" class="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                <div v-else-if="!train" class="text-center text-red-500">Train not found.</div>
                <div v-else class="space-y-6">

                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Train Info</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <Input v-model="form.train_company" :disabled="!isEditing" placeholder="Train Company" />
                            <Input v-model="form.train_number" :disabled="!isEditing" placeholder="Train Number" />
                            <Input v-model="form.train_type" :disabled="!isEditing" placeholder="Train Type" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Stations</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <Input v-model="form.departure_station" :disabled="!isEditing"
                                placeholder="Departure Station" />
                            <Input v-model="form.arrival_station" :disabled="!isEditing"
                                placeholder="Arrival Station" />
                            <Input v-model="form.departure_city" :disabled="!isEditing" placeholder="Departure City" />
                            <Input v-model="form.arrival_city" :disabled="!isEditing" placeholder="Arrival City" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Schedule</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <Input v-model="form.departure_date" :disabled="!isEditing" type="date" />
                            <Input v-model="form.departure_time" :disabled="!isEditing" type="time" />
                            <Input v-model="form.arrival_date" :disabled="!isEditing" type="date" />
                            <Input v-model="form.arrival_time" :disabled="!isEditing" type="time" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Passenger Info</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <Input v-model="form.coach" :disabled="!isEditing" placeholder="Coach" />
                            <Input v-model="form.seat_number" :disabled="!isEditing" placeholder="Seat Number" />
                            <Input v-model="form.booking_ref" :disabled="!isEditing" placeholder="Booking Reference" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Price</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <Input v-model="form.price" :disabled="!isEditing" type="number" placeholder="Price" />
                            <Input v-model="form.currency" :disabled="!isEditing" placeholder="Currency" />
                        </div>

                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Notes</h3>
                        <Textarea v-model="form.notes" :disabled="!isEditing" placeholder="Notes" rows="3" />

                        <div class="flex flex-wrap gap-4 pt-4">
                            <Button variant="destructive" @click="handleDelete">Delete</Button>
                            <Button v-if="!isEditing" @click="isEditing = true">Edit</Button>
                            <Button v-else @click="handleUpdate">Save</Button>
                            <Button v-if="isEditing" @click="isEditing = false" variant="secondary">Cancel</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </section>
</template>