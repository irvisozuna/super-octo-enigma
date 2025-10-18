<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { type CreateEquipmentDto, type UpdateEquipmentDto, useEquipmentStore } from '../stores/equipmentStore'
import { useAppManager } from '@/composables/useAppManager'

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

// Type options
const typeOptions = [
  { title: 'Equipo de perforación', value: 'drill_rig' },
  { title: 'Perforadora de núcleo', value: 'core_drill' },
  { title: 'Perforadora rotatoria', value: 'rotary_drill' },
  { title: 'Bomba', value: 'pump' },
  { title: 'Compresor', value: 'compressor' },
  { title: 'Generador', value: 'generator' },
  { title: 'Vehículo', value: 'vehicle' },
  { title: 'Otro', value: 'other' },
]

// Validation rules
const rules = {
  required: (v: any) => !!v || 'Este campo es requerido',
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

    if (props.isEditing) {
      // For editing, only send updatable fields
      const updateData: UpdateEquipmentDto = {
        equipment_name: formData.equipment_name,
        manufacturer: formData.manufacturer,
        model: formData.model,
        specifications: formData.specifications,
        service_interval_hours: formData.service_interval_hours,
      }

      await equipmentStore.updateEquipment(props.equipment.id, updateData)
    }
    else {
      // For creating, send all fields
      await equipmentStore.createEquipment(formData)
    }

    emit('submit')
    if (props.showCloseButton)
      closeDialog()
  }
  catch (error) {
    console.error('Error saving equipment:', error)
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
              :rules="[rules.required]"
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
              :rules="[rules.required]"
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
              :rules="[rules.required]"
              required
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
              label="Número de Serie"
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
              label="Año de Fabricación"
              type="number"
              :min="1900"
              :max="new Date().getFullYear() + 1"
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
              label="Intervalo de Servicio (horas)"
              type="number"
              step="50"
              min="0"
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
              label="Horas de Operación Iniciales"
              type="number"
              step="0.1"
              min="0"
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
