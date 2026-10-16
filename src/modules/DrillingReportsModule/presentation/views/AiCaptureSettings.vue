<script setup lang="ts">
/**
 * Configuración de la captura con IA de la empresa: vale para todos los proyectos que no la personalicen.
 */
import AiCaptureSettingsOrganism from '../components/organisms/drillingReports/AiCaptureSettingsOrganism.vue'
</script>

<template>
  <div>
    <div class="mb-6">
      <h4 class="text-h4 mb-1">
        Captura con IA
      </h4>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Cómo se interpretan las hojas de perforación al capturarlas desde foto: qué significa cada turno y a qué tipo
        corresponde cada actividad escrita a mano. Cada proyecto puede personalizarla desde su pestaña de reportes.
      </p>
    </div>
    <VCard class="pa-6">
      <AiCaptureSettingsOrganism />
    </VCard>
  </div>
</template>
