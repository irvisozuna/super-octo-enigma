<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConcessionHolderStore } from '../../stores/concessionholderStore'
import type { ConcessionHolderEntity } from '../../../domain/entities/ConcessionHolderEntity'
import { useGlobalSnackbar } from '@/composables/useGlobalSnackbar'

interface Props {
  modelValue?: boolean
  holder?: ConcessionHolderEntity | null
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  holder: null,
  loading: false,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const { showSnackbar } = useGlobalSnackbar()
const concessionHolderStore = useConcessionHolderStore()

// State
const userInput = ref('')
const hasTriedSubmit = ref(false)
const loading = ref(false)

// Random words for confirmation
const confirmationWords = [
  'ELIMINAR',
  'BORRAR',
  'REMOVER',
  'CONFIRMAR',
  'SEGURO',
  'DEFINITIVO',
  'IRREVERSIBLE',
]

// Generate random confirmation word
const confirmationWord = ref('')

// Computed
const hasActiveConcessions = computed(() => {
  return (props.holder?.currentConcessions || props.holder?.activeConcessions || 0) > 0
})

// Methods
function generateConfirmationWord() {
  const randomIndex = Math.floor(Math.random() * confirmationWords.length)

  confirmationWord.value = confirmationWords[randomIndex]
}

async function confirmDelete() {
  hasTriedSubmit.value = true

  if (userInput.value.toLowerCase() !== confirmationWord.value.toLowerCase()) {
    showSnackbar({
      title: t('TransportModule.common.error'),
      messageKey: 'TransportModule.concession_holder.messages.confirmation_word_mismatch',
      color: 'error',
      timeout: 3000,
    })

    return
  }

  if (hasActiveConcessions.value) {
    showSnackbar({
      title: t('TransportModule.common.error'),
      messageKey: 'TransportModule.concession_holder.messages.cannot_delete_active_concessions',
      color: 'error',
      timeout: 4000,
    })

    return
  }

  try {
    loading.value = true

    if (props.holder?.id) {
      await concessionHolderStore.deleteItem(props.holder.id)

      showSnackbar({
        title: t('TransportModule.common.success'),
        messageKey: 'TransportModule.concession_holder.messages.deleted_successfully',
        color: 'success',
        timeout: 4000,
      })

      emit('success')
      closeDialog()
    }
  }
  catch (error: any) {
    console.error('Error deleting concession holder:', error)

    let errorMessage = t('TransportModule.common.error_occurred')

    if (error?.response?.data?.message)
      errorMessage = error.response.data.message
    else if (error?.message)
      errorMessage = error.message

    showSnackbar({
      title: t('TransportModule.common.error'),
      messageKey: errorMessage,
      color: 'error',
      timeout: 6000,
    })
  }
  finally {
    loading.value = false
  }
}

function cancelDelete() {
  emit('cancel')
  closeDialog()
}

function closeDialog() {
  emit('update:modelValue', false)
  resetForm()
}

function resetForm() {
  userInput.value = ''
  hasTriedSubmit.value = false
  generateConfirmationWord()
}

// Watch for dialog open/close
watch(() => props.modelValue, newValue => {
  if (newValue)
    resetForm()
})

// Initialize confirmation word
generateConfirmationWord()
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="500"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between px-6 pt-4 pb-2">
        <div class="text-h5 font-weight-bold text-error">
          <VIcon class="me-2">
            tabler-trash
          </VIcon>
          {{ t('TransportModule.concession_holder.actions.confirm_delete') }}
        </div>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="cancelDelete"
        >
          <VIcon>tabler-x</VIcon>
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-6">
        <!-- Warning message -->
        <VAlert
          type="warning"
          variant="tonal"
          class="mb-4"
          :text="hasActiveConcessions
            ? t('TransportModule.concession_holder.messages.delete_warning_active_concessions')
            : t('TransportModule.concession_holder.messages.delete_warning')"
        />

        <!-- Holder information -->
        <div
          v-if="holder"
          class="mb-4"
        >
          <h4 class="text-h6 mb-2">
            {{ t('TransportModule.concession_holder.fields.holder_information') }}
          </h4>
          <VList dense>
            <VListItem>
              <template #prepend>
                <VIcon>tabler-user</VIcon>
              </template>
              <VListItemTitle>{{ holder.fullName }}</VListItemTitle>
              <VListItemSubtitle>ID: CH-{{ holder.local_id?.toString().padStart(4, '0') }}</VListItemSubtitle>
            </VListItem>

            <VListItem v-if="holder.currentConcessions > 0">
              <template #prepend>
                <VIcon color="warning">
                  tabler-license
                </VIcon>
              </template>
              <VListItemTitle>{{ t('TransportModule.concession_holder.fields.active_concessions') }}</VListItemTitle>
              <VListItemSubtitle>{{ holder.currentConcessions }} concesiones activas</VListItemSubtitle>
            </VListItem>
          </VList>
        </div>

        <!-- Cannot delete if has active concessions -->
        <div
          v-if="hasActiveConcessions"
          class="text-center"
        >
          <VAlert
            type="error"
            variant="tonal"
            class="mb-4"
          >
            <VIcon start>
              tabler-shield-x
            </VIcon>
            {{ t('TransportModule.concession_holder.messages.cannot_delete_active_concessions') }}
          </VAlert>

          <VBtn
            color="primary"
            variant="outlined"
            @click="cancelDelete"
          >
            {{ t('TransportModule.common.close') }}
          </VBtn>
        </div>

        <!-- Confirmation form if no active concessions -->
        <div v-else>
          <p class="text-body-1 mb-4">
            {{ t('TransportModule.concession_holder.messages.delete_confirmation_text', { name: holder?.fullName }) }}
          </p>

          <!-- Random word confirmation -->
          <div class="mb-4">
            <p class="text-body-2 text-medium-emphasis mb-2">
              {{ t('TransportModule.concession_holder.messages.type_word_to_confirm') }}
              <strong class="text-error">{{ confirmationWord }}</strong>
            </p>

            <VTextField
              v-model="userInput"
              :label="t('TransportModule.concession_holder.fields.confirmation_word')"
              :placeholder="confirmationWord"
              variant="outlined"
              :error="hasTriedSubmit && userInput.toLowerCase() !== confirmationWord.toLowerCase()"
              :error-messages="hasTriedSubmit && userInput.toLowerCase() !== confirmationWord.toLowerCase()
                ? t('TransportModule.concession_holder.messages.confirmation_word_mismatch') : []"
              autofocus
              @keyup.enter="confirmDelete"
            />
          </div>

          <!-- Action buttons -->
          <div class="d-flex justify-end gap-2">
            <VBtn
              variant="outlined"
              :disabled="loading"
              @click="cancelDelete"
            >
              {{ t('TransportModule.common.cancel') }}
            </VBtn>

            <VBtn
              color="error"
              :loading="loading"
              :disabled="userInput.toLowerCase() !== confirmationWord.toLowerCase()"
              @click="confirmDelete"
            >
              <VIcon start>
                tabler-trash
              </VIcon>
              {{ t('TransportModule.common.delete') }}
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-alert {
  border-radius: 8px;
}

.confirmation-word {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  letter-spacing: 1px;
}
</style>
