<script setup lang="ts">
import AutocompleteInput from '@/components/AutocompleteInput.vue'
import { searchCities } from '@/lib/stationGazetteer'

const props = defineProps<{
    modelValue: string
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

// Suggest canonical city names from the bundled gazetteer; picking one fills the
// plain city name, which the resolver maps to that city's station coordinate.
const getMatches = (query: string) => searchCities(query)
</script>

<template>
    <AutocompleteInput :model-value="modelValue" :placeholder="props.placeholder || 'Optional'"
        :get-matches="getMatches" @update:model-value="emit('update:modelValue', $event)" />
</template>
