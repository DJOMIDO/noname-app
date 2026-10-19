<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { fieldClass } from '@/lib/formStyles'

/**
 * A suggestion: either a plain string (legacy — the value is the code in trailing
 * parentheses, e.g. "Charles de Gaulle (CDG)" -> "CDG") or an explicit
 * label/value pair (the value is filled verbatim, used where there is no code,
 * e.g. train stations fill their canonical name).
 */
type MatchItem = string | { label: string; value: string }

interface NormalizedItem {
  label: string
  value: string
}

/**
 * AutocompleteInput — shared text input with a suggestion dropdown. Callers
 * provide the match function (sync or async); picking a suggestion fills its
 * value. Free text is always allowed — suggestions are a convenience, not a
 * constraint.
 */
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  getMatches: (query: string) => MatchItem[] | Promise<MatchItem[]>
  dropdownClass?: string
}>(), {
  placeholder: undefined,
  dropdownClass: 'max-h-64 overflow-y-auto',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const input = ref(props.modelValue)
const suggestions = ref<NormalizedItem[]>([])
const showSuggestions = ref(false)

/** Monotonic token so a slower async match can't overwrite a newer query. */
let filterToken = 0

const normalize = (items: MatchItem[]): NormalizedItem[] =>
  items.map((item) => {
    if (typeof item === 'string') {
      return { label: item, value: item.match(/\(([^)]+)\)$/)?.[1] || item }
    }
    return item
  })

const filter = async () => {
  const token = ++filterToken
  const query = input.value.toLowerCase()
  if (!query) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  const matches = normalize(await props.getMatches(query))
  if (token !== filterToken) return // a newer keystroke already superseded this one
  suggestions.value = matches
  showSuggestions.value = matches.length > 0
}

// Keep in sync when the parent resets the field (e.g. after a successful save).
watch(() => props.modelValue, (val) => {
  if (val !== input.value) input.value = val
})

watch(input, (newVal) => {
  filter()
  emit('update:modelValue', newVal)
})

const selectSuggestion = (item: NormalizedItem) => {
  input.value = item.value
  emit('update:modelValue', item.value)
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
      class="absolute z-20 mt-1 w-full rounded-xl border border-white/60 bg-white/90 shadow-lg shadow-brand/10 backdrop-blur-md
        dark:border-white/10 dark:bg-gray-900/90">
      <li v-for="(item, index) in suggestions" :key="`${item.label}-${index}`" @click="selectSuggestion(item)"
        class="cursor-pointer px-4 py-2 text-sm text-gray-800 transition-colors hover:bg-lilac/60
          dark:text-gray-100 dark:hover:bg-white/10">
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>
