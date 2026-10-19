<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Download, Loader2, Upload, X } from 'lucide-vue-next'
import { client } from '@/lib/neon'
import { useAuthUser } from '@/composables/useAuthUser'
import { invalidateJourneysCache } from '@/composables/useJourneys'
import { Button } from '@/components/ui/button'
import CsvImportPreview from '@/components/CsvImportPreview.vue'
import {
  csvTemplate, flightHeaders, importIdentityColumns, importMergeColumns,
  journeyIdentity, mergeImportRow, parseImportCsv, toDatabaseRow, trainHeaders,
  type ExistingJourneyRow, type ImportRow, type JourneyType,
} from '@/lib/csvImport'

const props = defineProps<{
  type: JourneyType
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const router = useRouter()
const { user, fetchUser } = useAuthUser()

const rows = ref<ImportRow[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const isReading = ref(false)
const isImporting = ref(false)
const isDragging = ref(false)
const headers = computed(() => props.type === 'flight' ? flightHeaders : trainHeaders)
const label = computed(() => props.type === 'flight' ? 'flight' : 'train')
const table = computed(() => props.type === 'flight' ? 'flights' : 'trains')

type RowStatus = 'new' | 'update' | 'invalid' | 'duplicate'
type RowAnalysis = { status: RowStatus; existingId: string | null }

// Per-row duplicate verdict keyed by rowNumber. Stays empty until the check
// runs, so guests (who are sent to log in on import) fall back to "new".
const rowAnalysis = ref<Record<number, RowAnalysis>>({})
const analysisState = ref<'idle' | 'checking' | 'ready' | 'error' | 'skipped'>('idle')

// The status shown for a row: the analysed verdict, or a fallback when no
// duplicate check has run (guest / not yet checked).
const effectiveStatus = (row: ImportRow): RowStatus =>
  rowAnalysis.value[row.rowNumber]?.status ?? (row.valid ? 'new' : 'invalid')

const statusByRow = computed<Record<number, RowStatus>>(() => {
  const map: Record<number, RowStatus> = {}
  for (const row of rows.value) map[row.rowNumber] = effectiveStatus(row)
  return map
})

const counts = computed(() => {
  const tally = { added: 0, updated: 0, invalid: 0, duplicate: 0 }
  for (const status of Object.values(statusByRow.value)) {
    if (status === 'new') tally.added += 1
    else if (status === 'update') tally.updated += 1
    else if (status === 'invalid') tally.invalid += 1
    else tally.duplicate += 1
  }
  return tally
})

const actionableCount = computed(() => counts.value.added + counts.value.updated)

const importLabel = computed(() => {
  if (isImporting.value) return 'Importing…'
  if (counts.value.updated > 0) return `Import (add ${counts.value.added}, update ${counts.value.updated})`
  return `Import ${counts.value.added} new`
})

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
  rowAnalysis.value = {}
  analysisState.value = 'idle'
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
  let parsed: ImportRow[]
  try {
    fileName.value = file.name
    parsed = parseImportCsv(await file.text(), props.type)
    if (parsed.length === 0) throw new Error('CSV does not contain any data rows.')
  } catch (error) {
    reset()
    toast.error(error instanceof Error ? error.message : 'Unable to read the CSV file.')
    return
  } finally {
    isReading.value = false
  }
  rows.value = parsed
  rowAnalysis.value = {}
  await analyzeDuplicates(parsed)
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

// Classifies each valid row as new vs. an update of an existing record by
// matching the natural key against what the user already has stored.
const analyzeDuplicates = async (parsed: ImportRow[]) => {
  await fetchUser()
  if (!user.value) {
    // Guests have no records to query; they're sent to log in on import, so
    // skip the check and let their rows show as new.
    analysisState.value = 'skipped'
    return
  }

  analysisState.value = 'checking'
  try {
    const { data, error } = await client
      .from(table.value)
      .select(importIdentityColumns(props.type))
      .eq('user_id', user.value.id)
      .returns<ExistingJourneyRow[]>()
    if (error) throw new Error(error.message)

    const idByKey = new Map<string, string>()
    for (const record of data ?? []) {
      const key = journeyIdentity(props.type, record)
      if (!idByKey.has(key)) idByKey.set(key, record.id)
    }

    const next: Record<number, RowAnalysis> = {}
    const winnerByKey = new Map<string, number>()
    for (const row of parsed) {
      if (!row.valid) {
        next[row.rowNumber] = { status: 'invalid', existingId: null }
        continue
      }
      const key = journeyIdentity(props.type, row.values)
      const existingId = idByKey.get(key) ?? null
      // A later row with the same natural key supersedes an earlier one.
      const prior = winnerByKey.get(key)
      if (prior !== undefined) next[prior] = { status: 'duplicate', existingId: null }
      winnerByKey.set(key, row.rowNumber)
      next[row.rowNumber] = { status: existingId ? 'update' : 'new', existingId }
    }

    rowAnalysis.value = next
    analysisState.value = 'ready'
  } catch (error) {
    analysisState.value = 'error'
    toast.error(`Couldn't check for existing records: ${error instanceof Error ? error.message : 'unknown error'}`)
  }
}

const importRows = async () => {
  if (actionableCount.value === 0) {
    toast.error('There are no valid rows to import.')
    return
  }
  if (analysisState.value === 'checking') return
  if (analysisState.value === 'error') {
    toast.error('Re-run the duplicate check before importing.')
    return
  }

  // Importing writes to the account — guide guests to log in instead of erroring.
  await fetchUser()
  if (!user.value) {
    toast.info('Please log in to import your journeys.')
    router.push({ path: '/login', query: { next: props.type === 'flight' ? '/add-flight' : '/add-train' } })
    return
  }

  const userId = user.value.id
  isImporting.value = true
  try {
    // Read the full stored row for every record we're about to merge into.
    const matchedIds = [...new Set(
      Object.values(rowAnalysis.value)
        .filter((analysis) => analysis.status === 'update' && analysis.existingId !== null)
        .map((analysis) => analysis.existingId as string),
    )]
    const existingById = new Map<string, ExistingJourneyRow>()
    if (matchedIds.length > 0) {
      const { data, error } = await client
        .from(table.value)
        .select(importMergeColumns(props.type))
        .in('id', matchedIds)
        .returns<ExistingJourneyRow[]>()
      if (error) {
        toast.error(`Import failed: ${error.message}`)
        return
      }
      for (const record of data ?? []) existingById.set(record.id, record)
    }

    // Every payload carries the same key set (id + user_id + all journey
    // columns) so the bulk upsert stays homogeneous: matched rows keep their
    // id and update, new rows get a fresh id and insert.
    const payload: Record<string, unknown>[] = []
    for (const row of rows.value) {
      const analysis = rowAnalysis.value[row.rowNumber]
      const status = analysis?.status ?? effectiveStatus(row)
      if (status === 'invalid' || status === 'duplicate') continue

      const existing = status === 'update' && analysis?.existingId
        ? existingById.get(analysis.existingId)
        : undefined
      payload.push(existing && analysis?.existingId
        ? { id: analysis.existingId, user_id: userId, ...mergeImportRow(props.type, existing, row.values) }
        : { id: crypto.randomUUID(), user_id: userId, ...toDatabaseRow(props.type, row.values) })
    }

    // defaultToNull:false keeps created_at/updated_at (absent from the payload)
    // intact on update and lets them fall back to their column default on insert.
    const { error } = await client
      .from(table.value)
      .upsert(payload, { onConflict: 'id', defaultToNull: false })
    if (error) {
      toast.error(`Import failed: ${error.message}`)
      return
    }

    const { added, updated } = counts.value
    toast.success(updated > 0
      ? `${added} added, ${updated} updated.`
      : `${added} ${label.value} journeys imported successfully.`)
    invalidateJourneysCache()
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
      bg-white/90 p-5 shadow-2xl shadow-brand/20 backdrop-blur-xl sm:p-6
      dark:border-white/10 dark:bg-gray-900/90">

      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold tracking-tight">
            Import {{ label }} journeys
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
          ? 'border-brand bg-lilac/60 dark:border-brand/60 dark:bg-brand/10'
          : 'border-lilac bg-white/50 hover:border-brand/60 hover:bg-lilac/40 dark:border-white/15 dark:bg-white/5 dark:hover:border-brand/50'"
        @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop">
        <input ref="fileInput" type="file" accept=".csv,text/csv" class="sr-only" :disabled="isReading"
          @change="handleFile" />
        <Upload class="size-6 text-brand dark:text-violet-300" aria-hidden="true" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ isReading ? 'Reading…' : 'Drop your CSV here, or click to browse' }}
        </span>
        <span v-if="fileName" class="text-xs text-brand dark:text-violet-300">{{ fileName }}</span>
      </label>

      <div class="mt-3 flex justify-center">
        <Button variant="ghost" size="sm" class="text-brand hover:text-violet-600 dark:text-violet-300"
          @click="downloadTemplate">
          <Download class="mr-2 size-4" aria-hidden="true" />
          Download template
        </Button>
      </div>

      <CsvImportPreview v-if="rows.length" :rows="rows" :headers="headers" :statuses="statusByRow" class="mt-5" />

      <div v-if="rows.length" class="mt-5 border-t border-gray-200 pt-4 dark:border-white/10">
        <p v-if="analysisState === 'checking'" class="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 class="size-4 animate-spin" aria-hidden="true" />
          Checking for existing {{ label }} journeys…
        </p>

        <div v-else-if="analysisState === 'error'"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
          <span>Couldn't check for duplicates, so importing is paused to avoid creating copies.</span>
          <Button variant="outline" size="sm" :disabled="isImporting" @click="analyzeDuplicates(rows)">Retry check</Button>
        </div>

        <div v-else class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              {{ counts.added }} new — will be added
            </span>
            <span v-if="counts.updated"
              class="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              {{ counts.updated }} existing — will be updated
            </span>
            <span v-if="counts.duplicate"
              class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500 dark:bg-white/5 dark:text-gray-400">
              {{ counts.duplicate }} duplicate in file — merged
            </span>
            <span v-if="counts.invalid"
              class="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
              {{ counts.invalid }} invalid — will be skipped
            </span>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" :disabled="isImporting" @click="reset">Clear</Button>
            <Button
              class="border-0 bg-sunset font-semibold text-white
                shadow-lg shadow-sunset/30 transition-all duration-300
                hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40 disabled:pointer-events-none disabled:opacity-60"
              :disabled="isImporting || actionableCount === 0" @click="importRows">
              {{ importLabel }}
            </Button>
          </div>
        </div>

        <p v-if="counts.updated && analysisState !== 'error'" class="mt-3 text-xs text-muted-foreground">
          Updated records keep any details you leave blank in this file — only filled columns overwrite what's stored.
        </p>
      </div>
    </div>
  </div>
</template>
