<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  visible: boolean
  title: string
  actionType: 'suspend' | 'terminate' | 'reactivate' | 'delete' | 'custom'
  entityName: string
  entityInfo?: string
  warningMessage?: string
  confirmationWord?: string
  requireReason?: boolean
  requireNotes?: boolean
  requireEffectiveDate?: boolean
  loading?: boolean
  actionColor?: string
  actionIcon?: string
  actionButtonText?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm', data: { reason?: string; notes?: string; effective_date?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  warningMessage: '',
  requireReason: true,
  requireNotes: false,
  requireEffectiveDate: true,
  loading: false,
  actionColor: 'error',
  actionIcon: 'tabler-alert-triangle',
  actionButtonText: 'Confirmar',
})

const emit = defineEmits<Emits>()

// Local state
const confirmationInput = ref('')
const reason = ref('')
const notes = ref('')
const effectiveDate = ref('')
const randomConfirmationWord = ref('')

// Generate random confirmation word
function generateRandomWord() {
  const words = ['CONFIRMAR', 'IRREVERSIBLE', 'PERMANENTE', 'ENTENDIDO', 'PROCEDER']

  return words[Math.floor(Math.random() * words.length)]
}

// Initialize random word and default effective date
randomConfirmationWord.value = generateRandomWord()
effectiveDate.value = new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD

const generatedConfirmationWord = computed(() => {
  // Si confirmationWord es undefined o null, usar palabra aleatoria
  if (props.confirmationWord === undefined || props.confirmationWord === null)
    return randomConfirmationWord.value

  // Si es string vacío '', no mostrar confirmación
  if (props.confirmationWord === '')
    return ''

  // Si tiene valor, usar ese valor
  return props.confirmationWord
})

// Para mostrar o no la sección de confirmación
const shouldShowConfirmation = computed(() => {
  return generatedConfirmationWord.value !== ''
})

// Computed
const isConfirmationValid = computed(() => {
  // Si la palabra de confirmación está vacía (string vacío ''), no validar
  if (generatedConfirmationWord.value === '')
    return true

  // Si no hay palabra de confirmación requerida, considerar válido
  if (!generatedConfirmationWord.value)
    return true

  // Validar que coincida la palabra
  return confirmationInput.value.trim().toUpperCase() === generatedConfirmationWord.value.toUpperCase()
})

const isReasonValid = computed(() => {
  if (!props.requireReason)
    return true

  return reason.value.trim().length > 0
})

const isFormValid = computed(() => {
  return isConfirmationValid.value && isReasonValid.value
})

const displayTitle = computed(() => {
  return props.title || 'Confirmar Acción'
})

const computedWarningMessage = computed(() => {
  if (props.warningMessage)
    return props.warningMessage

  const messages = {
    suspend: 'Esta acción cambiará el estado del empleado a SUSPENDIDO y quedará registrado en su historial laboral.',
    terminate: 'Esta acción TERMINARÁ el contrato del empleado de forma permanente. El empleado será marcado como TERMINADO y no podrá acceder al sistema.',
    reactivate: 'Esta acción cambiará el estado del empleado a ACTIVO nuevamente y quedará registrado en su historial laboral.',
    delete: 'Esta acción no se puede deshacer y eliminará permanentemente toda la información del sistema.',
    custom: 'Esta acción quedará registrada en el historial del empleado.',
  }

  return messages[props.actionType] || messages.custom
})

const computedActionColor = computed(() => {
  if (props.actionColor)
    return props.actionColor

  const colors = {
    suspend: 'warning',
    terminate: 'error',
    reactivate: 'success',
    delete: 'error',
    custom: 'primary',
  }

  return colors[props.actionType] || 'primary'
})

const computedActionIcon = computed(() => {
  if (props.actionIcon)
    return props.actionIcon

  const icons = {
    suspend: 'tabler-pause',
    terminate: 'tabler-user-x',
    reactivate: 'tabler-player-play',
    delete: 'tabler-trash',
    custom: 'tabler-check',
  }

  return icons[props.actionType] || 'tabler-check'
})

const computedActionButtonText = computed(() => {
  if (props.actionButtonText)
    return props.actionButtonText

  const texts = {
    suspend: 'Suspender',
    terminate: 'Terminar Contrato',
    reactivate: 'Reactivar',
    delete: 'Eliminar',
    custom: 'Confirmar',
  }

  return texts[props.actionType] || 'Confirmar'
})

// Methods
function handleClose() {
  resetForm()
  emit('close')
}

function handleConfirm() {
  if (!isFormValid.value)
    return

  const data = {
    reason: reason.value.trim() || undefined,
    notes: notes.value.trim() || undefined,
    effective_date: effectiveDate.value || undefined,
  }

  console.log('🔍 ActionConfirmationDialog - Confirming with data:', data)

  emit('confirm', data)
}

function resetForm() {
  confirmationInput.value = ''
  reason.value = ''
  notes.value = ''
  effectiveDate.value = new Date().toISOString().split('T')[0]
}

// Watchers
watch(() => props.visible, newVisible => {
  if (!newVisible)
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
    <VCard>
      <VCardTitle :class="`d-flex align-center justify-space-between text-${computedActionColor}`">
        <div class="d-flex align-center">
          <VIcon
            class="me-2"
            size="24"
          >
            {{ computedActionIcon }}
          </VIcon>
          {{ displayTitle }}
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

      <VCardText class="pb-2">
        <!-- Warning Alert -->
        <VAlert
          :type="actionType === 'reactivate' ? 'info' : 'warning'"
          variant="tonal"
          class="mb-4"
        >
          <template #prepend>
            <VIcon size="20">
              {{ actionType === 'reactivate' ? 'tabler-info-circle' : 'tabler-alert-triangle' }}
            </VIcon>
          </template>
          {{ computedWarningMessage }}
        </VAlert>

        <!-- Entity Information -->
        <div class="mb-4">
          <h6 class="text-subtitle-1 mb-2">
            Información del {{ entityName }}
          </h6>
          <div class="d-flex align-center">
            <VIcon
              class="me-3"
              size="20"
            >
              tabler-user
            </VIcon>
            <div>
              <div class="font-weight-medium">
                <slot name="entity-info">
                  {{ entityInfo || entityName }}
                </slot>
              </div>
            </div>
          </div>
        </div>

        <!-- Reason Field -->
        <div
          v-if="requireReason"
          class="mb-4"
        >
          <VTextField
            v-model="reason"
            label="Razón *"
            variant="outlined"
            density="comfortable"
            :error="reason.length > 0 && !isReasonValid"
            :error-messages="reason.length > 0 && !isReasonValid ? 'La razón es requerida' : undefined"
            placeholder="Ingrese la razón de esta acción"
            counter
            maxlength="500"
          />
        </div>

        <!-- Notes Field -->
        <div
          v-if="requireNotes || actionType !== 'delete'"
          class="mb-4"
        >
          <VTextarea
            v-model="notes"
            :label="`Notas adicionales${requireNotes ? ' *' : ' (opcional)'}`"
            variant="outlined"
            density="comfortable"
            rows="3"
            placeholder="Agregue notas adicionales sobre esta acción"
            counter
            maxlength="1000"
          />
        </div>

        <!-- Effective Date Field -->
        <div
          v-if="requireEffectiveDate && (actionType === 'suspend' || actionType === 'terminate' || actionType === 'reactivate')"
          class="mb-4"
        >
          <VTextField
            v-model="effectiveDate"
            :label="`Fecha efectiva${requireEffectiveDate ? ' *' : ' (opcional)'}`"
            type="date"
            variant="outlined"
            density="comfortable"
            placeholder="Seleccione la fecha efectiva"
          />
        </div>

        <!-- Additional Content Slot -->
        <slot name="additional-content" />

        <!-- Confirmation Input -->
        <div
          v-if="shouldShowConfirmation"
          class="mb-4"
        >
          <VDivider class="mb-4" />
          <p class="text-body-2 mb-2">
            Para confirmar esta acción, por favor escriba la siguiente palabra:
          </p>
          <div :class="`text-${computedActionColor} font-weight-bold text-h6 mb-2`">
            {{ generatedConfirmationWord }}
          </div>

          <VTextField
            v-model="confirmationInput"
            label="Palabra de Confirmación *"
            variant="outlined"
            density="comfortable"
            :error="confirmationInput.length > 0 && !isConfirmationValid"
            :error-messages="confirmationInput.length > 0 && !isConfirmationValid ? 'La palabra de confirmación no coincide' : undefined"
            placeholder="Escriba la palabra exacta"
            autofocus
          />
        </div>
      </VCardText>

      <VCardActions class="justify-space-between pa-4">
        <VBtn
          variant="outlined"
          color="secondary"
          :disabled="loading"
          @click="handleClose"
        >
          Cancelar
        </VBtn>

        <VBtn
          :color="computedActionColor"
          variant="elevated"
          :disabled="!isFormValid || loading"
          :loading="loading"
          @click="handleConfirm"
        >
          <VIcon
            start
            size="16"
          >
            {{ computedActionIcon }}
          </VIcon>
          {{ computedActionButtonText }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
