<script setup lang="ts">
import { useRouter } from 'vue-router'
import { X, Trash2, Pencil, Save } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

/**
 * JourneyDetailShell — shared layout for Flight / Train detail pages.
 *
 * View mode renders a read-only "boarding pass" card (via the default slot);
 * edit mode renders a form (via the same slot, swapped by the parent). The card
 * fills the viewport height exactly, so the page never scrolls — only the card
 * body scrolls when its content overflows (e.g. the edit form).
 */
defineProps<{
  isEditing: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'cancel'): void
  (e: 'save'): void
  (e: 'delete'): void
}>()

const router = useRouter()

const primaryBtn =
  'gap-2 border-0 bg-sunset font-semibold text-white shadow-lg shadow-sunset/30 ' +
  'transition-all duration-300 hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-xl hover:shadow-sunset/40'
const outlineBtn =
  'gap-2 border-lilac bg-white/60 text-gray-700 backdrop-blur-md ' +
  'transition-colors hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 ' +
  'dark:hover:bg-red-500/15 dark:hover:text-red-300'
</script>

<template>
  <section class="relative flex h-full flex-col overflow-hidden px-4 pt-[calc(1.5rem_+_env(safe-area-inset-top,0px))] pb-[calc(6rem_+_env(safe-area-inset-bottom,0px))] transition-colors lg:pb-6
    bg-gradient-to-b from-lilac/40 via-white to-white text-gray-800
    dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 dark:text-gray-100">

    <!-- Ambient gradient blobs: muted recipe, same as the list / form pages -->
    <div aria-hidden="true" class="pointer-events-none absolute inset-0">
      <div class="absolute -left-24 -top-24 h-96 w-96 animate-blob rounded-full bg-mint/15 blur-3xl dark:bg-mint/10" />
      <div class="absolute -right-32 top-1/3 h-[28rem] w-[28rem] animate-blob rounded-full bg-sunset/10 blur-3xl [animation-delay:5s] dark:bg-sunset/10" />
      <div class="absolute -bottom-40 left-1/3 h-96 w-96 animate-blob rounded-full bg-brand/8 blur-3xl [animation-delay:9s] dark:bg-brand/5" />
    </div>

    <div class="relative z-10 mx-auto flex h-full w-full max-w-2xl flex-col">
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/60
        shadow-xl shadow-brand/10 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-brand/5">

        <!-- Header: type label (left) + close (right) -->
        <div class="flex shrink-0 items-center justify-between px-5 pt-5 sm:px-7">
          <slot name="label" />
          <button @click="router.back()" aria-label="Close"
            class="rounded-full p-2 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700
              dark:hover:bg-white/10 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <X class="size-5" aria-hidden="true" />
          </button>
        </div>

        <!-- Scrollable body: only this area scrolls, never the whole page -->
        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div v-if="loading" class="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
            Loading…
          </div>
          <slot v-else />
        </div>

        <!-- Footer: mode-aware actions, pinned to the card bottom -->
        <div class="flex shrink-0 items-center justify-end gap-3 border-t border-dashed border-gray-200/70 px-5 py-4
          dark:border-white/10 sm:px-7">
          <template v-if="isEditing">
            <Button variant="ghost" @click="emit('cancel')">Cancel</Button>
            <Button :class="primaryBtn" @click="emit('save')">
              <Save class="size-4" aria-hidden="true" /> Save
            </Button>
          </template>
          <template v-else>
            <Button :class="outlineBtn" @click="emit('delete')">
              <Trash2 class="size-4" aria-hidden="true" /> Delete
            </Button>
            <Button :class="primaryBtn" @click="emit('edit')">
              <Pencil class="size-4" aria-hidden="true" /> Edit
            </Button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
