<template>
  <!-- Bulle de chat + ondes d'écho -->
  <svg viewBox="0 0 48 48" fill="none" class="h-full w-auto">
    <defs>
      <linearGradient id="ec-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6366F1" />
        <stop offset="1" stop-color="#8B5CF6" />
      </linearGradient>
    </defs>
    <path
      d="M8 22c0-7.7 6.3-14 14-14s14 6.3 14 14-6.3 14-14 14h-2.5L12 41v-6.3C9.5 32.2 8 27.3 8 22Z"
      fill="url(#ec-grad)"
    />
    <path
      d="M17 22h.02M22 22h.02M27 22h.02"
      stroke="#fff"
      stroke-width="3.4"
      stroke-linecap="round"
    />
    <path
      d="M40 14a13 13 0 0 1 0 16M44 10a19 19 0 0 1 0 24"
      stroke="url(#ec-grad)"
      stroke-width="2.6"
      stroke-linecap="round"
      opacity="0.55"
    />
  </svg>
</template>
