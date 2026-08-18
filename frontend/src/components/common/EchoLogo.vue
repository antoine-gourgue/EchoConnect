<template>
  <!-- Double bulle : deux voix qui se répondent (flat) -->
  <svg viewBox="0 0 48 44" fill="none" class="h-full w-auto">
    <rect x="14" y="2" width="32" height="20" rx="9" :fill="back" :opacity="backOpacity" />
    <path d="M38 20v8l-8-6z" :fill="back" :opacity="backOpacity" />
    <rect x="2" y="16" width="30" height="20" rx="9" :fill="front" />
    <path d="M10 34v8l9-8z" :fill="front" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// dark : teintes éclaircies pour les fonds sombres (sidebar, panneau login)
const props = defineProps({
  dark: {
    type: Boolean,
    default: false,
  },
})

const back = computed(() => (props.dark ? '#A78BFA' : '#8B5CF6'))
const backOpacity = computed(() => (props.dark ? 0.6 : 0.55))
const front = computed(() => (props.dark ? '#8C8EF7' : '#6366F1'))
</script>
