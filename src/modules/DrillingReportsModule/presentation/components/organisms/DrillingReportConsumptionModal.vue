<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CONSUMABLE_TYPES, SHIFTS, UNITS } from '../../shared/constants/DrillingConstants'

// Props
interface Props {
  modelValue: boolean
  consumption?: any
  reportId: string
}

const props = withDefaults(defineProps<Props>(), {
  consumption: null,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

// State
const formRef = ref()
const formValid = ref(false)
const saving = ref(false)

const formData = ref({
  consumable_type: '',
  shift: 'day',
  quantity: null,
  unit: '',
})

const errors = ref({})

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.consumption)

const consumableTypes = computed(() => CONSUMABLE_TYPES)
const units = computed(() => UNITS)
const shifts = computed(() => SHIFTS)

const canChangeShift = computed(() => {
  // TODO: Implement logic based on report shift
  return true
})

const quantityHint = computed(() => {
  if (formData.value.quantity) {
    const quantity = Number.parseFloat(formData.value.quantity)
    if (quantity > 1000)
      return '⚠️ Cantidad muy alta'
    else if (quantity < 1)
      return 'ℹ️ Cantidad mínima recomendada'
  }

  return ''
})

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
  quantity: (value: any) => {
    if (!value)
      return 'La cantidad es requerida'
    const quantity = Number.parseFloat(value)
    if (quantity < 0.01)
      return 'Mínimo 0.01'
    if (quantity > 999999)
      return 'Máximo 999,999'

    return true
  },
}

// Methods
const closeModal = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    consumable_type: '',
    shift: 'day',
    quantity: null,
    unit: '',
  }
  errors.value = {}
}

const loadConsumptionData = () => {
  if (props.consumption) {
    formData.value = {
      consumable_type: props.consumption.consumable_type || '',
      shift: props.consumption.shift || 'day',
      quantity: props.consumption.quantity || null,
      unit: props.consumption.unit || '',
    }
  }
}

const onConsumableTypeChange = (consumableType: string) => {
  const selectedType = CONSUMABLE_TYPES.find(type => type.value === consumableType)
  if (selectedType)
    formData.value.unit = selectedType.defaultUnit
}

const saveConsumption = async () => {
  if (!formValid.value)
    return

  saving.value = true
  try {
    // TODO: Implement save consumption
    console.log('Saving consumption:', {
      reportId: props.reportId,
      consumption: formData.value,
      isEditing: isEditing.value,
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Show success message
    // TODO: Show success notification

    emit('saved')
    closeModal()
  }
  catch (error) {
    console.error('Error saving consumption:', error)

    // TODO: Show error notification
  }
  finally {
    saving.value = false
  }
}

// Watchers
watch(() => props.modelValue, newValue => {
  if (newValue)
    loadConsumptionData()
})

watch(() => props.consumption, newConsumption => {
  if (newConsumption)
    loadConsumptionData()
})

watch(() => formData.value.quantity, newValue => {
  if (newValue) {
    const quantity = Number.parseFloat(newValue)
    if (quantity > 999999)
      formData.value.quantity = 999999
    else if (quantity < 0.01)
      formData.value.quantity = 0.01
  }
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="500px"
    persistent
  >
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-package-variant"
          class="me-2"
        />
        {{ isEditing ? 'Editar Consumo' : 'Registrar Consumo' }}
      </VCardTitle>

      <VCardText>
        <VForm
          ref="formRef"
          v-model="formValid"
          @submit.prevent="saveConsumption"
        >
          <VRow>
            <VCol cols="12">
              <VSelect
                v-model="formData.consumable_type"
                :items="consumableTypes"
                item-title="label"
                item-value="value"
                label="Tipo de Consumible *"
                :rules="[rules.required]"
                :error-messages="errors.consumable_type"
                @update:model-value="onConsumableTypeChange"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.shift"
                :items="shifts"
                item-title="label"
                item-value="value"
                label="Turno *"
                :rules="[rules.required]"
                :error-messages="errors.shift"
                :disabled="!canChangeShift"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.quantity"
                type="number"
                step="0.01"
                min="0.01"
                label="Cantidad *"
                :rules="[rules.required, rules.quantity]"
                :error-messages="errors.quantity"
                :hint="quantityHint"
                persistent-hint
              />
            </VCol>
            <VCol cols="12">
              <VSelect
                v-model="formData.unit"
                :items="units"
                item-title="label"
                item-value="value"
                label="Unidad *"
                :rules="[rules.required]"
                :error-messages="errors.unit"
              />
            </VCol>
          </VRow>
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
          :loading="saving"
          :disabled="!formValid"
          @click="saveConsumption"
        >
          <VIcon
            icon="mdi-content-save"
            class="me-2"
          />
          {{ isEditing ? 'Actualizar' : 'Registrar' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-dialog {
  max-inline-size: 500px;
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
