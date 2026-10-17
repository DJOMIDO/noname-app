<script setup lang="ts">
import airports from '@/assets/data/airports.json'
import AutocompleteInput from '@/components/AutocompleteInput.vue'

const props = defineProps<{
    modelValue: string
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const getMatches = (query: string) =>
    airports
        .filter(a =>
            a.name.toLowerCase().includes(query) ||
            a.iata.toLowerCase().includes(query) ||
            a.city?.toLowerCase().includes(query) ||
            a.country?.toLowerCase().includes(query)
        )
        .slice(0, 12)
        .map(a => `${a.name} (${a.iata})`)
</script>

<template>
    <AutocompleteInput :model-value="modelValue" :placeholder="props.placeholder || 'Airport (e.g. CDG or Charles de Gaulle)'"
        :get-matches="getMatches" @update:model-value="emit('update:modelValue', $event)" />
</template>
