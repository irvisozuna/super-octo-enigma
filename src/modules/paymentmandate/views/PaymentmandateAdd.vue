<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppManager } from '@/composables/useAppManager'
import { usePaymentmandateStore } from '@/modules/paymentmandate/stores/paymentmandateStore'

const { t } = useI18n()
const { closeDialog } = useAppManager()
const paymentmandateStore = usePaymentmandateStore()

const paymentmandateTitle = t('paymentmandate')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const isLoading = ref(false)

function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result)
}

async function onFormSubmit() {
  if (isLoading.value)
    return

  try {
    isLoading.value = true
    await paymentmandateStore.generateLot(selectedDate.value)
    close('submit')
  }
  catch (error) {
    console.error('Error al generar lote:', error)
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <DialogCloseBtn @click="closeDialog" />
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Título -->
      <h4 class="text-h4 text-center mb-2">
        {{ t('paymentmandate.generateLot') }}
      </h4>
      <p class="text-body-1 text-center mb-6">
        {{ t('paymentmandate.generateLotDescription') }}
      </p>

      <!-- Formulario -->
      <VForm
        class="mt-6"
        @submit.prevent="onFormSubmit"
      >
        <VRow>
          <VCol
            cols="12"
            md="6"
            class="mx-auto"
          >
            <!-- Date Picker -->
            <AppDateTimePicker
              v-model="selectedDate"
              type="date"
              :label="t('paymentmandate.selectDate')"
              variant="outlined"
              required
            />
          </VCol>

          <VCol
            cols="12"
            class="d-flex flex-wrap justify-center gap-4"
          >
            <VBtn
              type="submit"
              :disabled="!selectedDate || isLoading"
              :loading="isLoading"
            >
              {{ t('generate') }}
            </VBtn>
            <VBtn
              color="secondary"
              variant="tonal"
              @click="close"
            >
              {{ t('cancel') }}
            </VBtn>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>
