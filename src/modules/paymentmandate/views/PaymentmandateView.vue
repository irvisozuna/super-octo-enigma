<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Paymentmandate } from '../types/paymentmandate'
import PaymentmandateItemsTable from '../components/PaymentmandateItemsTable.vue'
import { usePaymentmandateStore } from '@/modules/paymentmandate/stores/paymentmandateStore'
import { useAppManager } from '@/composables/useAppManager'

// Props
const props = defineProps<{
  mandate: Paymentmandate
}>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
}>()

const { closeDialog } = useAppManager()
const { t } = useI18n()
const paymentmandateStore = usePaymentmandateStore()

// Estado
const selectedFile = ref<File | null>(null)
const isProcessing = ref(false)

// Manejar la selección de archivo
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0])
    selectedFile.value = input.files[0]
}

// Procesar respuesta del banco
async function processBankResponse() {
  if (!selectedFile.value)
    return

  try {
    isProcessing.value = true

    const formData = new FormData()

    formData.append('file', selectedFile.value)
    formData.append('lot_id', props.mandate.id)

    await paymentmandateStore.processBankResponse(formData)
    closeDialog('submit')
  }
  catch (error) {
    console.error('Error processing bank response:', error)
  }
  finally {
    isProcessing.value = false
  }
}

function downloadFile(url: string) {
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', '') // Puedes poner un nombre de archivo aquí si lo deseas
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function forceDownload(url: string) {
  window.location.href = url
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <DialogCloseBtn @click="closeDialog" />
  <VCard>
    <VCardText>
      <!-- Información del lote -->
      <VRow>
        <VCol cols="12">
          <VCard variant="outlined">
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-h6 mb-2">
                    {{ t('paymentmandate.lotInfo') }}
                  </div>
                  <div class="text-body-1">
                    {{ t('paymentmandate.consecutiveNumber') }}: {{ mandate.consecutive_number }}
                  </div>
                  <div class="text-body-1">
                    {{ t('paymentmandate.status') }}:
                    <VChip
                      :color="mandate.status === 'pending' ? 'warning' : 'success'"
                      size="small"
                    >
                      {{ t(`paymentmandate.${mandate.status}`) }}
                    </VChip>
                  </div>
                </div>
                <VBtn
                  v-if="mandate.file_path"
                  color="primary"
                  prepend-icon="tabler-download"
                  @click="downloadFile(mandate.file_path)"
                >
                  {{ t('paymentmandate.downloadFile') }}
                </VBtn>
                <VBtn
                  v-if="mandate.file_path"
                  color="secondary"
                  prepend-icon="tabler-download"
                  class="ml-2"
                  @click="forceDownload(mandate.file_path)"
                >
                  Forzar descarga (redirigir)
                </VBtn>
                <div
                  v-if="mandate.file_path"
                  class="mt-2 d-flex align-center"
                >
                  <span style="word-break: break-all;">{{ mandate.file_path }}</span>
                  <VBtn
                    size="small"
                    icon="tabler-copy"
                    class="ml-2"
                    :title="t('paymentmandate.copyUrl')"
                    @click="copyToClipboard(mandate.file_path)"
                  />
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Upload de archivo -->
      <VRow
        v-if="mandate.status === 'pending'"
        class="mt-4"
      >
        <VCol cols="12">
          <VCard variant="outlined">
            <VCardText>
              <div class="text-h6 mb-4">
                {{ t('paymentmandate.processBankResponse') }}
              </div>

              <VFileInput
                v-model="selectedFile"
                :label="t('paymentmandate.selectFile')"
                accept=".xls,.xlsx"
                prepend-icon="tabler-file-spreadsheet"
                variant="outlined"
                :loading="isProcessing"
                :disabled="isProcessing"
                @change="handleFileSelect"
              />

              <div class="d-flex justify-end mt-4">
                <VBtn
                  color="primary"
                  :loading="isProcessing"
                  :disabled="!selectedFile || isProcessing"
                  @click="processBankResponse"
                >
                  {{ t('paymentmandate.processResponse') }}
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Tabla de items -->
      <VRow class="mt-4">
        <VCol cols="12">
          <PaymentmandateItemsTable
            :items="mandate.items"
            :loading="isProcessing"
          />
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
