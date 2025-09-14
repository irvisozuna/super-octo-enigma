<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DocumentEntity } from '../../../domain/entities/DocumentEntity'
import { DocumentDomain } from '../../../domain/entities/DocumentEntity'

type VerificationAction = 'verify' | 'reject' | 'pending'

interface Props {
  visible: boolean
  document: DocumentEntity | null
  action: VerificationAction
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm', action: VerificationAction, data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form data
const notes = ref('')
const verificationNotes = ref('')
const rejectionReason = ref('')
const pendingReason = ref('')

// Computed
const dialogTitle = computed(() => {
  switch (props.action) {
    case 'verify': return 'Verificar Documento'
    case 'reject': return 'Rechazar Documento'
    case 'pending': return 'Marcar como Pendiente'
    default: return 'Verificar Documento'
  }
})

const actionColor = computed(() => {
  switch (props.action) {
    case 'verify': return 'success'
    case 'reject': return 'error'
    case 'pending': return 'warning'
    default: return 'primary'
  }
})

const actionIcon = computed(() => {
  switch (props.action) {
    case 'verify': return 'tabler-check-circle'
    case 'reject': return 'tabler-x-circle'
    case 'pending': return 'tabler-clock'
    default: return 'tabler-check-circle'
  }
})

const isValid = computed(() => {
  switch (props.action) {
    case 'verify':
      return true // Notes are optional for verification
    case 'reject':
      return rejectionReason.value.trim().length > 0
    case 'pending':
      return pendingReason.value.trim().length > 0
    default:
      return false
  }
})

const statusColor = computed(() => {
  if (!props.document?.status)
    return 'default'

  return DocumentDomain.getStatusColor(props.document.status)
})

const statusLabel = computed(() => {
  if (!props.document?.status)
    return ''

  return DocumentDomain.getStatusLabel(props.document.status)
})

const fileTypeIcon = computed(() => {
  return DocumentDomain.getFileTypeIcon(props.document?.mime_type)
})

const fileSize = computed(() => {
  return DocumentDomain.formatFileSize(props.document?.file_size)
})

// Methods
function handleClose() {
  resetForm()
  emit('close')
}

function handleConfirm() {
  if (!isValid.value)
    return

  const data: any = {
    notes: notes.value.trim() || undefined,
  }

  switch (props.action) {
    case 'verify':
      data.verification_notes = verificationNotes.value.trim() || undefined
      break
    case 'reject':
      data.rejection_reason = rejectionReason.value.trim()
      break
    case 'pending':
      data.pending_reason = pendingReason.value.trim()
      break
  }

  emit('confirm', props.action, data)
}

function resetForm() {
  notes.value = ''
  verificationNotes.value = ''
  rejectionReason.value = ''
  pendingReason.value = ''
}

function formatDate(dateString?: string) {
  if (!dateString)
    return '-'

  return new Date(dateString).toLocaleDateString('es-MX')
}

// Watch for visibility changes to reset form
watch(() => props.visible, newVisible => {
  if (newVisible)
    resetForm()
})
</script>

<template>
  <VDialog
    :model-value="visible"
    max-width="600"
    persistent
    @update:model-value="handleClose"
  >
    <VCard v-if="document">
      <!-- Header -->
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <VIcon
            :icon="actionIcon"
            :color="actionColor"
            class="me-2"
            size="24"
          />
          <span>{{ dialogTitle }}</span>
        </div>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="handleClose"
        >
          <VIcon>tabler-x</VIcon>
        </VBtn>
      </VCardTitle>

      <VDivider />

      <!-- Document Info -->
      <VCardText class="pa-4">
        <div class="mb-4">
          <h6 class="text-subtitle-1 mb-3">
            Información del Documento
          </h6>

          <VCard
            variant="outlined"
            class="mb-4"
          >
            <VCardText class="pa-3">
              <div class="d-flex align-center mb-2">
                <VIcon
                  :icon="fileTypeIcon"
                  class="me-3"
                  size="24"
                />
                <div class="flex-grow-1">
                  <div class="font-weight-medium">
                    {{ document.title }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ document.document_type }} • {{ fileSize }}
                  </div>
                </div>
                <VChip
                  :color="statusColor"
                  size="small"
                >
                  {{ statusLabel }}
                </VChip>
              </div>

              <div class="text-body-2">
                <VRow dense>
                  <VCol cols="6">
                    <strong>Folio:</strong> {{ document.folio || '-' }}
                  </VCol>
                  <VCol cols="6">
                    <strong>Subido:</strong> {{ formatDate(document.uploaded_at) }}
                  </VCol>
                  <VCol cols="6">
                    <strong>Vencimiento:</strong> {{ formatDate(document.expiration_date) }}
                  </VCol>
                  <VCol cols="6">
                    <strong>Verificado:</strong> {{ document.is_verified ? 'Sí' : 'No' }}
                  </VCol>
                </VRow>
              </div>
            </VCardText>
          </VCard>
        </div>

        <!-- Action Form -->
        <VForm @submit.prevent="handleConfirm">
          <!-- Verify Action Fields -->
          <div v-if="action === 'verify'">
            <VTextarea
              v-model="verificationNotes"
              label="Notas de Verificación"
              variant="outlined"
              rows="3"
              placeholder="Detalles sobre la verificación del documento..."
            />
          </div>

          <!-- Reject Action Fields -->
          <div v-else-if="action === 'reject'">
            <VTextarea
              v-model="rejectionReason"
              label="Razón del Rechazo *"
              variant="outlined"
              rows="3"
              placeholder="Especifica por qué se rechaza el documento..."
              :error="rejectionReason.trim().length === 0"
              :error-messages="rejectionReason.trim().length === 0 ? 'La razón del rechazo es requerida' : undefined"
            />
          </div>

          <!-- Pending Action Fields -->
          <div v-else-if="action === 'pending'">
            <VTextarea
              v-model="pendingReason"
              label="Razón para Marcar como Pendiente *"
              variant="outlined"
              rows="3"
              placeholder="Especifica qué información falta o qué se requiere..."
              :error="pendingReason.trim().length === 0"
              :error-messages="pendingReason.trim().length === 0 ? 'La razón es requerida' : undefined"
            />
          </div>

          <!-- General Notes (for all actions) -->
          <VTextarea
            v-model="notes"
            label="Notas Adicionales"
            variant="outlined"
            rows="2"
            placeholder="Comentarios adicionales (opcional)..."
            class="mt-3"
          />
        </VForm>
      </VCardText>

      <!-- Actions -->
      <VCardActions class="justify-space-between pa-4">
        <VBtn
          variant="outlined"
          @click="handleClose"
        >
          Cancelar
        </VBtn>

        <VBtn
          :color="actionColor"
          variant="elevated"
          :disabled="!isValid || loading"
          :loading="loading"
          @click="handleConfirm"
        >
          <VIcon
            start
            :icon="actionIcon"
          />
          {{ action === 'verify' ? 'Verificar' : action === 'reject' ? 'Rechazar' : 'Marcar Pendiente' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
