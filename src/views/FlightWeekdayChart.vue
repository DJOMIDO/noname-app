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
import { countByWeekday } from '@/lib/stats'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{ flights: FlightStatsRow[] }>()
const { isDark } = useTheme()

// countByWeekday returns Sunday-first buckets (Date#getDay order); the chart
// reads better Monday-first, so rotate the week before labelling.
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const chartData = computed(() => {
    const buckets = countByWeekday(props.flights)
    const rotated = [...buckets.slice(1), buckets[0]]
    return {
        labels: WEEKDAY_LABELS,
        datasets: [
            {
                label: 'Flights',
                data: rotated.map(b => b.count),
                backgroundColor: '#ff8b37',
                borderRadius: 6,
                maxBarThickness: 42,
            },
        ],
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
            x: { ticks: { color: text }, grid: { display: false } },
            y: {
                ticks: { color: text, precision: 0 },
                grid: { color: grid },
                beginAtZero: true,
            },
        },
    }
})
</script>

<template>
    <Bar :data="chartData" :options="chartOptions" />
</template>
