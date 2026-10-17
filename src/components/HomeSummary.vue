<script setup lang="ts">
import { RouterLink } from 'vue-router'
import iconFlight from '@/assets/images/flight.png'
import iconTrain from '@/assets/images/train.png'
import type { RecentJourney } from '@/types/journeys'

defineProps<{
  displayName: string
  totalFlights: number
  totalTrains: number
  recent: RecentJourney[]
}>()

const fmtDate = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div
    class="animate-in fade-in slide-in-from-bottom-6 mb-8 w-full max-w-4xl rounded-3xl
      border border-white/60 bg-white/70 p-6 shadow-xl shadow-brand/10 backdrop-blur-md
      sm:p-8 dark:border-white/10 dark:bg-white/5">

    <!-- Greeting -->
    <p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Welcome back</p>
    <h1
      class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
      {{ displayName }}
    </h1>

    <!-- Count chips -->
    <div class="mt-5 mb-6 flex flex-wrap gap-2">
      <span
        class="inline-flex items-center gap-1.5 rounded-full bg-lilac/50 px-3 py-1 text-sm font-medium text-brand dark:bg-brand/15 dark:text-violet-200">
        <img :src="iconFlight" alt="" class="h-3.5 w-3.5 object-contain" />
        {{ totalFlights }} flight{{ totalFlights !== 1 ? 's' : '' }}
      </span>
      <span
        class="inline-flex items-center gap-1.5 rounded-full bg-mint/40 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <img :src="iconTrain" alt="" class="h-3.5 w-3.5 object-contain" />
        {{ totalTrains }} train{{ totalTrains !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Recent journeys -->
    <div>
      <p
        class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        Recent journeys
      </p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <RouterLink v-for="j in recent" :key="j.id"
          :to="`/journeys/${j.type}/${j.id}`"
          class="group rounded-2xl border border-white/70 bg-white/60 p-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-brand/40">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <img :src="j.type === 'flight' ? iconFlight : iconTrain" alt=""
                class="h-3.5 w-3.5 object-contain" />
              {{ j.type === 'flight' ? 'Flight' : 'Train' }}
            </span>
            <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">{{
              fmtDate(j.date) }}</span>
          </div>
          <div
            class="text-sm font-semibold leading-snug text-gray-900 dark:text-white">
            {{ j.routeLabel }}
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
