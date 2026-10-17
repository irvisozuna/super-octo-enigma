<script setup lang="ts">
/**
 * Etiquetas QR de los pozos de un proyecto, para imprimir y pegar en la tabla donde va la hoja (o en la hoja).
 * Si la etiqueta sale en la foto, la captura elige el pozo sola: menos toques y ningún reporte en el pozo equivocado.
 */
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
import { wellQrPayload } from '../../shared/utils/wellQrUtils'

interface Label { id: string; number: string; qr: string }

const route = useRoute()
const projectId = String(route.params.id)
const projectName = ref('')
const labels = ref<Label[]>([])
const copies = ref(2)
const loading = ref(true)
const error = ref<string | null>(null)

const print = () => window.print()

onMounted(async () => {
  try {
    const [project, wells] = await Promise.all([
      DrillingReportApiService.getProject(projectId).catch(() => null),
      DrillingReportApiService.getWellsByProject(projectId),
    ])

    projectName.value = project?.data?.project_name ?? project?.project_name ?? ''
    const list = wells?.data ?? wells ?? []

    labels.value = await Promise.all(list.map(async (well: any) => ({
      id: well.id,
      number: well.well_number ?? well.name ?? well.well_name,
      qr: await QRCode.toDataURL(wellQrPayload(well.id), { errorCorrectionLevel: 'M', margin: 1, width: 320 }),
    })))
  }
  catch (err: any) {
    error.value = err?.message || 'No se pudieron cargar los pozos'
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6 no-print">
      <div>
        <h4 class="text-h4 mb-1">
          Etiquetas QR de los pozos
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          Imprímelas y pégalas en la tabla donde se apoya la hoja, de modo que salgan en la foto.
          Al capturar, el pozo se elige solo.
        </p>
      </div>
      <div class="d-flex align-center gap-3">
        <VTextField
          v-model.number="copies"
          type="number"
          min="1"
          max="12"
          label="Copias por pozo"
          hide-details
          style="max-inline-size: 140px;"
        />
        <VBtn
          prepend-icon="tabler-printer"
          :disabled="!labels.length"
          @click="print"
        >
          Imprimir
        </VBtn>
      </div>
    </div>

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="no-print"
    >
      {{ error }}
    </VAlert>
    <VProgressLinear
      v-if="loading"
      indeterminate
      class="no-print"
    />

    <div class="labels">
      <template
        v-for="label in labels"
        :key="label.id"
      >
        <div
          v-for="copy in Math.max(1, Math.min(12, copies || 1))"
          :key="`${label.id}-${copy}`"
          class="label"
        >
          <img
            :src="label.qr"
            :alt="`QR del pozo ${label.number}`"
          >
          <div class="label-text">
            <strong>Pozo {{ label.number }}</strong>
            <span v-if="projectName">{{ projectName }}</span>
            <small>SIMO · captura de hojas</small>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.labels {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.label {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 8px;
  background: white;
  color: black;
  gap: 10px;
  break-inside: avoid;
}

.label img {
  block-size: 110px;
  inline-size: 110px;
}

.label-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

@media print {
  .no-print { display: none !important; }
}
</style>
