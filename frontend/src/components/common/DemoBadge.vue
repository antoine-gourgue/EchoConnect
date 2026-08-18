<template>
  <div
    v-if="DEMO"
    class="pointer-events-none fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-echo-200 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-echo-700 shadow-soft backdrop-blur"
  >
    <span class="relative flex h-2 w-2">
      <span
        class="absolute inline-flex h-full w-full animate-ping rounded-full bg-echo-400 opacity-75"
      ></span>
      <span class="relative inline-flex h-2 w-2 rounded-full bg-echo-500"></span>
    </span>
    Mode démo — données simulées
  </div>
</template>

<script setup lang="ts">
import { DEMO } from '@/demo/demo'
</script>
