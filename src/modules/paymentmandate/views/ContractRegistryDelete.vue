<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractRegistryStore } from '../stores/contractRegistryStore'
import type { ContractRegistry } from '../types/contractRegistry'
import { useAppManager } from '@/composables/useAppManager'
import { useConfirmationWord } from '@/composables/useConfirmationWord'

// Props
const props = defineProps<{
  item?: ContractRegistry
  title?: string
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { closeDialog } = useAppManager()
const contractRegistryStore = useContractRegistryStore()
const { confirmationWord, userInput, isWordValid, generateRandomWord, validateWord, reset, clearUserInput } = useConfirmationWord()

// Estado del formulario
const isDeleting = ref(false)
const error = ref('')

// Computed para determinar si es eliminación múltiple
const isMultipleDelete = computed(() => !props.item)

// Computed para el mensaje de confirmación
const confirmationMessage = computed(() => {
  if (isMultipleDelete.value)
    return t('paymentmandate.contractRegistry.confirm_delete_multiple', { count: contractRegistryStore.selectedItems.length })

  return t('paymentmandate.contractRegistry.confirm_delete_single', { name: props.item?.name })
})

// Métodos
function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result)
}

async function handleDelete() {
  // Validar que la palabra de confirmación sea correcta
  if (!isWordValid.value) {
    error.value = t('paymentmandate.contractRegistry.confirmation_word_required')

    return
  }

  isDeleting.value = true
  error.value = ''

  try {
    if (isMultipleDelete.value) {
      // Eliminar múltiples elementos
      const deletePromises = contractRegistryStore.selectedItems.map(item =>
        contractRegistryStore.deleteItem(item.id),
      )

      await Promise.all(deletePromises)
    }
    else if (props.item) {
      // Eliminar elemento único
      await contractRegistryStore.deleteItem(props.item.id)
    }

    close('submit')
  }
  catch (err: any) {
    error.value = err.response?.data?.message || t('paymentmandate.contractRegistry.delete_error')
    console.error('Error deleting contract registry:', err)
  }
  finally {
    isDeleting.value = false
  }
}

function handleCancel() {
  close('cancel')
}

// Manejar el cambio en el input de confirmación
function handleConfirmationInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  console.log('=== INPUT CHANGED ===')
  console.log('Input value:', `"${value}"`)
  validateWord(value)
  error.value = '' // Limpiar error cuando el usuario empiece a escribir
  console.log('=== INPUT PROCESSING COMPLETE ===')
}

// Generar nueva palabra de confirmación
function generateNewWord() {
  console.log('=== GENERATING NEW WORD ===')
  generateRandomWord()
  error.value = ''
  console.log('=== NEW WORD GENERATION COMPLETE ===')
}

// Montar el componente y generar palabra inicial
onMounted(() => {
  generateRandomWord()
})
</script>

<template>
  <DialogCloseBtn @click="close" />
  <VCard class="pa-sm-10 pa-2">
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ props.title || 'Eliminar Contrato' }}
      </h4>
    </VCardTitle>

    <VDivider />

    <VCardText>
      <div class="text-center py-4">
        <VIcon
          icon="tabler-alert-triangle"
          size="64"
          color="warning"
          class="mb-4"
        />

        <h5 class="text-h5 mb-2">
          {{ $t('paymentmandate.contractRegistry.delete_confirmation_title') }}
        </h5>

        <p class="text-body-1 mb-4">
          {{ confirmationMessage }}
        </p>

        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ error }}
        </VAlert>

        <VAlert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          {{ $t('paymentmandate.contractRegistry.delete_warning') }}
        </VAlert>

        <!-- Campo de confirmación con palabra aleatoria -->
        <div class="mt-6">
          <VAlert
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <template #prepend>
              <VIcon icon="tabler-shield-check" />
            </template>
            <div>
              <strong>{{ $t('paymentmandate.contractRegistry.confirmation_required') }}</strong>
              <p class="mb-0 mt-2">
                {{ $t('paymentmandate.contractRegistry.type_word_to_confirm', { word: confirmationWord }) }}
              </p>
            </div>
          </VAlert>

          <VTextField
            :key="confirmationWord"
            v-model="userInput"
            :label="$t('paymentmandate.contractRegistry.confirmation_word_label')"
            :placeholder="$t('paymentmandate.contractRegistry.confirmation_word_placeholder')"
            variant="outlined"
            :error="!isWordValid && userInput.length > 0"
            :error-messages="!isWordValid && userInput.length > 0 ? [$t('paymentmandate.contractRegistry.confirmation_word_incorrect')] : []"
            :success="isWordValid"
            :success-messages="isWordValid ? [$t('paymentmandate.contractRegistry.confirmation_word_correct')] : []"
            class="mb-2"
            @input="handleConfirmationInput"
          />

          <div class="d-flex justify-space-between align-center">
            <VBtn
              variant="text"
              size="small"
              color="primary"
              @click="generateNewWord"
            >
              <VIcon
                start
                icon="tabler-refresh"
              />
              {{ $t('paymentmandate.contractRegistry.generate_new_word') }}
            </VBtn>

            <span class="text-caption text-medium-emphasis">
              {{ $t('paymentmandate.contractRegistry.confirmation_word_hint') }}
            </span>
          </div>
        </div>
      </div>
    </VCardText>

    <VCardActions class="justify-end">
      <VBtn
        variant="outlined"
        @click="handleCancel"
      >
        {{ $t('cancel') }}
      </VBtn>
      <VBtn
        color="error"
        :loading="isDeleting"
        :disabled="!isWordValid"
        @click="handleDelete"
      >
        {{ $t('eliminar') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
