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
import { countByMonth, type DatedRow } from '@/lib/stats'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

/**
 * JourneyMonthChart — brand bars per calendar month (oldest first) for any
 * dated rows. Only months that actually occur are shown; countByMonth parses
 * dates as local midnight so a bare `YYYY-MM-DD` cannot drift a month.
 */
const props = withDefaults(defineProps<{ rows: DatedRow[]; label?: string }>(), { label: 'Journeys' })
const { isDark } = useTheme()

const chartData = computed(() => {
    const buckets = countByMonth(props.rows)
    return {
        labels: buckets.map(b => b.label),
        datasets: [
            {
                label: props.label,
                data: buckets.map(b => b.count),
                backgroundColor: '#7b5ff1',
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
            x: { ticks: { color: text }, grid: { color: grid } },
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
