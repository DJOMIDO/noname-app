<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Download, X } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CsvImportPreview from '@/components/CsvImportPreview.vue'
import {
  csvTemplate, flightHeaders, parseImportCsv, toDatabaseRow, trainHeaders,
  type ImportRow, type JourneyType,
} from '@/lib/csvImport'

const props = defineProps<{
  type: JourneyType
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const rows = ref<ImportRow[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const isReading = ref(false)
const isImporting = ref(false)
const headers = computed(() => props.type === 'flight' ? flightHeaders : trainHeaders)
const validRows = computed(() => rows.value.filter((row) => row.valid))
const invalidRows = computed(() => rows.value.filter((row) => !row.valid))
const label = computed(() => props.type === 'flight' ? 'flight' : 'train')

const downloadTemplate = () => {
  const blob = new Blob([csvTemplate(props.type)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.type}-journeys-template.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const reset = () => {
  rows.value = []
  fileName.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const handleFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.csv')) {
    toast.error('Please select a CSV file.')
    reset()
    return
  }

  isReading.value = true
  try {
    fileName.value = file.name
    rows.value = parseImportCsv(await file.text(), props.type)
    if (rows.value.length === 0) throw new Error('CSV does not contain any data rows.')
  } catch (error) {
    reset()
    toast.error(error instanceof Error ? error.message : 'Unable to read the CSV file.')
  } finally {
    isReading.value = false
  }
}

const importRows = async () => {
  if (validRows.value.length === 0) {
    toast.error('There are no valid rows to import.')
    return
  }

  isImporting.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('You must be logged in.')
      return
    }

    const table = props.type === 'flight' ? 'flights' : 'trains'
    const payload = validRows.value.map((row) => ({
      user_id: user.id,
      ...toDatabaseRow(props.type, row.values),
    }))
    const { error } = await supabase.from(table).insert(payload)
    if (error) {
      toast.error(`Import failed: ${error.message}`)
      return
    }

    toast.success(`${validRows.value.length} ${label.value} journeys imported successfully.`)
    reset()
    emit('close')
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-6" role="dialog"
    aria-modal="true" :aria-label="`Import ${label} journeys`">
    <Card class="max-h-full w-full max-w-6xl overflow-auto bg-white dark:bg-gray-900">
      <CardContent class="space-y-5 p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">Import {{ label }} journeys</h2>
            <p class="mt-1 text-sm text-muted-foreground">Use the exact columns from the CSV template.</p>
          </div>
          <Button variant="outline" @click="emit('close')">
            <X class="mr-2 size-4" aria-hidden="true" />
            Close
          </Button>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <input ref="fileInput" type="file" accept=".csv,text/csv"
            class="block max-w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
            :disabled="isReading" @change="handleFile" />
          <Button class="ml-auto" variant="outline" @click="downloadTemplate">
            <Download class="mr-2 size-4" aria-hidden="true" />
            Download template
          </Button>
        </div>
        <p v-if="fileName" class="text-sm text-muted-foreground">{{ fileName }}</p>

        <CsvImportPreview v-if="rows.length" :rows="rows" :headers="headers" />

        <div v-if="rows.length" class="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
          <p class="text-sm">
            {{ validRows.length }} valid rows will be imported.
            <span v-if="invalidRows.length" class="text-red-600">
              {{ invalidRows.length }} invalid rows will be skipped.
            </span>
          </p>
          <div class="flex gap-2">
            <Button variant="outline" :disabled="isImporting" @click="reset">Clear</Button>
            <Button :disabled="isImporting || validRows.length === 0" @click="importRows">
              {{ isImporting ? 'Importing...' : 'Import valid rows' }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
