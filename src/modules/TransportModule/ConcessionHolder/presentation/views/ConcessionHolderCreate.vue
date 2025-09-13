<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConcessionHolderStore } from '../stores/concessionholderStore'
import ConcessionHolderForm from '../components/organisms/ConcessionHolderForm.vue'
import type { ConcessionHolderCreateDto } from '../../application/dtos/ConcessionHolderDtos'
import { useGlobalSnackbar } from '@/composables/useGlobalSnackbar'

// Composables
const router = useRouter()
const { t } = useI18n()
const { showSnackbar } = useGlobalSnackbar()

// Stores
const concessionHolderStore = useConcessionHolderStore()

// Form data
const formRef = ref()
const loading = ref(false)
const successDialog = ref(false)

// Methods
const submitForm = async (formData: ConcessionHolderCreateDto) => {
  loading.value = true
  try {
    await concessionHolderStore.createItem(formData)

    // Show success notification
    showSnackbar({
      title: t('TransportModule.common.success'),
      messageKey: 'TransportModule.concession_holder.messages.created_successfully',
      color: 'success',
      timeout: 4000,
    })

    successDialog.value = true
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

const goToList = () => {
  router.push({ name: 'concessionHoldersList' })
}

const createAnother = () => {
  successDialog.value = false

  // Reset the form using the exposed method
  formRef.value?.resetForm()
}
</script>

<template>
  <div class="concession-holder-create">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center mb-6">
            <VBtn
              icon
              variant="text"
              :to="{ name: 'concessionHoldersList' }"
            >
              <VIcon>tabler-arrow-left</VIcon>
            </VBtn>
            <h1 class="text-h4 ml-4">
              {{ t('TransportModule.concession_holder.actions.create_holder') }}
            </h1>
          </div>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon class="mr-2">
                tabler-user-plus
              </VIcon>
              {{ t('TransportModule.concession_holder.fields.holder_information') }}
            </VCardTitle>
            <VCardText>
              <ConcessionHolderForm
                ref="formRef"
                :loading="loading"
                :submit-button-text="t('TransportModule.concession_holder.actions.create_holder')"
                @submit="submitForm"
                @cancel="goToList"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Success Dialog -->
    <VDialog
      v-model="successDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle class="text-center">
          <VIcon
            color="success"
            size="48"
          >
            tabler-check-circle
          </VIcon>
        </VCardTitle>
        <VCardText class="text-center">
          <h3 class="text-h6 mb-2">
            {{ t('TransportModule.concession_holder.messages.created_successfully') }}
          </h3>
          <p>{{ t('TransportModule.concession_holder.messages.holder_registered') }}</p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            @click="goToList"
          >
            {{ t('TransportModule.concession_holder.actions.view_holders') }}
          </VBtn>
          <VBtn
            variant="outlined"
            @click="createAnother"
          >
            {{ t('TransportModule.concession_holder.actions.create_another') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.concession-holder-create {
  padding: 20px;
}
</style>
