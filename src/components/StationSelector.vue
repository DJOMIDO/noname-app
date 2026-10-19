<script setup lang="ts">
import AutocompleteInput from '@/components/AutocompleteInput.vue'
import { searchStations } from '@/lib/stationGazetteer'

const props = defineProps<{
    modelValue: string
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

// Suggest canonical station names from the bundled gazetteer; picking one fills
// the exact dataset name so the route map resolves it without fuzzy matching.
const getMatches = (query: string) => searchStations(query)
</script>

<template>
    <AutocompleteInput :model-value="modelValue"
        :placeholder="props.placeholder || 'Station (e.g. Gare de Lyon)'" :get-matches="getMatches"
        @update:model-value="emit('update:modelValue', $event)" />
</template>
