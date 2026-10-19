<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
    Filler,
    CategoryScale,
    LinearScale
} from 'chart.js'
import { computed } from 'vue'
import { countByYear, type DatedRow } from '@/lib/stats'
import { useTheme } from '@/composables/useTheme'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, Filler, CategoryScale, LinearScale)

/**
 * JourneyYearChart — year-over-year line for any dated rows (flights, trains,
 * or a pooled "all journeys" array). Brand line with a vertical gradient fill,
 * gap years zero-filled by countByYear so the line stays continuous.
 */
const props = withDefaults(defineProps<{ rows: DatedRow[]; label?: string }>(), { label: 'Journeys' })
const { isDark } = useTheme()

const chartData = computed(() => {
    const buckets = countByYear(props.rows)
    return {
        labels: buckets.map(b => String(b.year)),
        datasets: [
            {
                label: props.label,
                data: buckets.map(b => b.count),
                borderColor: '#7b5ff1',
                borderWidth: 2,
                pointBackgroundColor: '#7b5ff1',
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.35,
                fill: true,
                // Vertical brand fade under the line; chartArea is unavailable
                // on the first layout pass, so fall back to a flat tint.
                backgroundColor: ({ chart }: { chart: ChartJS }) => {
                    const { ctx, chartArea } = chart
                    if (!chartArea) return 'rgba(123, 95, 241, 0.15)'
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
                    gradient.addColorStop(0, 'rgba(123, 95, 241, 0.35)')
                    gradient.addColorStop(1, 'rgba(123, 95, 241, 0.02)')
                    return gradient
                },
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
    <Line :data="chartData" :options="chartOptions" />
</template>
