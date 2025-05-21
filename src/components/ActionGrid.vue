<script setup lang="ts">
import ActionCard from './ActionCard.vue'
import iconFlight from '@/assets/images/flight.png'
import iconTrain from '@/assets/images/train.png'
import iconJourney from '@/assets/images/journey.png'
import iconStats from '@/assets/images/stats.png'

const actions = [
  { icon: iconFlight, title: 'Add Flight', to: '/add-flight' },
  { icon: iconTrain, title: 'Add Train', to: '/add-train' },
  { icon: iconJourney, title: 'View Journeys', to: '/journeys' },
  { icon: iconStats, title: 'Statistics', to: '/stats' }
]
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
    <ActionCard v-for="(action, index) in actions" :key="index" v-bind="action" />
  </div>
</template>
