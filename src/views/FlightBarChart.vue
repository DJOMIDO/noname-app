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
import type { Flight } from '@/types/journeys'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{ flights: Flight[] }>()
const { isDark } = useTheme()

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
                backgroundColor: '#7b5ff1'
            }
        ]
    }
})

const chartOptions = computed(() => {
    const text = isDark.value ? '#d1d5db' : '#374151'
    const grid = isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            x: { ticks: { color: text }, grid: { color: grid } },
            y: { ticks: { color: text }, grid: { color: grid }, beginAtZero: true },
        },
    }
})
</script>

<template>
    <Bar :data="chartData" :options="chartOptions" />
</template>
