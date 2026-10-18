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

    <!-- Identity left, recent journeys right: the wide card would leave the whole
         top-right empty if both blocks stacked in one column. -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8">

      <!-- Greeting + counts -->
      <div class="flex flex-col lg:justify-between">
        <div>
          <p class="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Welcome back</p>
          <h1
            class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {{ displayName }}
          </h1>
        </div>

        <div class="mt-5 flex flex-wrap gap-2 lg:mt-0">
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
      </div>

      <!-- Recent journeys: one row each, so a long route label stays on a single line -->
      <div class="lg:border-l lg:border-white/60 lg:pl-8 dark:border-white/10">
        <p
          class="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Recent journeys
        </p>
        <ul class="space-y-2">
          <li v-for="j in recent" :key="j.id">
            <RouterLink :to="`/journeys/${j.type}/${j.id}`"
              class="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-3 py-2.5
                backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40
                hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-brand/40">
              <span class="flex w-16 shrink-0 items-center gap-1.5">
                <img :src="j.type === 'flight' ? iconFlight : iconTrain" alt=""
                  class="h-3.5 w-3.5 object-contain" />
                <span class="text-xs font-semibold text-gray-600 dark:text-gray-300">{{
                  j.type === 'flight' ? 'Flight' : 'Train' }}</span>
              </span>
              <span class="min-w-0 flex-1 truncate text-sm font-semibold leading-snug text-gray-900 dark:text-white">
                {{ j.routeLabel }}
              </span>
              <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">{{
                fmtDate(j.date) }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
