<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
} from 'chart.js'
import { computed } from 'vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{ flights: any[] }>()

const chartData = computed(() => {
    const counts: Record<string, number> = {}
    props.flights.forEach(flight => {
        const date = new Date(flight.departure_date)
        const month = date.toLocaleString('default', { month: 'short', year: 'numeric' })
        counts[month] = (counts[month] || 0) + 1
    })

    const labels = Object.keys(counts).sort((a, b) =>
        new Date(a).getTime() - new Date(b).getTime()
    )
    const data = labels.map(label => counts[label])

    return {
        labels,
        datasets: [
            {
                label: 'Flights per Month',
                data,
                backgroundColor: '#4f46e5'
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    plugins: {
        legend: {
            display: false
        },
        title: {
            display: true,
            text: 'Flight Count per Month'
        }
    }
}
</script>

<template>
    <Bar :data="chartData" :options="chartOptions" />
</template>
