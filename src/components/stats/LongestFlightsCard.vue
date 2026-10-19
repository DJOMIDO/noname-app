<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FlightStatsRow } from '@/lib/journeyColumns'
import { getFlightDuration } from '@/utils/getFlightDuration'
import { flightLegDistanceKm } from '@/lib/stats'
import { cn } from '@/lib/utils'
import TopListCard, { type TopListItem } from '@/components/stats/TopListCard.vue'

/**
 * LongestFlightsCard — ranks every flight by airborne time or great-circle
 * distance (toggle lives in the card's #actions slot), rendered through
 * TopListCard so the full ranking unfolds as a floating panel; the shortest
 * flight sits at the bottom of that panel. Rows without resolvable
 * duration/distance are skipped rather than shown as zero.
 */
const props = defineProps<{ flights: FlightStatsRow[] }>()

const metric = ref<'time' | 'distance'>('time')

const timeItems = computed<TopListItem[]>(() =>
    props.flights
        .map(f => ({
            f,
            minutes: getFlightDuration(
                f.departure_airport, f.departure_date, f.departure_time,
                f.arrival_airport, f.arrival_date, f.arrival_time,
            ),
        }))
        .filter((entry): entry is { f: FlightStatsRow; minutes: number } => entry.minutes !== null)
        .sort((a, b) => b.minutes - a.minutes)
        .map(({ f, minutes }) => ({
            label: `${f.departure_airport} → ${f.arrival_airport}`,
            sub: f.departure_date,
            value: minutes,
            display: `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
        })),
)

const distanceItems = computed<TopListItem[]>(() =>
    props.flights
        .map(f => ({ f, km: flightLegDistanceKm(f) }))
        .filter(entry => entry.km > 0)
        .sort((a, b) => b.km - a.km)
        .map(({ f, km }) => ({
            label: `${f.departure_airport} → ${f.arrival_airport}`,
            sub: f.departure_date,
            value: km,
            display: `${km.toLocaleString()} km`,
        })),
)

const items = computed(() => (metric.value === 'time' ? timeItems.value : distanceItems.value))

const toggleClass = (active: boolean) => cn(
    'cursor-pointer rounded-md border-0 px-2.5 py-1 text-xs font-medium transition-colors',
    active
        ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
        : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
)
</script>

<template>
    <TopListCard title="Longest Flights" :items="items">
        <template #actions>
            <div class="flex shrink-0 rounded-lg bg-gray-100 p-0.5 dark:bg-white/10" role="group"
                aria-label="Rank longest flights by">
                <button type="button" :class="toggleClass(metric === 'time')"
                    :aria-pressed="metric === 'time'" @click="metric = 'time'">
                    Time
                </button>
                <button type="button" :class="toggleClass(metric === 'distance')"
                    :aria-pressed="metric === 'distance'" @click="metric = 'distance'">
                    Distance
                </button>
            </div>
        </template>
    </TopListCard>
</template>
