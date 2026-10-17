<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Download, Upload, X } from 'lucide-vue-next'
import { client } from '@/lib/neon'
import { Button } from '@/components/ui/button'
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
const isDragging = ref(false)
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

const close = () => {
  if (!isImporting.value) emit('close')
}

const processFile = async (file: File) => {
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

const handleFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await processFile(file)
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) await processFile(file)
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const importRows = async () => {
  if (validRows.value.length === 0) {
    toast.error('There are no valid rows to import.')
    return
  }

  isImporting.value = true
  try {
    const { data: { user } } = await client.auth.getUser()
    if (!user) {
      toast.error('You must be logged in.')
      return
    }

    const table = props.type === 'flight' ? 'flights' : 'trains'
    const payload = validRows.value.map((row) => ({
      user_id: user.id,
      ...toDatabaseRow(props.type, row.values),
    }))
    const { error } = await client.from(table).insert(payload)
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
  <div class="fixed inset-0 z-[60] flex animate-in fade-in-0 items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
    role="dialog" aria-modal="true" :aria-label="`Import ${label} journeys`" @click.self="close">
    <div class="max-h-full w-full max-w-6xl animate-in fade-in-0 zoom-in-95 overflow-auto rounded-2xl border border-white/60
      bg-white/90 p-5 shadow-2xl shadow-indigo-500/20 backdrop-blur-xl sm:p-6
      dark:border-white/10 dark:bg-gray-900/90">

      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold tracking-tight">
            Import
            <span class="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">{{ label }} journeys</span>
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">Use the exact columns from the CSV template.</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" :disabled="isImporting" @click="close">
          <X class="size-4" aria-hidden="true" />
        </Button>
      </div>

      <!-- Drop zone / file picker -->
      <label
        class="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors"
        :class="isDragging
          ? 'border-indigo-400 bg-indigo-50/60 dark:border-indigo-400/60 dark:bg-indigo-500/10'
          : 'border-indigo-200/70 bg-white/50 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-white/15 dark:bg-white/5 dark:hover:border-indigo-400/40'"
        @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop">
        <input ref="fileInput" type="file" accept=".csv,text/csv" class="sr-only" :disabled="isReading"
          @change="handleFile" />
        <Upload class="size-6 text-indigo-500 dark:text-indigo-300" aria-hidden="true" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ isReading ? 'Reading…' : 'Drop your CSV here, or click to browse' }}
        </span>
        <span v-if="fileName" class="text-xs text-indigo-500 dark:text-indigo-300">{{ fileName }}</span>
      </label>

      <div class="mt-3 flex justify-center">
        <Button variant="ghost" size="sm" class="text-indigo-500 hover:text-indigo-600 dark:text-indigo-300"
          @click="downloadTemplate">
          <Download class="mr-2 size-4" aria-hidden="true" />
          Download template
        </Button>
      </div>

      <CsvImportPreview v-if="rows.length" :rows="rows" :headers="headers" class="mt-5" />

      <div v-if="rows.length" class="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-indigo-100 pt-4 dark:border-white/10">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
            {{ validRows.length }} valid — will be imported
          </span>
          <span v-if="invalidRows.length"
            class="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            {{ invalidRows.length }} invalid — will be skipped
          </span>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" :disabled="isImporting" @click="reset">Clear</Button>
          <Button
            class="border-0 bg-gradient-to-r from-indigo-500 to-violet-500 font-semibold text-white
              shadow-lg shadow-indigo-500/25 transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 disabled:pointer-events-none disabled:opacity-60"
            :disabled="isImporting || validRows.length === 0" @click="importRows">
            {{ isImporting ? 'Importing…' : 'Import valid rows' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
