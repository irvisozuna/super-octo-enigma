<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import * as yup from 'yup'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '../stores/toolsStore'
import { TOOL_MATERIALS } from '../../shared/constants/ToolConstants'
import {
  toolUpdateValidationSchema,
  toolValidationSchema,
  validateToolData,
} from '../schemas'
import { useAppManager } from '@/composables/useAppManager'
import { useNotification } from '@/helpers/notificationHelper'
import { useErrorTranslation } from '@/helpers/errorTranslationHelper'

// Props
interface Props {
  tool?: any
  isEditing?: boolean
  showCloseButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tool: null,
  isEditing: false,
  showCloseButton: true,
})

// Emits
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

// Composables
const { t } = useI18n()
const { closeDialog } = useAppManager()
const toolsStore = useToolsStore()
const { showSuccess, showError } = useNotification()
const { translateError } = useErrorTranslation()

// Form ref
const formRef = ref()

// Loading state
const loading = ref(false)

// Form data - Estructura según API backend
const formData = reactive({
  type: '',
  serial_number: '',
  capacity_meters: null as number | null,
  acquired_at: '',
  brand: '',
  diameter: null as number | null,
  matrix: '',
})

// Tool type options - usando constantes y traducciones
const toolTypeOptions = computed(() =>
  TOOL_MATERIALS.map(tool => ({
    title: t(tool.translationKey),
    value: tool.value,
  })),
)

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
  type: createVuetifyRule(toolValidationSchema.fields.type),
  serialNumber: createVuetifyRule(toolValidationSchema.fields.serial_number),
  capacityMeters: createVuetifyRule(toolValidationSchema.fields.capacity_meters),
  acquiredAt: createVuetifyRule(toolValidationSchema.fields.acquired_at),
  brand: createVuetifyRule(toolValidationSchema.fields.brand),
  diameter: createVuetifyRule(toolValidationSchema.fields.diameter),
  matrix: createVuetifyRule(toolValidationSchema.fields.matrix),
}

// Watch for tool changes - Mapear estructura del backend a formulario
watch(() => props.tool, newTool => {
  if (newTool) {
    formData.type = newTool.type || ''
    formData.serial_number = newTool.serial_number || ''

    // Manejar capacity anidado
    if (newTool.capacity?.total_meters !== undefined)
      formData.capacity_meters = newTool.capacity.total_meters

    else if (newTool.capacity_meters !== undefined)
      formData.capacity_meters = newTool.capacity_meters

    // Manejar dates anidado
    if (newTool.dates?.acquired_at)
      formData.acquired_at = newTool.dates.acquired_at.split('T')[0] // Solo la fecha

    else if (newTool.acquired_at)
      formData.acquired_at = newTool.acquired_at.split('T')[0]

    // Manejar specifications anidado
    if (newTool.specifications) {
      formData.brand = newTool.specifications.brand || ''
      formData.diameter = newTool.specifications.diameter || null
      formData.matrix = newTool.specifications.matrix || ''
    }
  }
  else {
    // Reset form for create mode
    formData.type = ''
    formData.serial_number = ''
    formData.capacity_meters = null
    formData.acquired_at = new Date().toISOString().split('T')[0] // Fecha actual por defecto
    formData.brand = ''
    formData.diameter = null
    formData.matrix = ''
  }
}, { immediate: true })

// Methods
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  loading.value = true
  try {
    const payload = {
      type: formData.type,
      serial_number: formData.serial_number,
      capacity_meters: Number(formData.capacity_meters),
      acquired_at: formData.acquired_at,
      brand: formData.brand,
      diameter: Number(formData.diameter),
      matrix: formData.matrix,
    }

    // Validate with Yup using helper function
    const validationResult = await validateToolData(payload, props.isEditing)

    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.errors)

      // You could show these errors to the user
      return
    }

    const validatedData = validationResult.data

    if (props.isEditing && props.tool?.id) {
      await toolsStore.updateTool(props.tool.id, validatedData)
      showSuccess('DrillingReportsModule.tools.updated_successfully', 'DrillingReportsModule.tools.tool_updated')
    }
    else {
      await toolsStore.createTool(validatedData)
      showSuccess('DrillingReportsModule.tools.created_successfully', 'DrillingReportsModule.tools.tool_created')
    }

    emit('submit', validatedData)
    if (props.showCloseButton)
      closeDialog('submit')
  }
  catch (error: any) {
    console.error('Error saving tool:', error)

    // Extract specific error message from backend
    const errorMessage = 'DrillingReportsModule.tools.save_error'
    const errorTitle = 'DrillingReportsModule.tools.tool_error'

    if (error?.response?.data?.error?.message) {
      // Show the specific backend error message from the error object (translated)
      const translatedMessage = translateError(error.response.data.error.message, 'tool')

      showError(translatedMessage, 'DrillingReportsModule.tools.tool_error')
    }
    else if (error?.response?.data?.message) {
      // Show the specific backend error message (legacy format, translated)
      const translatedMessage = translateError(error.response.data.message, 'tool')

      showError(translatedMessage, 'DrillingReportsModule.tools.tool_error')
    }
    else if (error?.message) {
      // Show generic error message if no specific backend message
      showError(error.message, 'DrillingReportsModule.tools.tool_error')
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

const handleCancel = () => {
  emit('cancel')
  if (props.showCloseButton)
    closeDialog()
}
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between">
      <span>{{ isEditing ? $t('DrillingReportsModule.tools.editTool') : $t('DrillingReportsModule.tools.newTool') }}</span>
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
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.serial_number"
              :label="$t('DrillingReportsModule.tools.serialNumber')"
              :rules="[rules.serialNumber]"
              required
              prepend-inner-icon="tabler-barcode"
              placeholder="Ej: PDC-2024-001"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VSelect
              v-model="formData.type"
              :items="toolTypeOptions"
              :label="$t('DrillingReportsModule.tools.type')"
              :rules="[rules.type]"
              required
              prepend-inner-icon="tabler-tool"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.capacity_meters"
              :label="$t('DrillingReportsModule.tools.capacity')"
              :rules="[rules.capacityMeters]"
              type="number"
              step="0.01"
              min="0"
              required
              prepend-inner-icon="tabler-ruler"
              suffix="metros"
              placeholder="Ej: 1500"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.acquired_at"
              :label="$t('DrillingReportsModule.tools.acquired_at')"
              :rules="[rules.acquiredAt]"
              type="date"
              required
              prepend-inner-icon="tabler-calendar"
            />
          </VCol>

          <!-- Nuevos campos obligatorios -->
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.brand"
              :label="$t('DrillingReportsModule.tools.brand')"
              :rules="[rules.brand]"
              required
              prepend-inner-icon="tabler-building-factory"
              placeholder="Ej: Atlas Copco"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model.number="formData.diameter"
              :label="$t('DrillingReportsModule.tools.diameter')"
              :rules="[rules.diameter]"
              type="number"
              step="0.1"
              min="0"
              max="1000"
              required
              prepend-inner-icon="tabler-circle"
              suffix="mm"
              placeholder="Ej: 12.5"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="formData.matrix"
              :label="$t('DrillingReportsModule.tools.matrix')"
              :rules="[rules.matrix]"
              required
              prepend-inner-icon="tabler-diamond"
              placeholder="Ej: PDC, Tricone, etc."
            />
          </VCol>

          <!-- Info adicional solo en modo edición -->
          <template v-if="isEditing && tool">
            <VCol cols="12">
              <VDivider class="my-2" />
              <h6 class="text-h6 mb-4">
                Información de Uso
              </h6>
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                :model-value="tool.capacity?.used_meters?.toFixed(2) || 0"
                label="Metros Usados"
                readonly
                variant="outlined"
                density="compact"
                suffix="m"
                prepend-inner-icon="tabler-progress"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                :model-value="tool.capacity?.remaining_meters?.toFixed(2) || 0"
                label="Metros Restantes"
                readonly
                variant="outlined"
                density="compact"
                suffix="m"
                prepend-inner-icon="tabler-clock"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                :model-value="`${tool.capacity?.usage_percentage?.toFixed(1) || 0}%`"
                label="Uso"
                readonly
                variant="outlined"
                density="compact"
                prepend-inner-icon="tabler-percentage"
              />
            </VCol>
          </template>
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
        {{ $t('DrillingReportsModule.common.cancel') }}
      </VBtn>
      <VBtn
        color="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ $t('DrillingReportsModule.common.save') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
