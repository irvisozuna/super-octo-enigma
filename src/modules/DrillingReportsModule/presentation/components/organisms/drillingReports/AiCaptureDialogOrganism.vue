<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AiImport, AiImportStatus } from '../../../../infrastructure/api/services/AiCaptureApiService'
import { isAiImportRunning, useAiCaptureStore } from '../../../stores/aiCaptureStore'

export interface AiCaptureDialogProps {
  modelValue: boolean
  projectId: string
  wellId: string
  wellName: string
}

const props = defineProps<AiCaptureDialogProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'review': [reportId: string]
  'completed': []
}>()

const MAX_PHOTOS = 10
const MAX_MB = 15

const store = useAiCaptureStore()
const photos = ref<File[]>([])

const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const photoRules = [
  (files: File[]) => !files?.length || files.length <= MAX_PHOTOS || `Máximo ${MAX_PHOTOS} fotos por carga`,
  (files: File[]) => !files?.some(file => file.size > MAX_MB * 1024 * 1024) || `Cada foto debe pesar menos de ${MAX_MB} MB`,
]

const canUpload = computed(() =>
  !!props.wellId && photos.value.length > 0 && photos.value.length <= MAX_PHOTOS
  && !photos.value.some(file => file.size > MAX_MB * 1024 * 1024))

const STATUS: Record<AiImportStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'En cola', color: 'secondary', icon: 'tabler-clock' },
  processing: { label: 'Leyendo hoja…', color: 'info', icon: 'tabler-loader-2' },
  completed: { label: 'Borrador creado', color: 'success', icon: 'tabler-check' },
  failed: { label: 'Error', color: 'error', icon: 'tabler-alert-triangle' },
}

const warningCount = (item: AiImport) => item.warnings.filter(warning => warning.severity === 'warning').length

async function handleUpload() {
  if (!canUpload.value)
    return
  await store.upload(props.projectId, props.wellId, photos.value)
  photos.value = []
}

watch(() => store.running, (isRunning, wasRunning) => {
  if (wasRunning && !isRunning)
    emit('completed')
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="760"
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-camera"
            color="primary"
          />
          <span>Capturar reportes desde foto</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="dialog = false"
        />
      </VCardTitle>

      <VCardText>
        <VAlert
          v-if="!wellId"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          El proyecto no tiene un pozo asignado. Asigna uno para poder capturar reportes.
        </VAlert>
        <p
          v-else
          class="text-body-2 mb-4"
        >
          Sube una foto por hoja del <strong>Reporte de Perforación Diamantina</strong> del pozo <strong>{{ wellName }}</strong>.
          La IA lee cada hoja y crea un reporte en <strong>borrador</strong> con los datos capturados; después revisas lo marcado y lo completas.
        </p>

        <VFileInput
          v-model="photos"
          label="Fotos de las hojas"
          accept="image/*,.heic,.heif"
          prepend-icon="tabler-photo"
          multiple
          chips
          counter
          show-size
          :rules="photoRules"
          :disabled="!wellId || store.uploading"
          :hint="`Hasta ${MAX_PHOTOS} fotos de ${MAX_MB} MB. Toma la hoja completa, de frente y con buena luz.`"
          persistent-hint
        />

        <VAlert
          v-if="store.error"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ store.error }}
        </VAlert>

        <VList
          v-if="store.imports.length"
          class="mt-4"
          lines="two"
        >
          <VListItem
            v-for="item in store.imports"
            :key="item.id"
          >
            <template #prepend>
              <VIcon
                :icon="STATUS[item.status].icon"
                :color="STATUS[item.status].color"
                :class="{ 'ai-capture-spin': isAiImportRunning(item) }"
              />
            </template>
            <VListItemTitle>{{ item.original_name }}</VListItemTitle>
            <VListItemSubtitle>
              <span v-if="item.status === 'failed'">{{ item.error }}</span>
              <span v-else-if="item.status === 'completed'">
                {{ warningCount(item) ? `${warningCount(item)} puntos por revisar` : 'Sin advertencias' }}
              </span>
              <span v-else>{{ STATUS[item.status].label }}</span>
            </VListItemSubtitle>
            <template #append>
              <VBtn
                v-if="item.status === 'completed' && item.report_id"
                size="small"
                color="primary"
                variant="tonal"
                prepend-icon="tabler-eye-check"
                @click="emit('review', item.report_id)"
              >
                Revisar
              </VBtn>
              <VChip
                v-else
                size="small"
                :color="STATUS[item.status].color"
                variant="tonal"
              >
                {{ STATUS[item.status].label }}
              </VChip>
            </template>
          </VListItem>
        </VList>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <span
          v-if="store.running"
          class="text-caption text-medium-emphasis"
        >
          Cada hoja tarda unos 30 segundos. Puedes cerrar esta ventana: el proceso sigue.
        </span>
        <VSpacer />
        <VBtn
          variant="text"
          @click="dialog = false"
        >
          Cerrar
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="tabler-upload"
          :loading="store.uploading"
          :disabled="!canUpload"
          @click="handleUpload"
        >
          Subir y leer
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.ai-capture-spin {
  animation: ai-capture-spin 1.2s linear infinite;
}

@keyframes ai-capture-spin {
  to { transform: rotate(360deg); }
}
</style>
