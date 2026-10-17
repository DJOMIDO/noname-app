<script setup lang="ts">
import currencies from '@/assets/data/currencies.json'
import AutocompleteInput from '@/components/AutocompleteInput.vue'

defineProps<{
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const getMatches = (query: string) =>
    Object.entries(currencies)
        .filter(([code, data]) =>
            code.toLowerCase().includes(query) ||
            data.name.toLowerCase().includes(query)
        )
        .slice(0, 8)
        .map(([code, data]) => `${data.name} (${code})`)
</script>

<template>
    <AutocompleteInput :model-value="modelValue" placeholder="Currency (e.g. EUR or Euro)"
        :get-matches="getMatches" dropdown-class="max-h-56 overflow-y-auto"
        @update:model-value="emit('update:modelValue', $event)" />
</template>
