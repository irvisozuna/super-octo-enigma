<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SIGNATURE_METHODS, SIGNATURE_TYPES } from '../../shared/constants/DrillingConstants'

// Props
interface Props {
  modelValue: boolean
  reportId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// State
const formRef = ref()
const formValid = ref(false)
const signing = ref(false)
const signatureData = ref('')

const formData = ref({
  signature_type: 'operator',
  signature_method: 'digital',
})

const errors = ref({})

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const signatureTypes = computed(() => SIGNATURE_TYPES)
const signatureMethods = computed(() => SIGNATURE_METHODS)

const canChangeSignatureType = computed(() => {
  // TODO: Implement logic based on user permissions and existing signatures
  return true
})

const canSign = computed(() => {
  if (!formValid.value)
    return false

  if (formData.value.signature_method === 'digital')
    return signatureData.value.length > 0

  return true
})

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
}

// Methods
const closeModal = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    signature_type: 'operator',
    signature_method: 'digital',
  }
  signatureData.value = ''
  errors.value = {}
}

const signReport = async () => {
  if (!canSign.value)
    return

  signing.value = true
  try {
    // TODO: Implement sign report
    console.log('Signing report:', {
      reportId: props.reportId,
      signatureType: formData.value.signature_type,
      signatureMethod: formData.value.signature_method,
      signatureData: signatureData.value,
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Show success message
    // TODO: Show success notification

    emit('saved')
    closeModal()
  }
  catch (error) {
    console.error('Error signing report:', error)

    // TODO: Show error notification
  }
  finally {
    signing.value = false
  }
}

// Watchers
watch(() => props.modelValue, newValue => {
  if (newValue)
    resetForm()
})

watch(() => formData.value.signature_method, newMethod => {
  if (newMethod !== 'digital')
    signatureData.value = ''
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="600px"
    persistent
  >
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-signature"
          class="me-2"
        />
        Firmar Reporte
      </VCardTitle>

      <VCardText>
        <VForm
          ref="formRef"
          v-model="formValid"
          @submit.prevent="signReport"
        >
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.signature_type"
                :items="signatureTypes"
                item-title="label"
                item-value="value"
                label="Tipo de Firma *"
                :rules="[rules.required]"
                :error-messages="errors.signature_type"
                :disabled="!canChangeSignatureType"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.signature_method"
                :items="signatureMethods"
                item-title="label"
                item-value="value"
                label="Método de Firma *"
                :rules="[rules.required]"
                :error-messages="errors.signature_method"
              />
            </VCol>
          </VRow>

          <!-- Signature Canvas -->
          <div
            v-if="formData.signature_method === 'digital'"
            class="signature-section"
          >
            <h4 class="signature-section-title">
              Firma Digital
            </h4>
            <DrillingReportSignatureCanvas
              v-model="signatureData"
              :width="400"
              :height="200"
              class="mb-4"
            />
          </div>

          <!-- Physical Signature Info -->
          <div
            v-else-if="formData.signature_method === 'physical'"
            class="signature-section"
          >
            <VAlert
              type="info"
              class="mb-4"
            >
              <VIcon
                icon="mdi-information"
                class="me-2"
              />
              Para firmas físicas, el reporte debe ser impreso y firmado manualmente.
            </VAlert>
          </div>

          <!-- Electronic Signature Info -->
          <div
            v-else-if="formData.signature_method === 'electronic'"
            class="signature-section"
          >
            <VAlert
              type="info"
              class="mb-4"
            >
              <VIcon
                icon="mdi-information"
                class="me-2"
              />
              Para firmas electrónicas, se utilizará un certificado digital.
            </VAlert>
          </div>

          <!-- Signature Preview -->
          <div
            v-if="signatureData"
            class="signature-preview"
          >
            <h4 class="preview-title">
              Vista Previa de la Firma:
            </h4>
            <div class="preview-container">
              <img
                :src="signatureData"
                alt="Firma guardada"
                class="preview-image"
              >
            </div>
          </div>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="grey"
          variant="outlined"
          @click="closeModal"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          :loading="signing"
          :disabled="!canSign"
          @click="signReport"
        >
          <VIcon
            icon="mdi-signature"
            class="me-2"
          />
          Firmar Reporte
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-dialog {
  max-inline-size: 600px;
}

.v-card-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.v-card-actions {
  border-block-start: 1px solid #e0e0e0;
  padding-block: 16px;
  padding-inline: 24px;
}

.v-form {
  padding: 0;
}

.v-row {
  margin: 0;
}

.v-col {
  padding-block: 8px;
  padding-inline: 12px;
}

.signature-section {
  padding: 16px;
  border-radius: 8px;
  background-color: #f5f5f5;
  margin-block-start: 24px;
}

.signature-section-title {
  font-size: 16px;
  font-weight: 600;
  margin-block: 0 16px;
  margin-inline: 0;
}

.signature-preview {
  padding: 16px;
  border-radius: 8px;
  background-color: #f5f5f5;
  margin-block-start: 24px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  margin-block: 0 12px;
  margin-inline: 0;
}

.preview-container {
  text-align: center;
}

.preview-image {
  border: 1px solid #ddd;
  border-radius: 4px;
  max-block-size: 100px;
  max-inline-size: 200px;
}

@media (max-width: 768px) {
  .v-dialog {
    margin: 16px;
    max-inline-size: 100%;
  }

  .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
