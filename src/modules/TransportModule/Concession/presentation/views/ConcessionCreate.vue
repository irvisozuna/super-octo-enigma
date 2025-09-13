<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConcessionStore } from '../stores/concessionStore'
import { useConcessionHolderStore } from '../../../ConcessionHolder/presentation/stores/concessionholderStore'
import type { ConcessionCreateDto } from '../../application/dtos/ConcessionDtos'
import ConcessionHolderCreateDialogMolecule from '../../../ConcessionHolder/presentation/components/molecules/ConcessionHolderCreateDialogMolecule.vue'
import { useGlobalSnackbar } from '@/composables/useGlobalSnackbar'
import { useAppManager } from '@/composables/useAppManager'

// Router and i18n
const router = useRouter()
const { t } = useI18n()
const { openDialog } = useAppManager()
const { showSnackbar } = useGlobalSnackbar()

// Stores
const concessionStore = useConcessionStore()
const concessionHolderStore = useConcessionHolderStore()

// Form data
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const loadingHolders = ref(false)
const successDialog = ref(false)

const form = ref<ConcessionCreateDto>({
  number: '',
  modality: '',
  municipality: '',
  valid_from: new Date().toISOString().split('T')[0], // Today's date
  valid_to: '',
  concession_type: undefined,
  service_area: '',
  route_description: '',
  holder_id: '',
  issue_date: new Date().toISOString().split('T')[0],
  expiry_date: '',
  fee_amount: 0,
  terms_conditions: '',
  notes: '',
})

// Fecha máxima de validez (5 años desde hoy)
const maxValidityDate = computed(() => {
  const maxDate = new Date()

  maxDate.setFullYear(maxDate.getFullYear() + 5)

  return maxDate.toISOString().split('T')[0]
})

// Options
const concessionTypes = computed(() => [
  { title: t('TransportModule.concession.types.taxi'), value: 'TAXI' },
  { title: t('TransportModule.concession.types.bus'), value: 'BUS' },
  { title: t('TransportModule.concession.types.microbus'), value: 'MICROBUS' },
  { title: t('TransportModule.concession.types.truck'), value: 'TRUCK' },
])

// Computed
const concessionHolders = computed(() =>
  concessionHolderStore.items.map(holder => ({
    ...holder,
    display_name: `${holder.fullName} (${holder.holderType})`,
    full_name: holder.fullName,
    holder_type: holder.holderType,
    identification_number: holder.identificationNumber,
    id: holder.id,
  })),
)

// Validación completa del formulario
const isFormValid = computed(() => {
  return !!(
    form.value.number
    && form.value.holder_id
    && form.value.concession_type
    && form.value.modality
    && form.value.municipality
    && form.value.service_area
    && form.value.issue_date
    && form.value.expiry_date
    && form.value.valid_from
    && form.value.valid_to
    && form.value.fee_amount !== null
    && form.value.fee_amount >= 0
  )
})

// Methods
const submitForm = async () => {
  if (!formRef.value?.validate())
    return

  loading.value = true
  try {
    await concessionStore.createItem(form.value)

    // Show success notification
    showSnackbar({
      title: t('common.success'),
      messageKey: 'concession.messages.created_successfully',
      color: 'success',
      timeout: 4000,
    })

    successDialog.value = true
  }
  catch (error: any) {
    console.error('Error creating concession:', error)

    // Show error notification
    let errorMessage = t('common.error_occurred')

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
      title: t('common.error'),
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
  router.push({ name: 'concessionsList' })
}

const createAnother = () => {
  successDialog.value = false

  // Reset form
  form.value = {
    number: '',
    modality: '',
    municipality: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    concession_type: undefined,
    service_area: '',
    route_description: '',
    holder_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    fee_amount: 0,
    terms_conditions: '',
    notes: '',
  }
  formRef.value?.resetValidation()
}

// Dialog for creating new concession holder
const openCreateHolderDialog = () => {
  openDialog(
    ConcessionHolderCreateDialogMolecule,
    { title: t('TransportModule.concession_holder.actions.create_holder') },
    { width: '800px', persistent: true },
  ).then(result => {
    if (result === 'submit') {
      // Refresh the holders list and select the new holder
      concessionHolderStore.fetchList().then(() => {
        // Find the newly created holder (assume it's the last one)
        const newHolder = concessionHolderStore.items[concessionHolderStore.items.length - 1]
        if (newHolder)
          form.value.holder_id = newHolder.id
      })
    }
  })
}

// Set default expiry date to 1 year from issue date
const updateExpiryDate = () => {
  if (form.value.issue_date) {
    const issueDate = new Date(form.value.issue_date)
    const expiryDate = new Date(issueDate)

    expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    form.value.expiry_date = expiryDate.toISOString().split('T')[0]
  }
}

// Set valid_to based on valid_from
const updateValidTo = () => {
  if (form.value.valid_from) {
    const validFrom = new Date(form.value.valid_from)
    const validTo = new Date(validFrom)

    validTo.setFullYear(validTo.getFullYear() + 1)
    form.value.valid_to = validTo.toISOString().split('T')[0]
  }
}

// Auto-generate concession number
const generateConcessionNumber = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)

  form.value.number = `CON-${year}${month}${day}-${timestamp}`
}

// Generar número automáticamente al cargar
onMounted(() => {
  generateConcessionNumber()
})

// Watch issue date changes
watch(() => form.value.issue_date, updateExpiryDate)
watch(() => form.value.valid_from, updateValidTo)

// Lifecycle
onMounted(async () => {
  loadingHolders.value = true
  try {
    await concessionHolderStore.fetchList()
  }
  catch (error) {
    console.error('Error loading concession holders:', error)
  }
  finally {
    loadingHolders.value = false
  }

  // Set default expiry date
  updateExpiryDate()
})
</script>

<template>
  <div class="concession-create">
    <VContainer>
      <!-- Header permanece igual -->

      <VRow>
        <VCol cols="12">
          <!-- PASO 1: TITULAR DE LA CONCESIÓN -->
          <VCard class="mb-6">
            <VCardTitle>
              <div class="d-flex align-center">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="32"
                  class="me-2"
                >
                  <span class="text-caption font-weight-bold">1</span>
                </VAvatar>
                <div>
                  <div class="text-h6">
                    {{ t('TransportModule.concession.sections.holder_info') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Selecciona o crea el titular de la concesión
                  </div>
                </div>
              </div>
            </VCardTitle>
            <VCardText>
              <VRow>
                <VCol cols="12">
                  <div class="d-flex gap-2 align-end">
                    <VAutocomplete
                      v-model="form.holder_id"
                      :label="`${t('TransportModule.concession.fields.holder')} *`"
                      :items="concessionHolders"
                      item-title="display_name"
                      item-value="id"
                      :loading="loadingHolders"
                      :rules="[v => !!v || t('validation.required')]"
                      placeholder="Buscar titular existente..."
                      clearable
                      required
                      class="flex-grow-1"
                      prepend-inner-icon="tabler-user-search"
                    >
                      <template #item="{ props, item }">
                        <VListItem v-bind="props">
                          <template #prepend>
                            <VAvatar
                              size="40"
                              color="primary"
                              variant="tonal"
                            >
                              <VIcon>tabler-user</VIcon>
                            </VAvatar>
                          </template>
                          <VListItemTitle>{{ item.raw.full_name }}</VListItemTitle>
                          <VListItemSubtitle>
                            {{ item.raw.holder_type }} • RFC/CURP: {{ item.raw.identification_number }}
                          </VListItemSubtitle>
                        </VListItem>
                      </template>
                    </VAutocomplete>

                    <VBtn
                      color="primary"
                      variant="tonal"
                      size="large"
                      @click="openCreateHolderDialog"
                    >
                      <VIcon start>
                        tabler-user-plus
                      </VIcon>
                      Nuevo
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- PASO 2: INFORMACIÓN BÁSICA -->
          <VCard class="mb-6">
            <VCardTitle>
              <div class="d-flex align-center">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="32"
                  class="me-2"
                >
                  <span class="text-caption font-weight-bold">2</span>
                </VAvatar>
                <div>
                  <div class="text-h6">
                    {{ t('TransportModule.concession.sections.basic_info') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Datos generales de la concesión
                  </div>
                </div>
              </div>
            </VCardTitle>
            <VCardText>
              <VRow>
                <!-- Número de Concesión (generado automáticamente) -->
                <VCol
                  cols="12"
                  md="4"
                >
                  <VTextField
                    v-model="form.number"
                    :label="`${t('TransportModule.concession.fields.number')} *`"
                    :rules="[v => !!v || t('validation.required')]"
                    required
                    readonly
                    prepend-inner-icon="tabler-certificate"
                    variant="outlined"
                    color="primary"
                  >
                    <template #append-inner>
                      <VTooltip text="Regenerar número">
                        <template #activator="{ props }">
                          <VBtn
                            v-bind="props"
                            icon="tabler-refresh"
                            variant="text"
                            size="small"
                            @click="generateConcessionNumber"
                          />
                        </template>
                      </VTooltip>
                    </template>
                  </VTextField>
                </VCol>

                <!-- Tipo de Concesión -->
                <VCol
                  cols="12"
                  md="4"
                >
                  <VSelect
                    v-model="form.concession_type"
                    :label="`${t('TransportModule.concession.fields.concession_type')} *`"
                    :items="concessionTypes"
                    :rules="[v => !!v || t('validation.required')]"
                    required
                    prepend-inner-icon="tabler-car"
                  />
                </VCol>

                <!-- Modalidad -->
                <VCol
                  cols="12"
                  md="4"
                >
                  <VTextField
                    v-model="form.modality"
                    :label="`${t('TransportModule.concession.fields.modality')} *`"
                    :rules="[v => !!v || t('validation.required')]"
                    required
                    prepend-inner-icon="tabler-route"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- PASO 3: UBICACIÓN Y SERVICIO -->
          <VCard class="mb-6">
            <VCardTitle>
              <div class="d-flex align-center">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="32"
                  class="me-2"
                >
                  <span class="text-caption font-weight-bold">3</span>
                </VAvatar>
                <div>
                  <div class="text-h6">
                    {{ t('TransportModule.concession.sections.location_service') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Área de operación y descripción del servicio
                  </div>
                </div>
              </div>
            </VCardTitle>
            <VCardText>
              <VRow>
                <!-- Municipio -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.municipality"
                    :label="`${t('TransportModule.concession.fields.municipality')} *`"
                    :rules="[v => !!v || t('validation.required')]"
                    required
                    prepend-inner-icon="tabler-map-pin"
                  />
                </VCol>

                <!-- Área de Servicio -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.service_area"
                    :label="`${t('TransportModule.concession.fields.service_area')} *`"
                    :rules="[v => !!v || t('validation.required')]"
                    required
                    prepend-inner-icon="tabler-map-2"
                  />
                </VCol>

                <!-- Descripción de Ruta -->
                <VCol cols="12">
                  <VTextarea
                    v-model="form.route_description"
                    :label="t('TransportModule.concession.fields.route_description')"
                    rows="2"
                    auto-grow
                    :placeholder="t('TransportModule.concession.placeholders.route_description')"
                    prepend-inner-icon="tabler-route-2"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- PASO 4: VIGENCIA Y FECHAS -->
          <VCard class="mb-6">
            <VCardTitle>
              <div class="d-flex align-center">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="32"
                  class="me-2"
                >
                  <span class="text-caption font-weight-bold">4</span>
                </VAvatar>
                <div>
                  <div class="text-h6">
                    {{ t('TransportModule.concession.sections.validity') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Fechas de emisión y vigencia
                  </div>
                </div>
              </div>
            </VCardTitle>
            <VCardText>
              <VRow>
                <!-- Fechas de Emisión y Expiración -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.issue_date"
                    :label="`${t('TransportModule.concession.fields.issue_date')} *`"
                    type="date"
                    :min="new Date().toISOString().split('T')[0]"
                    :rules="[v => !!v || t('validation.required')]"
                    required
                    prepend-inner-icon="tabler-calendar-event"
                    variant="outlined"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.expiry_date"
                    :label="`${t('TransportModule.concession.fields.expiry_date')} *`"
                    type="date"
                    :min="form.issue_date || new Date().toISOString().split('T')[0]"
                    :max="maxValidityDate"
                    :rules="[
                      v => !!v || t('validation.required'),
                      v => !form.issue_date || new Date(v) > new Date(form.issue_date) || 'Debe ser posterior a la fecha de emisión',
                    ]"
                    required
                    prepend-inner-icon="tabler-calendar-due"
                    variant="outlined"
                  />
                </VCol>

                <!-- Periodo de Validez -->
                <VCol cols="12">
                  <VDivider class="my-3" />
                  <div class="text-subtitle-2 text-medium-emphasis mb-3">
                    Periodo de validez operativa
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.valid_from"
                    :label="`${t('TransportModule.concession.fields.valid_from')} *`"
                    type="date"
                    :min="new Date().toISOString().split('T')[0]"
                    :rules="[v => !!v || t('validation.required')]"
                    required
                    prepend-inner-icon="tabler-calendar-plus"
                    variant="outlined"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.valid_to"
                    :label="`${t('TransportModule.concession.fields.valid_to')} *`"
                    type="date"
                    :min="form.valid_from || new Date().toISOString().split('T')[0]"
                    :max="maxValidityDate"
                    :rules="[
                      v => !!v || t('validation.required'),
                      v => !form.valid_from || new Date(v) > new Date(form.valid_from) || 'Debe ser posterior a la fecha inicial',
                    ]"
                    required
                    prepend-inner-icon="tabler-calendar-minus"
                    variant="outlined"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- PASO 5: TÉRMINOS Y COSTOS -->
          <VCard class="mb-6">
            <VCardTitle>
              <div class="d-flex align-center">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="32"
                  class="me-2"
                >
                  <span class="text-caption font-weight-bold">5</span>
                </VAvatar>
                <div>
                  <div class="text-h6">
                    {{ t('TransportModule.concession.sections.terms_costs') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Información financiera y condiciones
                  </div>
                </div>
              </div>
            </VCardTitle>
            <VCardText>
              <VRow>
                <!-- Monto de la Tarifa -->
                <VCol
                  cols="12"
                  md="4"
                >
                  <VTextField
                    v-model.number="form.fee_amount"
                    :label="`${t('TransportModule.concession.fields.fee_amount')} *`"
                    type="number"
                    prefix="$"
                    step="0.01"
                    :rules="[
                      v => v !== null && v !== undefined && v !== '' || t('validation.required'),
                      v => v >= 0 || 'El monto debe ser positivo',
                    ]"
                    required
                    prepend-inner-icon="tabler-currency-dollar"
                  />
                </VCol>

                <!-- Términos y Condiciones -->
                <VCol cols="12">
                  <VTextarea
                    v-model="form.terms_conditions"
                    :label="t('TransportModule.concession.fields.terms_conditions')"
                    rows="3"
                    auto-grow
                    :placeholder="t('TransportModule.concession.placeholders.terms_conditions')"
                    prepend-inner-icon="tabler-file-text"
                  />
                </VCol>

                <!-- Notas Adicionales -->
                <VCol cols="12">
                  <VTextarea
                    v-model="form.notes"
                    :label="t('TransportModule.concession.fields.notes')"
                    rows="2"
                    auto-grow
                    :placeholder="t('TransportModule.concession.placeholders.notes')"
                    prepend-inner-icon="tabler-notes"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- BOTONES DE ACCIÓN -->
          <VCard>
            <VCardActions class="pa-4">
              <VBtn
                variant="text"
                :to="{ name: 'concessionsList' }"
                size="large"
              >
                <VIcon start>
                  tabler-x
                </VIcon>
                Cancelar
              </VBtn>

              <VSpacer />

              <VBtn
                variant="tonal"
                color="primary"
                size="large"
                @click="formRef?.reset()"
              >
                <VIcon start>
                  tabler-refresh
                </VIcon>
                Limpiar
              </VBtn>

              <VBtn
                type="submit"
                color="primary"
                :loading="loading"
                :disabled="!isFormValid"
                size="large"
                @click="submitForm"
              >
                <VIcon start>
                  tabler-check
                </VIcon>
                Crear Concesión
              </VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Success Dialog permanece igual -->
  </div>
</template>

<style scoped>
.concession-create {
  padding: 20px;
  background-color: #f5f5f5;
}

/* Mejoras visuales */
:deep(.v-card) {
  border-radius: 12px !important;
}

:deep(.v-card-title) {
  padding-block: 20px 16px;
  padding-inline: 24px;
}

:deep(.v-card-text) {
  padding-block: 0 24px;
  padding-inline: 24px;
}

/* Indicador de progreso opcional */
.step-indicator {
  position: sticky;
  z-index: 10;
  padding: 16px;
  border-radius: 12px;
  background: white;
  inset-block-start: 64px;
  margin-block-end: 24px;
}
</style>
