<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConcessionHolderStore } from '../../stores/concessionholderStore'
import ConcessionHolderForm from '../organisms/ConcessionHolderForm.vue'
import type { ConcessionHolderCreateDto } from '../../../application/dtos/ConcessionHolderDtos'
import { useGlobalSnackbar } from '@/composables/useGlobalSnackbar'
import { useAppManager } from '@/composables/useAppManager'

interface Props {
  title?: string
  loading?: boolean
  modelValue?: boolean
}

interface Emits {
  (e: 'submit', data: any): void
  (e: 'cancel'): void
  (e: 'close'): void
  (e: 'success'): void
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Add Concession Holder',
  loading: false,
  modelValue: false,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const { closeDialog } = useAppManager()
const { showSnackbar } = useGlobalSnackbar()

const concessionHolderStore = useConcessionHolderStore()

// Form data
const formRef = ref()
const loading = ref(false)

// Methods
const submitForm = async (formData: ConcessionHolderCreateDto) => {
  loading.value = true
  try {
    const newHolder = await concessionHolderStore.createItem(formData)

    // Show success notification
    showSnackbar({
      title: t('TransportModule.common.success'),
      messageKey: 'TransportModule.concession_holder.messages.created_successfully',
      color: 'success',
      timeout: 4000,
    })

    emit('success')
    close('submit', newHolder)
  }
  catch (error: any) {
    console.error('Error creating concession holder:', error)

    // Show error notification
    let errorMessage = t('TransportModule.common.error_occurred')

    // Handle API validation errors
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    }
    else if (error?.response?.data?.errors) {
      // Handle Laravel validation errors
      const errors = error.response.data.errors
      const firstError = Object.values(errors)[0]
      if (Array.isArray(firstError) && firstError.length > 0)
        errorMessage = firstError[0] as string
    }
    else if (error?.message) {
      errorMessage = error.message
    }

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

function close(result: 'close' | 'submit' | 'cancel' = 'close', data?: any) {
  emit('update:modelValue', false)
  closeDialog(result, data)
  emit('close')
}

const cancelForm = () => {
  emit('cancel')
  close('cancel')
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="800"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <VCard class="pa-0">
      <VCardTitle class="d-flex align-center justify-space-between px-6 pt-4 pb-2">
        <div class="text-h5 font-weight-bold">
          <VIcon class="me-2">
            tabler-user-plus
          </VIcon>
          {{ title }}
        </div>
        <VBtn
          icon
          variant="text"
          size="small"
          @click="cancelForm"
        >
          <VIcon>tabler-x</VIcon>
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-6">
        <div class="text-body-2 text-medium-emphasis mb-6">
          {{ t('TransportModule.concession_holder.create_description') }}
        </div>

        <ConcessionHolderForm
          ref="formRef"
          :loading="loading"
          :submit-button-text="t('TransportModule.concession_holder.actions.create_holder')"
          :show-cancel-button="false"
          @submit="submitForm"
          @cancel="cancelForm"
        />
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
/* Add any specific styles if needed */
</style>
