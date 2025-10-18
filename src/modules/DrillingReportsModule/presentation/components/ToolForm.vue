<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '../stores/toolsStore'
import { TOOL_MATERIALS } from '../../shared/constants/ToolConstants'
import { useAppManager } from '@/composables/useAppManager'

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
})

// Tool type options - usando constantes y traducciones
const toolTypeOptions = computed(() =>
  TOOL_MATERIALS.map(tool => ({
    title: t(tool.translationKey),
    value: tool.value,
  })),
)

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Campo requerido',
  number: (value: any) => !value || !isNaN(Number(value)) || 'Debe ser un número válido',
  positive: (value: any) => !value || Number(value) > 0 || 'Debe ser mayor a 0',
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
  }
  else {
    // Reset form for create mode
    formData.type = ''
    formData.serial_number = ''
    formData.capacity_meters = null
    formData.acquired_at = new Date().toISOString().split('T')[0] // Fecha actual por defecto
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
    }

    if (props.isEditing && props.tool?.id)
      await toolsStore.updateTool(props.tool.id, payload)

    else
      await toolsStore.createTool(payload)

    emit('submit', payload)
    if (props.showCloseButton)
      closeDialog('submit')
  }
  catch (error) {
    console.error('Error saving tool:', error)
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
              :rules="[rules.required]"
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
              :rules="[rules.required]"
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
              :rules="[rules.required, rules.number, rules.positive]"
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
              :rules="[rules.required]"
              type="date"
              required
              prepend-inner-icon="tabler-calendar"
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
