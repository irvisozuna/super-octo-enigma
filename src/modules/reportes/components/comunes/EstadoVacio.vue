<script setup lang="ts">
defineProps<{
  titulo: string
  detalle?: string
  icono?: string
}>()
</script>

<template>
  <div class="d-flex flex-column align-center text-center py-12 px-4">
    <VIcon
      :icon="icono ?? 'tabler-report-off'"
      size="48"
      class="mb-4 text-disabled"
    />
    <h5 class="text-h5 mb-2">
      {{ titulo }}
    </h5>
    <p
      v-if="detalle"
      class="text-body-1 text-medium-emphasis mb-0"
    >
      {{ detalle }}
    </p>
    <slot />
  </div>
</template>
