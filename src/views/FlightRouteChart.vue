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
import type { FlightStatsRow } from '@/lib/journeyColumns'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{ flights: FlightStatsRow[] }>()
const { isDark } = useTheme()

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
                backgroundColor: '#55d087'
            }
        ]
    }
})

const chartOptions = computed(() => {
    const text = isDark.value ? '#d1d5db' : '#374151'
    const grid = isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
    return {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            x: { ticks: { color: text }, grid: { color: grid }, beginAtZero: true },
            y: { ticks: { color: text }, grid: { color: grid } },
        },
    }
})
</script>

<template>
    <Bar :data="chartData" :options="chartOptions" />
</template>
