<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import type { ImportRow } from '@/lib/csvImport'

const props = defineProps<{
  rows: ImportRow[]
  headers: readonly string[]
}>()

const validCount = computed(() => props.rows.filter((row) => row.valid).length)
const invalidCount = computed(() => props.rows.length - validCount.value)
</script>

<template>
  <Card>
    <CardContent class="p-4">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold">Preview</h2>
        <div class="text-sm text-muted-foreground">
          <span class="text-green-600">{{ validCount }} valid</span>
          <span class="mx-2">·</span>
          <span :class="invalidCount ? 'text-red-600' : ''">{{ invalidCount }} with errors</span>
        </div>
      </div>
      <div class="max-h-[28rem] overflow-auto rounded-md border">
        <table class="w-full min-w-[900px] text-left text-sm">
          <thead class="sticky top-0 bg-muted">
            <tr>
              <th class="p-2">Row</th>
              <th v-for="header in headers" :key="header" class="whitespace-nowrap p-2">{{ header }}</th>
              <th class="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.rowNumber" class="border-t align-top">
              <td class="p-2">{{ row.rowNumber }}</td>
              <td v-for="header in headers" :key="header" class="max-w-48 truncate p-2">
                {{ row.values[header] || '—' }}
              </td>
              <td class="min-w-56 p-2">
                <span v-if="row.valid" class="text-green-600">Ready</span>
                <ul v-else class="list-disc pl-4 text-red-600">
                  <li v-for="error in row.errors" :key="error">{{ error }}</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
</template>
