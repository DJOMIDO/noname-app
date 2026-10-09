<script setup lang="ts">
import { neonConfigError } from '@/lib/neon'

const reasons = {
  missing: 'The VITE_NEON_URL environment variable is missing or still uses an example value.',
  'connection-string':
    'VITE_NEON_URL is a Postgres connection string. It contains your database password and must not be used in the browser.',
  invalid: 'VITE_NEON_URL is not a valid Neon Data API URL.',
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
    <section class="w-full max-w-lg rounded-xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Neon configuration required</h1>
      <p class="mt-3 text-slate-600 dark:text-slate-300">
        The app cannot start. {{ reasons[neonConfigError ?? 'invalid'] }}
      </p>
      <ol class="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
        <li>Copy <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.example</code> to <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>.</li>
        <li>Set <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">VITE_NEON_URL</code> to the API URL shown in Neon Console → Postgres database → Data API (it ends with <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">/rest/v1</code>).</li>
        <li>Restart <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run dev</code> after changing <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>.</li>
      </ol>
    </section>
  </main>
</template>
