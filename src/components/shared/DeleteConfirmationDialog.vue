<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  visible: boolean
  title: string
  entityName: string
  entityId?: string
  warningMessage?: string
  confirmationWord?: string
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm'): void
}

const props = withDefaults(defineProps<Props>(), {
  warningMessage: 'Esta acción no se puede deshacer y eliminará permanentemente toda la información del sistema.',
  confirmationWord: 'IRREVERSIBLE',
  loading: false,
})

const emit = defineEmits<Emits>()

// Local state
const confirmationInput = ref('')

// Computed
const isConfirmationValid = computed(() => {
  return confirmationInput.value.trim().toUpperCase() === props.confirmationWord.toUpperCase()
})

const displayTitle = computed(() => {
  return props.title || 'Confirmar Eliminación'
})

// Methods
function handleClose() {
  confirmationInput.value = ''
  emit('close')
}

function handleConfirm() {
  if (isConfirmationValid.value)
    emit('confirm')
}

// Watchers
watch(() => props.visible, newVisible => {
  if (!newVisible)
    confirmationInput.value = ''
})
</script>

<template>
  <VDialog
    :model-value="visible"
    max-width="500"
    persistent
    @update:model-value="handleClose"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between text-error">
        <div class="d-flex align-center">
          <VIcon
            class="me-2"
            size="24"
          >
            tabler-trash
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
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <template #prepend>
            <VIcon size="20">
              tabler-alert-triangle
            </VIcon>
          </template>
          {{ warningMessage }}
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
                  {{ entityName }}
                </slot>
              </div>
              <div
                v-if="entityId"
                class="text-caption text-medium-emphasis"
              >
                ID: {{ entityId }}
              </div>
            </div>
          </div>
        </div>

        <!-- Confirmation Message -->
        <div class="mb-4">
          <p class="text-body-2 mb-2">
            Está a punto de eliminar permanentemente
            <slot name="confirmation-text">
              este {{ entityName.toLowerCase() }}
            </slot>
            . Esta acción no se puede deshacer.
          </p>
        </div>

        <!-- Confirmation Input -->
        <div class="mb-4">
          <p class="text-body-2 mb-2">
            Para confirmar la eliminación, por favor escriba la siguiente palabra:
          </p>
          <div class="text-error font-weight-bold text-h6 mb-2">
            {{ confirmationWord }}
          </div>

          <VTextField
            v-model="confirmationInput"
            label="Palabra de Confirmación"
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
          @click="handleClose"
        >
          Cancelar
        </VBtn>

        <VBtn
          color="error"
          variant="elevated"
          :disabled="!isConfirmationValid || loading"
          :loading="loading"
          @click="handleConfirm"
        >
          <VIcon
            start
            size="16"
          >
            tabler-trash
          </VIcon>
          Eliminar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
