<template>
  <RouterView />
  <DemoBadge />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import DemoBadge from '@/components/common/DemoBadge.vue'
</script>
