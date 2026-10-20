<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

/**
 * FormDisclosure — the collapsible "more details" section of the journey forms.
 * Controlled via `v-model:open` so a parent (e.g. the edit page) can start it
 * expanded when the tucked-away fields already hold data. The body animates with
 * the grid-rows 0fr→1fr trick (no measuring), and is `inert` while collapsed so
 * its inputs leave the tab order and the a11y tree instead of trapping focus.
 */
const props = withDefaults(defineProps<{
  label: string
  open?: boolean
  hint?: string
}>(), { open: false, hint: '' })

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const toggle = () => emit('update:open', !props.open)
</script>

<template>
  <div class="border-t border-gray-200 pt-5 dark:border-white/10">
    <button type="button" :aria-expanded="open" @click="toggle"
      class="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left
        text-sm font-semibold text-gray-600 transition-colors cursor-pointer
        hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand
        dark:text-gray-300 dark:hover:text-violet-200">
      <span class="flex items-baseline gap-2">
        {{ label }}
        <span v-if="hint" class="text-xs font-normal text-gray-400 dark:text-gray-500">{{ hint }}</span>
      </span>
      <ChevronDown class="size-4 shrink-0 text-gray-400 transition-transform duration-300 dark:text-gray-500"
        :class="open && 'rotate-180'" aria-hidden="true" />
    </button>

    <div class="grid transition-[grid-template-rows] duration-300 ease-out"
      :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
      <div class="overflow-hidden" :inert="open ? undefined : true">
        <div class="pt-5">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
