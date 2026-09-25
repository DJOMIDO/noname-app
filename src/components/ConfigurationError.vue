<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
    <section class="w-full max-w-lg rounded-xl border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Supabase configuration required</h1>
      <p class="mt-3 text-slate-600 dark:text-slate-300">
        The app cannot start because the Supabase environment variables are missing or still use example values.
      </p>
      <ol class="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-300">
        <li>Copy <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.example</code> to <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>.</li>
        <li>Set <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">VITE_SUPABASE_URL</code> to your Supabase project URL.</li>
        <li>Set <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">VITE_SUPABASE_ANON_KEY</code> to your publishable/anon key.</li>
        <li>Restart <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run dev</code> after changing <code class="rounded bg-slate-100 px-1 dark:bg-slate-800">.env</code>.</li>
      </ol>
    </section>
  </main>
</template>
