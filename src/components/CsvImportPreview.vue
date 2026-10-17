<script setup lang="ts">
import { computed } from 'vue'
import type { ImportRow } from '@/lib/csvImport'

const props = defineProps<{
  rows: ImportRow[]
  headers: readonly string[]
}>()

const validCount = computed(() => props.rows.filter((row) => row.valid).length)
const invalidCount = computed(() => props.rows.length - validCount.value)
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Preview</h3>
      <div class="flex items-center gap-2 text-xs font-medium">
        <span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          {{ validCount }} valid
        </span>
        <span class="rounded-full px-2.5 py-0.5" :class="invalidCount
          ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
          : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-gray-400'">
          {{ invalidCount }} with errors
        </span>
      </div>
    </div>

    <div class="max-h-[28rem] overflow-auto rounded-xl border border-gray-200 dark:border-white/10">
      <table class="w-full min-w-[900px] text-left text-sm">
        <thead class="sticky top-0 bg-gray-100/80 backdrop-blur dark:bg-gray-800/80">
          <tr>
            <th class="p-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Row</th>
            <th v-for="header in headers" :key="header"
              class="whitespace-nowrap p-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {{ header }}
            </th>
            <th class="p-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.rowNumber"
            class="border-t border-gray-100 align-top transition-colors hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5">
            <td class="p-2.5 text-gray-500 dark:text-gray-400">{{ row.rowNumber }}</td>
            <td v-for="header in headers" :key="header" class="max-w-48 truncate p-2.5">
              {{ row.values[header] || '—' }}
            </td>
            <td class="min-w-56 p-2.5">
              <span v-if="row.valid"
                class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                Ready
              </span>
              <ul v-else class="list-disc space-y-0.5 pl-4 text-xs text-rose-600 dark:text-rose-300">
                <li v-for="error in row.errors" :key="error">{{ error }}</li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
