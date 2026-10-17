<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Info } from 'lucide-vue-next'
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
const props = withDefaults(
  defineProps<{
    journeyType: JourneyType
    /** First part of the H1, e.g. "Log a" */
    title: string
    /** Gradient-highlighted trailing word, e.g. "Flight" */
    highlight: string
    subtitle: string
    submitLabel: string
    saving: boolean
    /** Show the guest-mode notice banner (browsing without an account session). */
    guest?: boolean
  }>(),
  { guest: false }
)

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const currentTab = ref('basic')
const showImport = ref(false)
</script>

<template>
  <section class="relative min-h-full overflow-hidden px-4 pb-24 lg:pb-10 pt-10 transition-colors
    bg-gradient-to-b from-lilac/40 via-white to-white
    text-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 dark:text-gray-100">

    <!-- Ambient gradient blobs: toned down vs. the welcome page (tool page) -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div
        class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-mint/15 blur-3xl dark:bg-mint/10" />
      <div
        class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-sunset/10 blur-3xl [animation-delay:5s] dark:bg-sunset/10" />
      <div
        class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-brand/8 blur-3xl [animation-delay:9s] dark:bg-brand/5" />
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
            class="bg-gradient-to-r from-brand via-violet-400 to-sky-500 bg-clip-text text-transparent">{{ highlight }}</span>
        </h1>
        <p class="mt-3 text-gray-600 dark:text-gray-300">{{ subtitle }}</p>
      </header>

      <!-- Guest-mode notice: the form stays usable, sign-in is only asked at save time -->
      <div v-if="props.guest"
        class="animate-in fade-in mb-6 flex items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5
        text-center text-sm font-medium text-brand dark:border-violet-300/20 dark:bg-violet-300/5 dark:text-violet-200">
        <Info class="size-4 shrink-0" aria-hidden="true" />
        <span>You're in guest mode — fill it in freely, we'll ask you to log in when you save.</span>
      </div>

      <Tabs v-model="currentTab">
        <!-- Mode switch lives inside the card, right above what it controls -->
        <div class="animate-in fade-in slide-in-from-bottom-8 rounded-2xl border border-white/60 bg-white/60 p-6
          shadow-xl shadow-brand/10 backdrop-blur-md sm:p-8
          dark:border-white/10 dark:bg-white/5 dark:shadow-brand/5">
          <TabsList
            class="mb-8 flex w-full max-w-xs rounded-xl bg-gray-100 p-1 shadow-inner dark:bg-white/10">
            <TabsTrigger value="basic"
              class="flex-1 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500
                data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow
                dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
              Basic
            </TabsTrigger>
            <TabsTrigger value="detailed"
              class="flex-1 rounded-lg border-0 px-4 py-1.5 text-sm font-medium text-gray-500
                data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow
                dark:text-gray-400 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
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
            class="mt-6 w-full border-0 bg-sunset font-semibold
              text-white shadow-lg shadow-sunset/30 transition-all duration-300
              hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40 disabled:pointer-events-none disabled:opacity-60"
            :disabled="saving" @click="emit('submit')">
            {{ saving ? 'Saving…' : submitLabel }}
          </Button>
          <p class="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
            <span class="text-sunset" aria-hidden="true">*</span> Required fields
          </p>
        </div>
      </Tabs>
    </div>

    <CsvImportPanel v-if="showImport" :type="journeyType" @close="showImport = false" />
  </section>
</template>
