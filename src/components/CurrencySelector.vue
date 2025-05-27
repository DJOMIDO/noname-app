<script setup lang="ts">
import { ref, watch } from 'vue'
import currencies from '@/assets/data/currencies.json'
import { Input } from '@/components/ui/input'

const props = defineProps<{
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const input = ref(props.modelValue)
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)

const filterCurrencies = () => {
    const query = input.value.toLowerCase()
    if (!query) {
        suggestions.value = []
        return
    }

    suggestions.value = Object.entries(currencies)
        .filter(([code, data]) =>
            code.toLowerCase().includes(query) ||
            data.name.toLowerCase().includes(query)
        )
        .slice(0, 8)
        .map(([code, data]) => `${data.name} (${code})`)

    showSuggestions.value = suggestions.value.length > 0
}

watch(input, (newVal) => {
    filterCurrencies()
    emit('update:modelValue', newVal)
})

const selectSuggestion = (item: string) => {
    const code = item.match(/\(([^)]+)\)$/)?.[1] || item
    input.value = code
    emit('update:modelValue', code)
    showSuggestions.value = false
}

const handleBlur = () => {
    setTimeout(() => {
        showSuggestions.value = false
    }, 150)
}
</script>

<template>
    <div class="relative w-full">
        <Input v-model="input" @focus="filterCurrencies" @blur="handleBlur" placeholder="Currency (e.g. EUR or Euro)" />
        <ul v-if="showSuggestions"
            class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md max-h-56 overflow-auto">
            <li v-for="item in suggestions" :key="item" @click="selectSuggestion(item)"
                class="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100">
                {{ item }}
            </li>
        </ul>
    </div>
</template>
