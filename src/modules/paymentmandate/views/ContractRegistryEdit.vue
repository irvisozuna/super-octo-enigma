<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractRegistryStore } from '../stores/contractRegistryStore'
import type { ContractRegistry, ContractRegistryUpdateRequest } from '../types/contractRegistry'
import { contractRegistryValidation } from '../validations/contractRegistryValidation'
import { useBanks } from '@/composables/useBanks'
import { useAccountTypes } from '@/composables/useAccountTypes'
import { useAppManager } from '@/composables/useAppManager'

// Props
const props = defineProps<{
  item: ContractRegistry
  title?: string
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { closeDialog } = useAppManager()
const contractRegistryStore = useContractRegistryStore()
const { bankOptions, updateSearch } = useBanks()
const { accountTypeOptions, updateSearch: updateAccountTypeSearch } = useAccountTypes()

// Formulario reactivo
const form = ref<ContractRegistryUpdateRequest>({
  controlNumber: props.item.controlNumber,
  contractNumber: props.item.contractNumber,
  name: props.item.name,
  cardNumber: props.item.cardNumber,
  maxAmount: props.item.maxAmount,
  expirationDate: props.item.expirationDate,
  bank: props.item.bank,
  accountType: props.item.accountType,
  registrationDate: props.item.registrationDate,
  chargeFrequency: props.item.chargeFrequency,
  phone: props.item.phone,
})

// Estado del formulario
const isSubmitting = ref(false)
const errors = ref<Record<string, string[]>>({})

// Opciones para los selects

const chargeFrequencyOptions = [
  { title: '15 días', value: 15 },
  { title: '30 días', value: 30 },
  { title: '60 días', value: 60 },
  { title: '90 días', value: 90 },
]

// Computed para validación (excluyendo campos de solo lectura)
const isFormValid = computed(() => {
  // Validación básica de campos editables
  return !!(
    form.value.name
    && form.value.cardNumber
    && form.value.maxAmount
    && form.value.expirationDate
    && form.value.bank
    && form.value.accountType
    && form.value.chargeFrequency
    && form.value.phone
  )
})

// Métodos
function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result)
}

async function handleSubmit() {
  if (!isFormValid.value) {
    console.log('Form is not valid, cannot submit')
    errors.value = { general: ['Por favor completa todos los campos requeridos'] }

    return
  }

  isSubmitting.value = true
  errors.value = {}

  try {
    // Solo enviar campos editables
    const updateData: ContractRegistryUpdateRequest = {
      name: form.value.name,
      cardNumber: form.value.cardNumber,
      maxAmount: form.value.maxAmount,
      expirationDate: form.value.expirationDate,
      bank: form.value.bank,
      accountType: form.value.accountType,
      chargeFrequency: form.value.chargeFrequency,
      phone: form.value.phone,
    }

    console.log('Updating contract with data:', updateData)
    await contractRegistryStore.updateItem(props.item.id, updateData)
    console.log('Contract updated successfully!')
    close('submit')
  }
  catch (error: any) {
    console.error('Error updating contract registry:', error)
    if (error.response?.data?.errors)
      errors.value = error.response.data.errors
    else
      errors.value = { general: ['Error al actualizar el contrato. Inténtalo de nuevo.'] }
  }
  finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  close('cancel')
}

function debugForm() {
  console.log('=== EDIT FORM DEBUG ===')
  console.log('Form data:', form.value)
  console.log('Form valid:', isFormValid.value)
  console.log('Errors:', errors.value)
  console.log('Max amount:', form.value.maxAmount, 'Type:', typeof form.value.maxAmount)
  console.log('Charge frequency:', form.value.chargeFrequency, 'Type:', typeof form.value.chargeFrequency)
  console.log('======================')
}

// Formatear número de tarjeta
function formatCardNumber(value: string) {
  // Remover caracteres no numéricos
  const cleaned = value.replace(/\D/g, '')

  // Agregar espacios cada 4 dígitos
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function onCardNumberInput(event: Event) {
  const target = event.target as HTMLInputElement

  form.value.cardNumber = formatCardNumber(target.value)
}

// Formatear fecha de expiración (MM/YY)
function formatExpirationDate(value: string) {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length >= 2)
    return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`

  return cleaned
}

function onExpirationDateInput(event: Event) {
  const target = event.target as HTMLInputElement

  form.value.expirationDate = formatExpirationDate(target.value)
}

// Inicializar valores en mounted
onMounted(() => {
  console.log('=== EDIT FORM INITIALIZATION ===')
  console.log('Props item:', props.item)
  console.log('Max amount from props:', props.item.maxAmount, 'Type:', typeof props.item.maxAmount)
  console.log('Charge frequency from props:', props.item.chargeFrequency, 'Type:', typeof props.item.chargeFrequency)
  console.log('================================')
})

// Watch para detectar cambios en props
watch(() => props.item, newItem => {
  console.log('=== PROPS CHANGED ===')
  console.log('New item:', newItem)
  console.log('Max amount from new item:', newItem.maxAmount, 'Type:', typeof newItem.maxAmount)
  console.log('============================')
}, { deep: true })
</script>

<template>
  <DialogCloseBtn @click="close" />
  <VCard class="pa-sm-10 pa-2">
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ props.title || 'Editar Contrato' }}
      </h4>
    </VCardTitle>

    <VDivider />

    <VCardText>
      <!-- Mensaje informativo -->
      <VAlert
        type="info"
        variant="tonal"
        class="mb-6"
        closable
      >
        <VAlertTitle>Información</VAlertTitle>
        Los campos marcados con 🔒 (Número de Control, Número de Contrato y Fecha de Registro) no se pueden modificar una vez creado el contrato.
      </VAlert>

      <VForm @submit.prevent="handleSubmit">
        <VRow>
          <!-- Número de control -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              :model-value="form.controlNumber"
              :label="$t('paymentmandate.contractRegistry.control_number')"
              variant="outlined"
              readonly
              disabled
              prepend-inner-icon="tabler-lock"
            />
          </VCol>

          <!-- Número de contrato -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              :model-value="form.contractNumber"
              :label="$t('paymentmandate.contractRegistry.contract_number')"
              variant="outlined"
              readonly
              disabled
              prepend-inner-icon="tabler-lock"
            />
          </VCol>

          <!-- Nombre del titular -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="form.name"
              :label="$t('paymentmandate.contractRegistry.name')"
              :error-messages="errors.name"
              variant="outlined"
            />
          </VCol>

          <!-- Número de tarjeta -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              :model-value="form.cardNumber"
              :label="$t('paymentmandate.contractRegistry.card_number')"
              :error-messages="errors.cardNumber"
              variant="outlined"
              placeholder="1234 5678 9012 3456"
              maxlength="19"
              @input="onCardNumberInput"
            />
          </VCol>

          <!-- Monto máximo -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              :model-value="form.maxAmount"
              :label="$t('paymentmandate.contractRegistry.max_amount')"
              :error-messages="errors.maxAmount"
              type="number"
              step="0.01"
              min="0"
              variant="outlined"
              @input="(event: Event) => {
                const target = event.target as HTMLInputElement
                form.maxAmount = Number(target.value) || 0
              }"
            />
          </VCol>

          <!-- Fecha de expiración -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              :model-value="form.expirationDate"
              :label="$t('paymentmandate.contractRegistry.expiration_date')"
              :error-messages="errors.expirationDate"
              variant="outlined"
              placeholder="MM/YY"
              maxlength="5"
              @input="onExpirationDateInput"
            />
          </VCol>

          <!-- Banco -->
          <VCol
            cols="12"
            md="6"
          >
            <VAutocomplete
              v-model="form.bank"
              :label="$t('paymentmandate.contractRegistry.bank')"
              :items="bankOptions"
              :error-messages="errors.bank"
              variant="outlined"
              searchable
              :search="updateSearch"
              item-title="title"
              item-value="value"
            />
          </VCol>

          <!-- Tipo de cuenta -->
          <VCol
            cols="12"
            md="6"
          >
            <VAutocomplete
              v-model="form.accountType"
              :label="$t('paymentmandate.contractRegistry.account_type')"
              :items="accountTypeOptions"
              :error-messages="errors.accountType"
              variant="outlined"
              searchable
              :search="updateAccountTypeSearch"
              item-title="title"
              item-value="value"
            />
          </VCol>

          <!-- Fecha de registro -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              :model-value="form.registrationDate"
              :label="$t('paymentmandate.contractRegistry.registration_date')"
              variant="outlined"
              readonly
              disabled
              prepend-inner-icon="tabler-lock"
            />
          </VCol>

          <!-- Frecuencia de cobro -->
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              :model-value="form.chargeFrequency"
              :label="$t('paymentmandate.contractRegistry.charge_frequency')"
              :items="chargeFrequencyOptions"
              :error-messages="errors.chargeFrequency"
              variant="outlined"
              @update:model-value="(value: number) => {
                form.chargeFrequency = Number(value) || 30
              }"
            />
          </VCol>

          <!-- Teléfono -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="form.phone"
              :label="$t('paymentmandate.contractRegistry.phone')"
              :error-messages="errors.phone"
              variant="outlined"
            />
          </VCol>
        </VRow>
      </VForm>
    </VCardText>

    <VDivider />

    <VCardActions class="justify-end">
      <VBtn
        variant="tonal"
        color="secondary"
        @click="handleCancel"
      >
        {{ $t('cancel') }}
      </VBtn>
      <!--
        <VBtn
        color="info"
        variant="outlined"
        @click="debugForm"
        >
        Debug
        </VBtn>
      -->
      <VBtn
        type="submit"
        color="primary"
        variant="tonal"
        :loading="isSubmitting"
        :disabled="!isFormValid"
        @click="handleSubmit"
      >
        {{ $t('actualizar') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
