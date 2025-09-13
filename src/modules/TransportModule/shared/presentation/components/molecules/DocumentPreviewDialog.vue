<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DocumentEntity } from '../../../domain/entities/DocumentEntity'
import { DocumentDomain } from '../../../domain/entities/DocumentEntity'

interface Props {
  visible: boolean
  document: DocumentEntity | null
}

interface Emits {
  (e: 'close'): void
  (e: 'download', document: DocumentEntity): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const imageError = ref(false)
const pdfError = ref(false)

// Computed
const isImage = computed(() => {
  if (!props.document?.mime_type)
    return false

  return props.document.mime_type.startsWith('image/')
})

const isPDF = computed(() => {
  if (!props.document?.mime_type)
    return false

  return props.document.mime_type.includes('pdf')
})

const isPreviewable = computed(() => {
  return isImage.value || isPDF.value
})

const previewUrl = computed(() => {
  return props.document?.download_url || ''
})

const documentTitle = computed(() => {
  return props.document?.title || 'Documento'
})

const documentType = computed(() => {
  return props.document?.document_type || ''
})

const fileSize = computed(() => {
  return DocumentDomain.formatFileSize(props.document?.file_size)
})

const statusColor = computed(() => {
  if (!props.document?.status)
    return 'default'

  return DocumentDomain.getStatusColor(props.document.status as any)
})

const statusLabel = computed(() => {
  if (!props.document?.status)
    return ''

  return DocumentDomain.getStatusLabel(props.document.status as any)
})

const expirationWarning = computed(() => {
  if (!props.document)
    return null

  if (DocumentDomain.isExpired(props.document)) {
    return {
      type: 'error',
      message: `Expirado: ${formatDate(props.document.expiration_date)}`,
      icon: 'tabler-alert-circle',
    }
  }

  if (DocumentDomain.isExpiringSoon(props.document)) {
    return {
      type: 'warning',
      message: `Vence: ${formatDate(props.document.expiration_date)}`,
      icon: 'tabler-alert-triangle',
    }
  }

  return null
})

// Methods
function handleClose() {
  imageError.value = false
  pdfError.value = false
  emit('close')
}

function handleDownload() {
  if (props.document)
    emit('download', props.document)
}

function handleImageError() {
  imageError.value = true
}

function handlePdfError() {
  pdfError.value = true
}

function formatDate(dateString?: string) {
  if (!dateString)
    return '-'

  return new Date(dateString).toLocaleDateString('es-MX')
}

function getFileTypeIcon(mimeType?: string) {
  return DocumentDomain.getFileTypeIcon(mimeType)
}
</script>

<template>
  <VDialog
    :model-value="visible"
    max-width="900"
    max-height="90vh"
    scrollable
    @update:model-value="handleClose"
  >
    <VCard v-if="document">
      <!-- Header -->
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <VIcon
            :icon="getFileTypeIcon(document.mime_type)"
            class="me-3"
            size="24"
          />
          <div>
            <div class="text-h6">
              {{ documentTitle }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ documentType }} • {{ fileSize }}
            </div>
          </div>
        </div>

        <div class="d-flex align-center gap-2">
          <!-- Status Chip -->
          <VChip
            :color="statusColor"
            size="small"
          >
            {{ statusLabel }}
          </VChip>

          <!-- Actions -->
          <VBtn
            icon
            variant="text"
            color="primary"
            @click="handleDownload"
          >
            <VIcon>tabler-download</VIcon>
            <VTooltip activator="parent">
              Descargar
            </VTooltip>
          </VBtn>

          <VBtn
            icon
            variant="text"
            @click="handleClose"
          >
            <VIcon>tabler-x</VIcon>
          </VBtn>
        </div>
      </VCardTitle>

      <VDivider />

      <!-- Document Info -->
      <VCardText class="pa-4">
        <VRow class="mb-4">
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              Información del Documento
            </div>
            <div class="text-body-2">
              <div><strong>Folio:</strong> {{ document.folio || '-' }}</div>
              <div><strong>Fecha de emisión:</strong> {{ formatDate(document.issue_date) }}</div>
              <div><strong>Fecha de vencimiento:</strong> {{ formatDate(document.expiration_date) }}</div>
              <div><strong>Autoridad emisora:</strong> {{ document.issuing_authority || '-' }}</div>
              <div><strong>Número de referencia:</strong> {{ document.reference_number || '-' }}</div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              Detalles del Archivo
            </div>
            <div class="text-body-2">
              <div><strong>Nombre:</strong> {{ document.file_name || '-' }}</div>
              <div><strong>Tamaño:</strong> {{ fileSize }}</div>
              <div><strong>Tipo:</strong> {{ document.mime_type || '-' }}</div>
              <div><strong>Subido:</strong> {{ formatDate(document.uploaded_at) }}</div>
            </div>
          </VCol>
        </VRow>

        <!-- Expiration Warning -->
        <VAlert
          v-if="expirationWarning"
          :type="expirationWarning.type"
          variant="tonal"
          class="mb-4"
        >
          <template #prepend>
            <VIcon :icon="expirationWarning.icon" />
          </template>
          {{ expirationWarning.message }}
        </VAlert>

        <!-- Description -->
        <div
          v-if="document.description"
          class="mb-4"
        >
          <div class="text-caption text-medium-emphasis mb-1">
            Descripción
          </div>
          <div class="text-body-2">
            {{ document.description }}
          </div>
        </div>

        <!-- Notes -->
        <div
          v-if="document.notes"
          class="mb-4"
        >
          <div class="text-caption text-medium-emphasis mb-1">
            Notas
          </div>
          <div class="text-body-2">
            {{ document.notes }}
          </div>
        </div>
      </VCardText>

      <VDivider />

      <!-- Preview Content -->
      <VCardText
        v-if="isPreviewable"
        class="pa-0"
      >
        <!-- Image Preview -->
        <div
          v-if="isImage && !imageError"
          class="text-center pa-4"
        >
          <VImg
            :src="previewUrl"
            :alt="documentTitle"
            max-height="500"
            contain
            class="mx-auto"
            @error="handleImageError"
          >
            <template #placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <VProgressCircular
                  color="primary"
                  indeterminate
                />
              </div>
            </template>
          </VImg>
        </div>

        <!-- PDF Preview -->
        <div
          v-else-if="isPDF && !pdfError"
          class="pa-4"
        >
          <iframe
            :src="previewUrl"
            width="100%"
            height="500"
            style="border: none; border-radius: 8px;"
            @error="handlePdfError"
          />
        </div>

        <!-- Error State -->
        <div
          v-else-if="imageError || pdfError"
          class="text-center pa-8"
        >
          <VIcon
            color="error"
            size="64"
            class="mb-4"
          >
            tabler-file-broken
          </VIcon>
          <h6 class="text-h6 mb-2">
            Error al cargar preview
          </h6>
          <p class="text-body-2 mb-4">
            No se pudo cargar la vista previa del documento
          </p>
          <VBtn
            color="primary"
            variant="outlined"
            @click="handleDownload"
          >
            <VIcon start>
              tabler-download
            </VIcon>
            Descargar Archivo
          </VBtn>
        </div>
      </VCardText>

      <!-- Non-previewable files -->
      <VCardText
        v-else
        class="text-center pa-8"
      >
        <VIcon
          :icon="getFileTypeIcon(document.mime_type)"
          color="primary"
          size="64"
          class="mb-4"
        />
        <h6 class="text-h6 mb-2">
          Vista previa no disponible
        </h6>
        <p class="text-body-2 mb-4">
          Este tipo de archivo no se puede previsualizar en el navegador
        </p>
        <VBtn
          color="primary"
          variant="elevated"
          @click="handleDownload"
        >
          <VIcon start>
            tabler-download
          </VIcon>
          Descargar para Ver
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
