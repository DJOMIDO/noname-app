<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton.vue'
import CsvImportPanel from '@/components/CsvImportPanel.vue'
import type { JourneyType } from '@/lib/csvImport'

/**
 * JourneyFormShell — shared page layout for Add Flight / Add Train.
 * Follows the welcome/auth page style (A+C): gradient background, blobs,
 * glass card, gradient CTA. Domain-specific fields are provided via slots.
 */
defineProps<{
  journeyType: JourneyType
  /** First part of the H1, e.g. "Log a" */
  title: string
  /** Gradient-highlighted trailing word, e.g. "Flight" */
  highlight: string
  subtitle: string
  submitLabel: string
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const currentTab = ref('basic')
const showImport = ref(false)
</script>

<template>
  <section class="relative min-h-screen overflow-hidden px-4 pb-10 pt-10 transition-colors
    bg-gradient-to-b from-indigo-50 via-white to-white
    text-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 dark:text-gray-100">

    <!-- Ambient animated gradient blobs -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div
        class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20" />
      <div
        class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-violet-400/25 blur-3xl [animation-delay:5s] dark:bg-violet-500/20" />
      <div
        class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-sky-400/25 blur-3xl [animation-delay:9s] dark:bg-sky-500/15" />
    </div>

    <div class="relative z-10 mx-auto max-w-2xl">
      <!-- Escape hatch (left) vs. secondary input path (right) -->
      <div class="mb-2 flex items-center justify-between">
        <BackButton />
        <Button variant="outline" size="sm" @click="showImport = true">
          <Upload class="mr-2 size-4" aria-hidden="true" />
          Import CSV
        </Button>
      </div>

      <header class="animate-in fade-in slide-in-from-bottom-4 mb-8 text-center">
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {{ title }}
          <span
            class="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">{{ highlight }}</span>
        </h1>
        <p class="mt-3 text-gray-600 dark:text-gray-300">{{ subtitle }}</p>
      </header>

      <Tabs v-model="currentTab">
        <!-- Mode switch lives inside the card, right above what it controls -->
        <div class="animate-in fade-in slide-in-from-bottom-8 rounded-2xl border border-white/60 bg-white/60 p-6
          shadow-xl shadow-indigo-500/10 backdrop-blur-md sm:p-8
          dark:border-white/10 dark:bg-white/5 dark:shadow-indigo-500/5">
          <TabsList
            class="mb-8 flex w-full max-w-xs border border-white/60 bg-white/60 p-1 shadow-sm backdrop-blur-md
              dark:border-white/10 dark:bg-white/10">
            <TabsTrigger value="basic"
              class="flex-1 rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              Basic
            </TabsTrigger>
            <TabsTrigger value="detailed"
              class="flex-1 rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-md">
              Detailed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" class="mt-0">
            <slot name="basic" />
          </TabsContent>
          <TabsContent value="detailed" class="mt-0">
            <slot name="detailed" />
          </TabsContent>

          <Button
            class="mt-6 w-full border-0 bg-gradient-to-r from-indigo-500 to-violet-500 font-semibold
              text-white shadow-lg shadow-indigo-500/25 transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 disabled:pointer-events-none disabled:opacity-60"
            :disabled="saving" @click="emit('submit')">
            {{ saving ? 'Saving…' : submitLabel }}
          </Button>
          <p class="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
            <span class="text-indigo-500" aria-hidden="true">*</span> Required fields
          </p>
        </div>
      </Tabs>
    </div>

    <CsvImportPanel v-if="showImport" :type="journeyType" @close="showImport = false" />
  </section>
</template>
