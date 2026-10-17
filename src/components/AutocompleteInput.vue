<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { fieldClass } from '@/lib/formStyles'

/**
 * AutocompleteInput — shared text input with a "Name (CODE)" suggestion dropdown.
 * Callers provide the match function; picking a suggestion fills the code part.
 */
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  getMatches: (query: string) => string[]
  dropdownClass?: string
}>(), {
  placeholder: undefined,
  dropdownClass: 'max-h-64 overflow-y-auto',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const input = ref(props.modelValue)
const suggestions = ref<string[]>([])
const showSuggestions = ref(false)

const filter = () => {
  const query = input.value.toLowerCase()
  if (!query) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  suggestions.value = props.getMatches(query)
  showSuggestions.value = suggestions.value.length > 0
}

// Keep in sync when the parent resets the field (e.g. after a successful save).
watch(() => props.modelValue, (val) => {
  if (val !== input.value) input.value = val
})

watch(input, (newVal) => {
  filter()
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
    <Input v-model="input" :placeholder="placeholder" :class="fieldClass" @focus="filter" @blur="handleBlur" />
    <ul v-if="showSuggestions" :class="dropdownClass"
      class="absolute z-20 mt-1 w-full rounded-xl border border-white/60 bg-white/90 shadow-lg shadow-indigo-500/10 backdrop-blur-md
        dark:border-white/10 dark:bg-gray-900/90">
      <li v-for="item in suggestions" :key="item" @click="selectSuggestion(item)"
        class="cursor-pointer px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-indigo-50
          dark:text-gray-100 dark:hover:bg-white/10">
        {{ item }}
      </li>
    </ul>
  </div>
</template>
