<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<AddCostDialogProps>(), {
  currency: 'USD',
  loading: false,
  error: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: any]
  'success': []
}>()

const { t } = useI18n()

export interface AddCostDialogProps {
  modelValue: boolean
  projectId: string
  currency?: string
  loading?: boolean
  error?: string | null
}

const formRef = ref()
const errorMessage = ref('')
const errorTitle = ref('Error al agregar costo')
const validationErrors = ref<string[]>([])

const localDialog = computed({
  get: () => props.modelValue,
  set: value => {
    if (!value) {
      errorMessage.value = ''
      validationErrors.value = []
    }
    emit('update:modelValue', value)
  },
})

const formData = ref({
  date: new Date().toISOString().split('T')[0],
  category: null as string | null,
  description: '',
  quantity: 1,
  unit_price: 0,
  amount: 0,
  supplier: '',
  invoice_number: '',
  notes: '',
})

const categoryOptions = [
  { title: 'Personal', value: 'labor' },
  { title: 'Materiales', value: 'materials' },
  { title: 'Equipo', value: 'equipment' },
  { title: 'Transporte', value: 'transport' },
  { title: 'Servicios', value: 'services' },
  { title: 'Otros', value: 'other' },
]

const rules = {
  required: (value: any) => !!value || 'Campo requerido',
  positiveNumber: (value: number) => value > 0 || 'Debe ser mayor a 0',
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Máximo ${max} caracteres`,
}

const calculatedAmount = computed(() => {
  if (formData.value.quantity > 0 && formData.value.unit_price > 0)
    return formData.value.quantity * formData.value.unit_price

  return 0
})

// Auto-calculate amount when quantity or unit_price changes
watch([() => formData.value.quantity, () => formData.value.unit_price], () => {
  if (calculatedAmount.value > 0)
    formData.value.amount = calculatedAmount.value
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currency,
  }).format(amount)
}

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  errorMessage.value = ''
  validationErrors.value = []

  const data = {
    project_id: props.projectId,
    currency: props.currency, // Agregar currency que falta
    ...formData.value,
  }

  emit('submit', data)
}

// Method to be called from parent on success
const onSuccess = () => {
  resetForm()
  localDialog.value = false
}

// Expose method for parent to call
defineExpose({
  onSuccess,
})

const resetForm = () => {
  formData.value = {
    date: new Date().toISOString().split('T')[0],
    category: null,
    description: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    supplier: '',
    invoice_number: '',
    notes: '',
  }
  formRef.value?.reset()
}

const handleCancel = () => {
  resetForm()
  localDialog.value = false
}

// Reset form when dialog opens
watch(() => props.modelValue, newValue => {
  if (newValue) {
    resetForm()
    errorMessage.value = ''
    validationErrors.value = []
  }
})

// Watch for errors from parent
watch(() => props.error, newError => {
  if (!newError)
    return

  console.log('🔴 Cost Dialog: Received error from parent:', newError)

  try {
    const errorObj = typeof newError === 'string' ? JSON.parse(newError) : newError

    console.log('🔍 Cost Dialog: Parsed error object:', errorObj)

    // Handle Laravel validation errors
    if (errorObj.errors) {
      errorTitle.value = 'Errores de validación'
      errorMessage.value = errorObj.message || 'Por favor corrige los siguientes errores:'

      // Extract validation errors
      validationErrors.value = Object.values(errorObj.errors).flat() as string[]
      console.log('📋 Validation errors:', validationErrors.value)
    }
    else if (errorObj.error) {
      // Handle structured error
      const errorCode = errorObj.error.code
      const translatedMessage = t(`errors.${errorCode}`, '', { missingWarn: false, fallbackWarn: false })

      if (translatedMessage && translatedMessage !== '' && translatedMessage !== `errors.${errorCode}`) {
        errorTitle.value = t('common.error')
        errorMessage.value = translatedMessage
      }
      else {
        errorTitle.value = errorCode || t('common.error')
        errorMessage.value = errorObj.error.message || newError
      }
      validationErrors.value = []
    }
    else {
      errorTitle.value = t('common.error')
      errorMessage.value = errorObj.message || typeof errorObj === 'string' ? errorObj : JSON.stringify(errorObj)
      validationErrors.value = []
    }
  }
  catch (e) {
    console.error('💥 Cost Dialog: Error parsing error message:', e)
    errorTitle.value = t('common.error')
    errorMessage.value = typeof newError === 'string' ? newError : 'Error desconocido'
    validationErrors.value = []
  }
})
</script>

<template>
  <VDialog
    v-model="localDialog"
    max-width="700"
    persistent
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between sticky-header">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-plus"
            color="primary"
          />
          <span>Agregar Costo al Proyecto</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="handleCancel"
        />
      </VCardTitle>

      <VDivider />

      <VCardText
        class="pa-6"
        style="max-height: 70vh; overflow-y: auto;"
      >
        <!-- Error Alert -->
        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          prominent
          @click:close="errorMessage = ''"
        >
          <template #prepend>
            <VIcon
              icon="tabler-alert-circle"
              size="32"
            />
          </template>
          <VAlertTitle class="text-h6 mb-2">
            {{ errorTitle }}
          </VAlertTitle>
          <div v-if="validationErrors.length > 0">
            <p class="mb-2">
              {{ errorMessage }}
            </p>
            <ul class="ml-4">
              <li
                v-for="(error, index) in validationErrors"
                :key="index"
                class="text-body-2"
              >
                {{ error }}
              </li>
            </ul>
          </div>
          <p
            v-else
            class="mb-0"
          >
            {{ errorMessage }}
          </p>
        </VAlert>

        <VForm
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <!-- Date -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.date"
                label="Fecha *"
                type="date"
                prepend-inner-icon="tabler-calendar"
                :rules="[rules.required]"
                required
              />
            </VCol>

            <!-- Category -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.category"
                label="Categoría *"
                :items="categoryOptions"
                prepend-inner-icon="tabler-category"
                :rules="[rules.required]"
                required
              />
            </VCol>

            <!-- Description -->
            <VCol cols="12">
              <VTextarea
                v-model="formData.description"
                label="Descripción *"
                rows="3"
                counter="500"
                :rules="[rules.required, rules.maxLength(500)]"
                prepend-inner-icon="tabler-notes"
                required
              />
            </VCol>

            <!-- Quantity -->
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model.number="formData.quantity"
                label="Cantidad"
                type="number"
                step="0.01"
                min="0"
                prepend-inner-icon="tabler-list-numbers"
              />
            </VCol>

            <!-- Unit Price -->
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model.number="formData.unit_price"
                label="Precio Unitario"
                type="number"
                step="0.01"
                min="0"
                prepend-inner-icon="tabler-currency-dollar"
                :prefix="currency"
              />
            </VCol>

            <!-- Total Amount -->
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model.number="formData.amount"
                label="Monto Total *"
                type="number"
                step="0.01"
                min="0"
                prepend-inner-icon="tabler-cash"
                :prefix="currency"
                :rules="[rules.required, rules.positiveNumber]"
                required
              />
            </VCol>

            <!-- Cost Calculation Helper -->
            <VCol
              v-if="calculatedAmount > 0"
              cols="12"
            >
              <VAlert
                type="info"
                variant="tonal"
              >
                <div class="d-flex align-center justify-space-between">
                  <span>Cálculo automático: {{ formData.quantity }} × {{ formatCurrency(formData.unit_price) }}</span>
                  <VBtn
                    size="small"
                    variant="text"
                    prepend-icon="tabler-check"
                    @click="formData.amount = calculatedAmount"
                  >
                    Usar {{ formatCurrency(calculatedAmount) }}
                  </VBtn>
                </div>
              </VAlert>
            </VCol>

            <!-- Supplier/Vendor -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.supplier"
                label="Proveedor"
                prepend-inner-icon="tabler-building-store"
                counter="200"
                :rules="[rules.maxLength(200)]"
              />
            </VCol>

            <!-- Invoice/Reference Number -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.invoice_number"
                label="N° Factura / Referencia"
                prepend-inner-icon="tabler-file-invoice"
                counter="100"
                :rules="[rules.maxLength(100)]"
              />
            </VCol>

            <!-- Notes -->
            <VCol cols="12">
              <VTextarea
                v-model="formData.notes"
                label="Notas Adicionales"
                rows="2"
                counter="500"
                :rules="[rules.maxLength(500)]"
                prepend-inner-icon="tabler-note"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="text"
          @click="handleCancel"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        >
          <VIcon
            start
            icon="tabler-device-floppy"
          />
          Guardar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
}
</style>
