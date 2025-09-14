<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractRegistryStore } from '../stores/contractRegistryStore'
import type { ContractRegistryCreateRequest } from '../types/contractRegistry'
import { contractRegistryValidation } from '../validations/contractRegistryValidation'
import { useContractDataDialogStore } from '../stores/contractDataDialogStore'
import ContractDataDialog from './ContractDataDialog.vue'
import { useBanks } from '@/composables/useBanks'
import { useAccountTypes } from '@/composables/useAccountTypes'
import { useAppManager } from '@/composables/useAppManager'
import { useControlNumber } from '@/composables/useControlNumber'
import { useContractValidation } from '@/composables/useContractValidation'

// Props
const props = defineProps({
  title: {
    type: String,
    default: 'Agregar Contrato',
  },
})

// Emits
const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { closeDialog, openDialog } = useAppManager()
const contractRegistryStore = useContractRegistryStore()
const { bankOptions, updateSearch } = useBanks()
const { accountTypeOptions, updateSearch: updateAccountTypeSearch } = useAccountTypes()
const { getNextControlNumber, validateControlNumber, isLoading: isControlNumberLoading } = useControlNumber()
const { validateContractNumber: validateContract, isLoading: isContractValidating } = useContractValidation()

// Formulario reactivo
const form = ref<ContractRegistryCreateRequest>({
  controlNumber: 0,
  contractNumber: 0,
  name: '',
  cardNumber: '',
  maxAmount: 0,
  expirationDate: '',
  bank: '',
  accountType: '',
  registrationDate: new Date().toISOString().split('T')[0],
  chargeFrequency: 30,
  phone: '',
})

// Estado del formulario
const isSubmitting = ref(false)
const errors = ref<Record<string, string[]>>({})
const controlNumberValidation = ref<{ isValid: boolean; message: string } | null>(null)
const isControlNumberValidating = ref(false)
const contractNumberValidation = ref<{ isValid: boolean; message: string; contractData?: any } | null>(null)
const isContractNumberValidating = ref(false)

// Store para el diálogo de datos del contrato
const contractDataDialogStore = useContractDataDialogStore()

// Opciones para los selects

const chargeFrequencyOptions = [
  { title: '15 días', value: 15 },
  { title: '30 días', value: 30 },
  { title: '60 días', value: 60 },
  { title: '90 días', value: 90 },
]

// Computed para validación
const isFormValid = computed(() => {
  // Validación básica de campos requeridos
  const hasRequiredFields = !!(
    form.value.controlNumber
    && form.value.contractNumber
    && form.value.name
    && form.value.cardNumber
    && form.value.maxAmount
    && form.value.expirationDate
    && form.value.bank
    && form.value.accountType
    && form.value.registrationDate
    && form.value.chargeFrequency
    && form.value.phone
  )

  // Verificar que el número de control sea válido
  const isControlNumberValid = !controlNumberValidation.value || controlNumberValidation.value.isValid

  // Verificar que el número de contrato sea válido
  const isContractNumberValid = !contractNumberValidation.value || contractNumberValidation.value.isValid

  return hasRequiredFields && isControlNumberValid && isContractNumberValid
})

// Métodos
function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result)
}

async function handleSubmit() {
  console.log('=== SUBMIT DEBUG ===')
  console.log('Form data:', form.value)
  console.log('Form valid:', isFormValid.value)
  console.log('Control number validation:', controlNumberValidation.value)
  console.log('====================')

  if (!isFormValid.value) {
    console.log('Form is not valid, cannot submit')
    errors.value = { general: ['Por favor completa todos los campos requeridos'] }

    return
  }

  // Validar número de control una vez más antes de enviar
  if (form.value.controlNumber > 0) {
    console.log('Validating control number before submit...')
    await validateControlNumberInput()

    if (controlNumberValidation.value && !controlNumberValidation.value.isValid) {
      console.log('Control number is not valid, cannot submit')
      errors.value = { general: ['El número de control no está disponible'] }

      return
    }
  }

  // Validar número de contrato una vez más antes de enviar
  if (form.value.contractNumber > 0) {
    console.log('Validating contract number before submit...')
    await validateContractNumberInput()

    if (contractNumberValidation.value && !contractNumberValidation.value.isValid) {
      console.log('Contract number is not valid, cannot submit')
      errors.value = { general: ['El número de contrato no existe'] }

      return
    }
  }

  isSubmitting.value = true
  errors.value = {}

  try {
    console.log('Sending data to store...')
    await contractRegistryStore.createItem(form.value)
    console.log('Contract created successfully!')

    // Resetear el store del diálogo después de guardar exitosamente
    contractDataDialogStore.reset()

    close('submit')
  }
  catch (error: any) {
    console.error('Error creating contract registry:', error)
    if (error.response?.data?.errors)
      errors.value = error.response.data.errors
    else
      errors.value = { general: ['Error al crear el contrato. Inténtalo de nuevo.'] }
  }
  finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  close('cancel')
}

function debugForm() {
  console.log('=== FORM DEBUG ===')
  console.log('Form data:', form.value)
  console.log('Form valid:', isFormValid.value)
  console.log('Errors:', errors.value)
  console.log('Form keys:', Object.keys(form.value))
  console.log('Form values:', Object.values(form.value))
  console.log('==================')
}

// Cargar el siguiente número de control disponible
async function loadNextControlNumber() {
  console.log('Loading next control number...')

  try {
    const nextNumber = await getNextControlNumber()

    console.log('getNextControlNumber returned:', nextNumber)

    if (nextNumber && nextNumber > 0) {
      form.value.controlNumber = nextNumber
      console.log('Next control number loaded successfully:', nextNumber)
      console.log('Form controlNumber after assignment:', form.value.controlNumber)
    }
    else {
      console.log('No valid number returned from getNextControlNumber')
    }
  }
  catch (error) {
    console.error('Error in loadNextControlNumber:', error)
  }
}

// Validar número de control cuando el usuario lo cambie
async function validateControlNumberInput() {
  if (!form.value.controlNumber || form.value.controlNumber <= 0) {
    controlNumberValidation.value = null

    return
  }

  isControlNumberValidating.value = true
  controlNumberValidation.value = null

  try {
    const result = await validateControlNumber(form.value.controlNumber)

    controlNumberValidation.value = result

    if (!result.isValid) {
      // Si no es válido, limpiar el campo
      form.value.controlNumber = 0
    }
  }
  catch (error) {
    console.error('Error validating control number:', error)
    controlNumberValidation.value = {
      isValid: false,
      message: 'Error al validar el número de control',
    }
  }
  finally {
    isControlNumberValidating.value = false
  }
}

// Validar número de contrato cuando el usuario lo cambie
async function validateContractNumberInput() {
  if (!form.value.contractNumber || form.value.contractNumber <= 0) {
    contractNumberValidation.value = null

    // Resetear el store cuando se limpia el campo
    contractDataDialogStore.reset()

    return
  }

  isContractNumberValidating.value = true
  contractNumberValidation.value = null

  // Resetear el store antes de validar un nuevo contrato
  contractDataDialogStore.reset()

  try {
    const result = await validateContract(form.value.contractNumber)

    contractNumberValidation.value = result

    if (result.isValid && result.contractData) {
      // Si el contrato existe, mostrar diálogo de confirmación usando el store
      console.log('Contract found, showing confirmation dialog:', result.contractData)

      contractDataDialogStore.openDialog(result.contractData)
    }
    else if (!result.isValid) {
      // Si no es válido, limpiar el campo
      form.value.contractNumber = 0
    }
  }
  catch (error) {
    console.error('Error validating contract number:', error)
    contractNumberValidation.value = {
      isValid: false,
      message: 'Error al validar el número de contrato',
    }
  }
  finally {
    isContractNumberValidating.value = false
  }
}

// Manejar la decisión del usuario sobre los datos del contrato
function handleContractDataDecision(useContractData: boolean) {
  const appliedData = contractDataDialogStore.applyContractData(useContractData)

  if (appliedData) {
    // Pre-llenar campos con los datos del contrato
    if (appliedData.name)
      form.value.name = appliedData.name

    if (appliedData.phone)
      form.value.phone = appliedData.phone

    console.log('Contract data applied to form:', appliedData)
  }
  else {
    console.log('User chose not to use contract data')
  }

  // Cerrar el diálogo
  contractDataDialogStore.closeDialog()
}

function handleContractDataCancel() {
  console.log('User cancelled contract data dialog')
  contractDataDialogStore.closeDialog()
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

// Cargar el siguiente número de control al montar el componente
onMounted(() => {
  console.log('Component mounted, loading next control number...')

  // Resetear el store del diálogo al montar el componente
  contractDataDialogStore.reset()

  loadNextControlNumber()
})
</script>

<template>
  <DialogCloseBtn @click="close" />
  <VCard class="pa-sm-10 pa-2">
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ props.title }}
      </h4>
    </VCardTitle>

    <VDivider />

    <VCardText>
      <!-- Mostrar errores de validación generales -->
      <VAlert
        v-if="Object.keys(errors).length > 0"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        <h6 class="text-h6 mb-2">
          Por favor corrige los siguientes errores:
        </h6>
        <ul class="mb-0">
          <li
            v-for="(fieldErrors, field) in errors"
            :key="field"
          >
            <strong>{{ field }}:</strong> {{ fieldErrors.join(', ') }}
          </li>
        </ul>
      </VAlert>

      <VForm @submit.prevent="handleSubmit">
        <VRow>
          <!-- Número de control -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model.number="form.controlNumber"
              :label="$t('paymentmandate.contractRegistry.control_number')"
              :error-messages="errors.controlNumber"
              :loading="isControlNumberValidating"
              type="number"
              variant="outlined"
              required
              @blur="validateControlNumberInput"
            >
              <template #append-inner>
                <VTooltip
                  :text="$t('paymentmandate.contractRegistry.control_number_validation.get_next')"
                  location="top"
                >
                  <template #activator="{ props: tooltipProps }">
                    <VBtn
                      v-bind="tooltipProps"
                      icon
                      size="small"
                      variant="text"
                      :loading="isControlNumberLoading"
                      @click="loadNextControlNumber"
                    >
                      <VIcon>tabler-refresh</VIcon>
                    </VBtn>
                  </template>
                </VTooltip>
              </template>
            </VTextField>

            <!-- Mensaje de validación del número de control -->
            <VAlert
              v-if="controlNumberValidation"
              :type="controlNumberValidation.isValid ? 'success' : 'error'"
              variant="tonal"
              class="mt-2"
              density="compact"
            >
              {{ controlNumberValidation.message }}
            </VAlert>

            <!-- Mensaje de carga -->
            <VAlert
              v-if="isControlNumberValidating"
              type="info"
              variant="tonal"
              class="mt-2"
              density="compact"
            >
              {{ $t('paymentmandate.contractRegistry.control_number_validation.loading') }}
            </VAlert>
          </VCol>

          <!-- Número de contrato -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model.number="form.contractNumber"
              :label="$t('paymentmandate.contractRegistry.contract_number')"
              :error-messages="errors.contractNumber"
              :loading="isContractNumberValidating"
              type="number"
              variant="outlined"
              required
              @blur="validateContractNumberInput"
            />

            <!-- Mensaje de validación del número de contrato -->
            <VAlert
              v-if="contractNumberValidation"
              :type="contractNumberValidation.isValid ? 'success' : 'error'"
              variant="tonal"
              class="mt-2"
              density="compact"
            >
              {{ contractNumberValidation.message }}
            </VAlert>

            <!-- Mensaje de carga -->
            <VAlert
              v-if="isContractNumberValidating"
              type="info"
              variant="tonal"
              class="mt-2"
              density="compact"
            >
              {{ $t('paymentmandate.contractRegistry.contract_number_validation.loading') }}
            </VAlert>
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
              required
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
              v-model.number="form.maxAmount"
              :label="$t('paymentmandate.contractRegistry.max_amount')"
              :error-messages="errors.maxAmount"
              type="number"
              step="0.01"
              min="0"
              variant="outlined"
              required
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
              required
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
              required
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
              v-model="form.registrationDate"
              :label="$t('paymentmandate.contractRegistry.registration_date')"
              :error-messages="errors.registrationDate"
              type="date"
              variant="outlined"
              required
            />
          </VCol>

          <!-- Frecuencia de cobro -->
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model.number="form.chargeFrequency"
              :label="$t('paymentmandate.contractRegistry.charge_frequency')"
              :items="chargeFrequencyOptions"
              :error-messages="errors.chargeFrequency"
              variant="outlined"
              required
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
              required
            />
          </VCol>
        </VRow>
      </VForm>
    </VCardText>

    <VDivider />

    <VCardActions class="justify-end">
      <VBtn
        variant="outlined"
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
        <VBtn
        color="warning"
        variant="outlined"
        @click="loadNextControlNumber"
        >
        Load Next Number
        </VBtn>
      -->
      <VBtn
        color="primary"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        {{ $t('save') }}
      </VBtn>
    </VCardActions>
  </VCard>

  <!-- Diálogo local para datos del contrato -->
  <VDialog
    v-model="contractDataDialogStore.isOpen"
    max-width="600"
    persistent
  >
    <ContractDataDialog
      v-if="contractDataDialogStore.contractData"
      :contract-data="contractDataDialogStore.contractData"
      @confirm="handleContractDataDecision"
      @cancel="handleContractDataCancel"
    />
  </VDialog>
</template>
