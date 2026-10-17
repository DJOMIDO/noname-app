<script setup lang="ts">
import airlines from '@/assets/data/airlines.json'
import AutocompleteInput from '@/components/AutocompleteInput.vue'

defineProps<{
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const getMatches = (query: string) =>
    airlines
        .filter(a => a.name.toLowerCase().includes(query) || a.code.toLowerCase().includes(query))
        .slice(0, 6)
        .map(a => `${a.name} (${a.code})`)
</script>

<template>
    <AutocompleteInput :model-value="modelValue" placeholder="Airline (e.g. AF or Air France)"
        :get-matches="getMatches" dropdown-class="max-h-56 overflow-y-auto"
        @update:model-value="emit('update:modelValue', $event)" />
</template>
