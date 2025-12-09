<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import * as yup from 'yup'
import { type CreateEquipmentDto, type UpdateEquipmentDto, useEquipmentStore } from '../stores/equipmentStore'
import {
  equipmentValidationSchema,
  validateEquipmentData,
} from '../schemas'
import { EQUIPMENT_TYPES } from '../../shared/constants/EquipmentConstants'
import { useAppManager } from '@/composables/useAppManager'
import { useNotification } from '@/helpers/notificationHelper'
import { useErrorTranslation } from '@/helpers/errorTranslationHelper'

// Props
interface Props {
  equipment?: any
  isEditing?: boolean
  showCloseButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  equipment: null,
  isEditing: false,
  showCloseButton: true,
})

// Emits
const emit = defineEmits<{
  submit: []
  cancel: []
}>()

// Composables
const { closeDialog } = useAppManager()
const equipmentStore = useEquipmentStore()
const { showSuccess, showError } = useNotification()
const { translateError } = useErrorTranslation()

// Form ref
const formRef = ref()

// Loading state
const loading = ref(false)

// Form data
const formData = reactive<CreateEquipmentDto>({
  equipment_code: '',
  equipment_name: '',
  equipment_type: '',
  manufacturer: '',
  model: '',
  serial_number: '',
  year_manufactured: new Date().getFullYear(),
  purchase_date: '',
  service_interval_hours: 500,
  initial_operating_hours: 0,
  specifications: {},
})

// Specifications array for UI
const specifications = ref<Array<{ key: string; value: string }>>([])

// Type options (imported from constants)
const typeOptions = EQUIPMENT_TYPES

// Helper function to create Vuetify rules from Yup schema
const createVuetifyRule = (yupSchema: any) => {
  return (value: any) => {
    try {
      yupSchema.validateSync(value)

      return true
    }
    catch (error) {
      if (error instanceof yup.ValidationError)
        return error.message

      return 'Error de validación'
    }
  }
}

// Validation rules for Vuetify (generated from Yup schema)
const rules = {
  required: (v: any) => {
    if (!v)
      return 'Este campo es requerido'
    if (typeof v === 'string' && v.trim() === '')
      return 'Este campo no puede estar vacío'

    return true
  },
  equipmentCode: createVuetifyRule(equipmentValidationSchema.fields.equipment_code),
  equipmentName: createVuetifyRule(equipmentValidationSchema.fields.equipment_name),
  equipmentType: createVuetifyRule(equipmentValidationSchema.fields.equipment_type),
  serialNumber: createVuetifyRule(equipmentValidationSchema.fields.serial_number),
  yearManufactured: createVuetifyRule(equipmentValidationSchema.fields.year_manufactured),
  serviceIntervalHours: createVuetifyRule(equipmentValidationSchema.fields.service_interval_hours),
  initialOperatingHours: createVuetifyRule(equipmentValidationSchema.fields.initial_operating_hours),
}

// Watch equipment prop for editing
watch(() => props.equipment, newEquipment => {
  if (newEquipment && props.isEditing) {
    formData.equipment_code = newEquipment.equipment_code || ''
    formData.equipment_name = newEquipment.equipment_name || ''
    formData.equipment_type = newEquipment.equipment_type || ''
    formData.manufacturer = newEquipment.manufacturer || ''
    formData.model = newEquipment.model || ''
    formData.serial_number = newEquipment.serial_number || ''
    formData.year_manufactured = newEquipment.year_manufactured || new Date().getFullYear()
    formData.purchase_date = newEquipment.purchase_date || ''
    formData.service_interval_hours = newEquipment.service_interval_hours || 500
    formData.specifications = newEquipment.specifications || {}

    // Convert specifications object to array for UI
    if (newEquipment.specifications && typeof newEquipment.specifications === 'object') {
      specifications.value = Object.entries(newEquipment.specifications).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    }
  }
}, { immediate: true })

// Specifications management
const addSpecification = () => {
  specifications.value.push({ key: '', value: '' })
}

const removeSpecification = (index: number) => {
  specifications.value.splice(index, 1)
}

// Convert specifications array to object
const getSpecificationsObject = () => {
  const specs: Record<string, string> = {}

  specifications.value.forEach(spec => {
    if (spec.key && spec.value)
      specs[spec.key] = spec.value
  })

  return Object.keys(specs).length > 0 ? specs : undefined
}

// Submit handler
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  loading.value = true
  try {
    // Build specifications object
    formData.specifications = getSpecificationsObject()

    // Validate with Yup using helper function
    const validationResult = await validateEquipmentData(formData, props.isEditing)

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.errors)

      // You could show these errors to the user
      return
    }

    const validatedData = validationResult.data

    if (props.isEditing) {
      // For editing, only send updatable fields
      const updateData: UpdateEquipmentDto = {
        equipment_name: validatedData.equipment_name,
        manufacturer: validatedData.manufacturer,
        model: validatedData.model,
        specifications: validatedData.specifications,
        service_interval_hours: validatedData.service_interval_hours,
      }

      await equipmentStore.updateEquipment(props.equipment.id, updateData)
      showSuccess('DrillingReportsModule.equipment.updated_successfully', 'DrillingReportsModule.equipment.equipment_updated')
    }
    else {
      // For creating, send all fields
      await equipmentStore.createEquipment(validatedData)
      showSuccess('DrillingReportsModule.equipment.created_successfully', 'DrillingReportsModule.equipment.equipment_created')
    }

    emit('submit')
    if (props.showCloseButton)
      closeDialog()
  }
  catch (error: any) {
    console.error('Error saving equipment:', error)

    // Extract specific error message from backend
    const errorMessage = 'DrillingReportsModule.equipment.save_error'
    const errorTitle = 'DrillingReportsModule.equipment.equipment_error'

    if (error?.response?.data?.error?.message) {
      // Show the specific backend error message from the error object (translated)
      const translatedMessage = translateError(error.response.data.error.message, 'equipment')

      showError(translatedMessage, 'DrillingReportsModule.equipment.equipment_error')
    }
    else if (error?.response?.data?.message) {
      // Show the specific backend error message (legacy format, translated)
      const translatedMessage = translateError(error.response.data.message, 'equipment')

      showError(translatedMessage, 'DrillingReportsModule.equipment.equipment_error')
    }
    else if (error?.message) {
      // Show generic error message if no specific backend message
      showError(error.message, 'DrillingReportsModule.equipment.equipment_error')
    }
    else {
      // Fallback to translated error message
      showError(errorMessage, errorTitle)
    }
  }
  finally {
    loading.value = false
  }
}

// Cancel handler
const handleCancel = () => {
  emit('cancel')
  if (props.showCloseButton)
    closeDialog()
}

// Initialize on mount
onMounted(() => {
  if (!props.isEditing) {
    // Reset form for new equipment
    formData.equipment_code = ''
    formData.equipment_name = ''
    formData.equipment_type = ''
    formData.manufacturer = ''
    formData.model = ''
    formData.serial_number = ''
    formData.year_manufactured = new Date().getFullYear()
    formData.purchase_date = ''
    formData.service_interval_hours = 500
    formData.initial_operating_hours = 0
    specifications.value = []
  }
})
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between">
      <span>{{ isEditing ? 'Editar Equipo' : 'Nuevo Equipo' }}</span>
      <DialogCloseBtn
        v-if="showCloseButton"
        @click="closeDialog"
      />
    </VCardTitle>

    <VCardText>
      <VForm
        ref="formRef"
        @submit.prevent="handleSubmit"
      >
        <VRow>
          <!-- Código del Equipo -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.equipment_code"
              label="Código del Equipo *"
              :rules="[rules.equipmentCode]"
              :disabled="isEditing"
              required
              prepend-inner-icon="tabler-barcode"
            />
          </VCol>

          <!-- Nombre del Equipo -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.equipment_name"
              label="Nombre del Equipo *"
              :rules="[rules.equipmentName]"
              required
              prepend-inner-icon="tabler-tool"
            />
          </VCol>

          <!-- Tipo de Equipo -->
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="formData.equipment_type"
              :items="typeOptions"
              label="Tipo de Equipo *"
              :rules="[rules.equipmentType]"
              required
              item-title="label"
              item-value="value"
              prepend-inner-icon="tabler-category"
            />
          </VCol>

          <!-- Fabricante -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.manufacturer"
              label="Fabricante"
              prepend-inner-icon="tabler-building-factory"
            />
          </VCol>

          <!-- Modelo -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.model"
              label="Modelo"
              prepend-inner-icon="tabler-file-description"
            />
          </VCol>

          <!-- Número de Serie -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.serial_number"
              label="Número de Serie *"
              :rules="[rules.serialNumber]"
              required
              prepend-inner-icon="tabler-hash"
            />
          </VCol>

          <!-- Año de Fabricación -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model.number="formData.year_manufactured"
              label="Año de Fabricación *"
              type="number"
              :min="1900"
              :max="new Date().getFullYear() + 1"
              :rules="[rules.yearManufactured]"
              required
              prepend-inner-icon="tabler-calendar"
            />
          </VCol>

          <!-- Fecha de Compra -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.purchase_date"
              label="Fecha de Compra"
              type="date"
              prepend-inner-icon="tabler-calendar-dollar"
            />
          </VCol>

          <!-- Intervalo de Servicio (horas) -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model.number="formData.service_interval_hours"
              label="Intervalo de Servicio (horas) *"
              type="number"
              step="50"
              min="0"
              :rules="[rules.serviceIntervalHours]"
              required
              prepend-inner-icon="tabler-clock-hour-4"
              suffix="hrs"
            />
          </VCol>

          <!-- Horas de Operación Iniciales (solo al crear) -->
          <VCol
            v-if="!isEditing"
            cols="12"
            md="6"
          >
            <VTextField
              v-model.number="formData.initial_operating_hours"
              label="Horas de Operación Iniciales *"
              type="number"
              step="0.1"
              min="0"
              :rules="[rules.initialOperatingHours]"
              required
              prepend-inner-icon="tabler-hourglass"
              suffix="hrs"
            />
          </VCol>

          <!-- Especificaciones (JSON) -->
          <VCol cols="12">
            <VExpansionPanels>
              <VExpansionPanel>
                <VExpansionPanelTitle>
                  <VIcon
                    icon="tabler-settings"
                    class="me-2"
                  />
                  Especificaciones Técnicas (opcional)
                </VExpansionPanelTitle>
                <VExpansionPanelText>
                  <VRow>
                    <VCol
                      v-for="(spec, index) in specifications"
                      :key="index"
                      cols="12"
                      md="6"
                    >
                      <div class="d-flex gap-2">
                        <VTextField
                          v-model="spec.key"
                          label="Nombre"
                          density="compact"
                        />
                        <VTextField
                          v-model="spec.value"
                          label="Valor"
                          density="compact"
                        />
                        <VBtn
                          icon="tabler-trash"
                          size="small"
                          color="error"
                          variant="text"
                          @click="removeSpecification(index)"
                        />
                      </div>
                    </VCol>
                    <VCol cols="12">
                      <VBtn
                        prepend-icon="tabler-plus"
                        size="small"
                        @click="addSpecification"
                      >
                        Agregar Especificación
                      </VBtn>
                    </VCol>
                  </VRow>
                </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>

    <VCardActions>
      <VSpacer />
      <VBtn
        color="grey"
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
        Guardar
      </VBtn>
    </VCardActions>
  </VCard>
</template>
