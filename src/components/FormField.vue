<script setup lang="ts">
/** FormField — label wrapper for journey form controls. */
defineProps<{
  label: string
  required?: boolean
}>()
</script>

<template>
  <label class="block space-y-1.5">
    <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
      {{ label }}
      <span v-if="required" class="text-indigo-500" aria-hidden="true">*</span>
    </span>
    <slot />
  </label>
</template>
