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
    const routeMap: Record<string, number> = {}

    props.flights.forEach(flight => {
        const route = `${flight.departure_airport} → ${flight.arrival_airport}`
        routeMap[route] = (routeMap[route] || 0) + 1
    })

    const sortedRoutes = Object.entries(routeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

    const labels = sortedRoutes.map(([route]) => route)
    const data = sortedRoutes.map(([, count]) => count)

    return {
        labels,
        datasets: [
            {
                label: 'Route Count',
                data,
                backgroundColor: '#16a34a'
            }
        ]
    }
})

const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
        legend: {
            display: false
        },
        title: {
            display: true,
            text: 'Top Flight Routes'
        }
    },
    scales: {
        x: {
            beginAtZero: true
        }
    }
}
</script>

<template>
    <Bar :data="chartData" :options="chartOptions" />
</template>
