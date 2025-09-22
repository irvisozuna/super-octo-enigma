<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from '../../stores/vehicleStore'
import type { DriverCreateDto, VehicleCreateDto } from '../../application/dtos/VehicleDtos'

interface Props {
  modelValue: boolean
  concessionId?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const vehicleStore = useVehicleStore()

// Form refs
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)

// Dialog state
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Include driver switch
const includeDriver = ref(false)

// Vehicle form
const form = ref<VehicleCreateDto>({
  plate_number: '',
  vin: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  color: '',
  vehicle_type: 'AUTO',
  capacity: 1,
  status: 'ACTIVE', // Siempre activo por defecto
  registration_date: new Date().toISOString().split('T')[0],
  concession_id: props.concessionId,
})

// Driver form
const driverForm = ref<DriverCreateDto>({
  first_name: '',
  last_name: '',
  birth_date: '',
  license_number: '',
  license_type: 'D',
  license_issue_date: '',
  license_expiration_date: '',
  license_issuing_state: '',
  vehicle_id: '',
  concession_id: props.concessionId,
})

// Options
const vehicleTypeOptions = [
  { title: t('TransportModule.vehicle.types.auto'), value: 'AUTO' },
  { title: t('TransportModule.vehicle.types.bus'), value: 'BUS' },
  { title: t('TransportModule.vehicle.types.taxi'), value: 'TAXI' },
  { title: t('TransportModule.vehicle.types.microbus'), value: 'MICROBUS' },
  { title: t('TransportModule.vehicle.types.truck'), value: 'TRUCK' },
  { title: t('TransportModule.vehicle.types.van'), value: 'VAN' },
  { title: t('TransportModule.vehicle.types.motorcycle'), value: 'MOTORCYCLE' },
  { title: t('TransportModule.vehicle.types.other'), value: 'OTHER' },
]

const statusOptions = [
  { title: t('TransportModule.vehicle.status.active'), value: 'ACTIVE' },
  { title: t('TransportModule.vehicle.status.inactive'), value: 'INACTIVE' },
  { title: t('TransportModule.vehicle.status.maintenance'), value: 'MAINTENANCE' },
  { title: t('TransportModule.vehicle.status.retired'), value: 'RETIRED' },
]

const licenseTypeOptions = [
  { title: t('TransportModule.driver.license_types.a'), value: 'A' },
  { title: t('TransportModule.driver.license_types.b'), value: 'B' },
  { title: t('TransportModule.driver.license_types.c'), value: 'C' },
  { title: t('TransportModule.driver.license_types.d'), value: 'D' },
]

// Methods
const closeDialog = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    plate_number: '',
    vin: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vehicle_type: 'BUS',
    capacity: 1,
    status: 'ACTIVE', // Siempre activo por defecto
    registration_date: new Date().toISOString().split('T')[0],
    concession_id: props.concessionId,
  }

  driverForm.value = {
    first_name: '',
    last_name: '',
    birth_date: '',
    license_number: '',
    license_type: 'D',
    license_issue_date: '',
    license_expiration_date: '',
    license_issuing_state: '',
    vehicle_id: '',
    concession_id: props.concessionId,
  }

  includeDriver.value = false
  formRef.value?.resetValidation()
}

const submitForm = async () => {
  if (!formRef.value)
    return

  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  loading.value = true

  try {
    // Prepare vehicle data
    const vehicleData: VehicleCreateDto = {
      ...form.value,
      concession_id: props.concessionId,
    }

    // Include driver if selected
    if (includeDriver.value)
      vehicleData.drivers = [driverForm.value]

    await vehicleStore.createItem(vehicleData)

    emit('success')
    closeDialog()
  }
  catch (error) {
    console.error('Error creating vehicle:', error)
  }
  finally {
    loading.value = false
  }
}

// Watch for dialog changes
watch(dialog, newValue => {
  if (newValue) {
    form.value.concession_id = props.concessionId
    driverForm.value.concession_id = props.concessionId
  }
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="800"
    persistent
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon class="me-2">
          tabler-car-plus
        </VIcon>
        {{ t('TransportModule.vehicle.actions.create_vehicle') }}
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-6">
        <VForm
          ref="formRef"
          v-model="formValid"
          @submit.prevent="submitForm"
        >
          <VRow>
            <!-- Información del Vehículo -->
            <VCol cols="12">
              <h6 class="text-h6 mb-4">
                {{ t('TransportModule.vehicle.sections.vehicle_info') }}
              </h6>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.plate_number"
                :label="`${t('TransportModule.vehicle.fields.plate_number')} *`"
                :rules="[
                  v => !!v || t('validation.required'),
                  v => /^[A-Z]{3}-[0-9]{3}$/.test(v) || t('TransportModule.vehicle.validation.plate_format'),
                ]"
                required
                prepend-inner-icon="tabler-car"
                placeholder="ABC-123"
                hint="Formato: ABC-123 (3 letras, guión, 3 números)"
                persistent-hint
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.vin"
                :label="`${t('TransportModule.vehicle.fields.vin')} *`"
                :rules="[
                  v => !!v || t('validation.required'),
                  v => /^[A-HJ-NPR-Z0-9]{17}$/.test(v) || t('TransportModule.vehicle.validation.vin_format'),
                ]"
                required
                prepend-inner-icon="tabler-barcode"
                placeholder="1HGBH41JXMN109186"
                hint="Formato: 17 caracteres alfanuméricos (sin I, O, Q)"
                persistent-hint
                maxlength="17"
              />
            </VCol>

            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.brand"
                :label="`${t('TransportModule.vehicle.fields.brand')} *`"
                :rules="[v => !!v || t('validation.required')]"
                required
                prepend-inner-icon="tabler-brand-apple"
              />
            </VCol>

            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="form.model"
                :label="`${t('TransportModule.vehicle.fields.model')} *`"
                :rules="[v => !!v || t('validation.required')]"
                required
                prepend-inner-icon="tabler-car"
              />
            </VCol>

            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model.number="form.year"
                :label="`${t('TransportModule.vehicle.fields.year')} *`"
                type="number"
                :rules="[
                  v => !!v || t('validation.required'),
                  v => v >= 1900 || t('validation.min_value', { min: 1900 }),
                  v => v <= new Date().getFullYear() + 1 || t('validation.max_value', { max: new Date().getFullYear() + 1 }),
                  v => Number.isInteger(v) || t('validation.integer_required'),
                ]"
                required
                prepend-inner-icon="tabler-calendar"
                :min="1900"
                :max="new Date().getFullYear() + 1"
                :hint="t('TransportModule.vehicle.hints.year_range', { min: 1900, max: new Date().getFullYear() + 1 })"
                persistent-hint
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.color"
                :label="`${t('TransportModule.vehicle.fields.color')} *`"
                :rules="[v => !!v || t('validation.required')]"
                required
                prepend-inner-icon="tabler-palette"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="form.vehicle_type"
                :label="`${t('TransportModule.vehicle.fields.vehicle_type')} *`"
                :items="vehicleTypeOptions"
                :rules="[v => !!v || t('validation.required')]"
                required
                prepend-inner-icon="tabler-car"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="form.capacity"
                :label="`${t('TransportModule.vehicle.fields.capacity')} *`"
                type="number"
                :rules="[
                  v => !!v || t('validation.required'),
                  v => v > 0 || t('validation.min_value', { min: 1 }),
                  v => v <= 100 || t('validation.max_value', { max: 100 }),
                  v => Number.isInteger(v) || t('validation.integer_required'),
                ]"
                required
                prepend-inner-icon="tabler-users"
                :min="1"
                :max="100"
                :hint="t('TransportModule.vehicle.hints.capacity_range')"
                persistent-hint
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="form.status"
                :label="`${t('TransportModule.vehicle.fields.status')} *`"
                :items="statusOptions"
                :rules="[v => !!v || t('validation.required')]"
                required
                prepend-inner-icon="tabler-info-circle"
                readonly
                :hint="t('TransportModule.vehicle.hints.status_default')"
                persistent-hint
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.registration_date"
                :label="`${t('TransportModule.vehicle.fields.registration_date')} *`"
                type="date"
                :rules="[v => !!v || t('validation.required')]"
                required
                prepend-inner-icon="tabler-calendar-event"
              />
            </VCol>

            <!-- Información del Conductor (Opcional) -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <div class="d-flex align-center justify-space-between mb-4">
                <h6 class="text-h6">
                  {{ t('TransportModule.driver.sections.driver_info') }} ({{ t('common.optional') }})
                </h6>
                <VSwitch
                  v-model="includeDriver"
                  :label="t('TransportModule.vehicle.actions.include_driver')"
                  color="primary"
                />
              </div>
            </VCol>

            <template v-if="includeDriver">
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="driverForm.first_name"
                  :label="`${t('TransportModule.driver.fields.first_name')} *`"
                  :rules="includeDriver ? [v => !!v || t('validation.required')] : []"
                  :required="includeDriver"
                  prepend-inner-icon="tabler-user"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="driverForm.last_name"
                  :label="`${t('TransportModule.driver.fields.last_name')} *`"
                  :rules="includeDriver ? [v => !!v || t('validation.required')] : []"
                  :required="includeDriver"
                  prepend-inner-icon="tabler-user"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="driverForm.birth_date"
                  :label="`${t('TransportModule.driver.fields.birth_date')} *`"
                  type="date"
                  :rules="includeDriver ? [v => !!v || t('validation.required')] : []"
                  :required="includeDriver"
                  prepend-inner-icon="tabler-calendar"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="driverForm.license_number"
                  :label="`${t('TransportModule.driver.fields.license_number')} *`"
                  :rules="includeDriver ? [
                    v => !!v || t('validation.required'),
                    v => /^[A-Z0-9]{6,12}$/.test(v) || t('TransportModule.driver.validation.license_format'),
                  ] : []"
                  :required="includeDriver"
                  prepend-inner-icon="tabler-id"
                  placeholder="LIC123456"
                  :hint="t('TransportModule.driver.hints.license_format')"
                  persistent-hint
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="driverForm.license_type"
                  :label="`${t('TransportModule.driver.fields.license_type')} *`"
                  :items="licenseTypeOptions"
                  :rules="includeDriver ? [v => !!v || t('validation.required')] : []"
                  :required="includeDriver"
                  prepend-inner-icon="tabler-id"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="driverForm.license_issuing_state"
                  :label="`${t('TransportModule.driver.fields.license_issuing_state')} *`"
                  :rules="includeDriver ? [
                    v => !!v || t('validation.required'),
                    v => /^[A-Za-z\s]{2,30}$/.test(v) || t('TransportModule.driver.validation.state_format'),
                  ] : []"
                  :required="includeDriver"
                  prepend-inner-icon="tabler-map-pin"
                  placeholder="Sonora"
                  :hint="t('TransportModule.driver.hints.state_format')"
                  persistent-hint
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="driverForm.license_issue_date"
                  :label="`${t('TransportModule.driver.fields.license_issue_date')} *`"
                  type="date"
                  :rules="includeDriver ? [v => !!v || t('validation.required')] : []"
                  :required="includeDriver"
                  prepend-inner-icon="tabler-calendar-event"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="driverForm.license_expiration_date"
                  :label="`${t('TransportModule.driver.fields.license_expiration_date')} *`"
                  type="date"
                  :rules="includeDriver ? [v => !!v || t('validation.required')] : []"
                  :required="includeDriver"
                  prepend-inner-icon="tabler-calendar-due"
                />
              </VCol>
            </template>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions class="justify-end pa-6 pt-0">
        <VBtn
          variant="outlined"
          :disabled="loading"
          @click="closeDialog"
        >
          {{ t('common.cancel') }}
        </VBtn>

        <VBtn
          color="primary"
          :loading="loading"
          :disabled="!formValid"
          @click="submitForm"
        >
          <VIcon start>
            tabler-check
          </VIcon>
          {{ t('common.create') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
