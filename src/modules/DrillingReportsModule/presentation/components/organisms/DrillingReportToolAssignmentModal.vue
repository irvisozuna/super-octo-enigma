<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  MATRIX_CONDITIONS,
  SHIFTS,
  TOOL_CATEGORIES,
  WEAR_PATTERNS,
} from '../../shared/constants/DrillingConstants'
import {
  getToolCategoryIcon,
  getToolStatusColor,
  getToolStatusLabel,
} from '../../shared/utils/labelUtils'

// Props
interface Props {
  modelValue: boolean
  assignment?: any
  reportId: string
}

const props = withDefaults(defineProps<Props>(), {
  assignment: null,
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
const loadingTools = ref(false)

const formData = ref({
  tool_id: '',
  shift: 'day',
  tool_category: '',
  start_depth_meters: null,
  end_depth_meters: null,
  wear_pattern: null,
  matrix: null,
})

const errors = ref({})
const tools = ref([])
const selectedTool = ref(null)

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.assignment)

const toolCategories = computed(() => TOOL_CATEGORIES)
const wearPatterns = computed(() => WEAR_PATTERNS)
const matrixConditions = computed(() => MATRIX_CONDITIONS)
const shifts = computed(() => SHIFTS)

const canChangeShift = computed(() => {
  // TODO: Implement logic based on report shift
  return true
})

const depthHint = computed(() => {
  if (formData.value.start_depth_meters && formData.value.end_depth_meters) {
    const meters = formData.value.end_depth_meters - formData.value.start_depth_meters

    return `Metros perforados: ${meters.toFixed(2)}m`
  }

  return ''
})

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
  depth: (value: any) => {
    if (!value)
      return 'La profundidad es requerida'
    const depth = Number.parseFloat(value)
    if (depth < 0)
      return 'La profundidad no puede ser negativa'
    if (depth > 10000)
      return 'Profundidad inválida'

    return true
  },
  endDepth: (value: any) => {
    if (!value || !formData.value.start_depth_meters)
      return true

    return value > formData.value.start_depth_meters || 'La profundidad final debe ser mayor que la inicial'
  },
}

// Methods
const closeModal = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    tool_id: '',
    shift: 'day',
    tool_category: '',
    start_depth_meters: null,
    end_depth_meters: null,
    wear_pattern: null,
    matrix: null,
  }
  errors.value = {}
  selectedTool.value = null
}

const loadAssignmentData = () => {
  if (props.assignment) {
    formData.value = {
      tool_id: props.assignment.tool_id || '',
      shift: props.assignment.shift || 'day',
      tool_category: props.assignment.tool_category || '',
      start_depth_meters: props.assignment.depth_range?.start_meters || null,
      end_depth_meters: props.assignment.depth_range?.end_meters || null,
      wear_pattern: props.assignment.wear_pattern || null,
      matrix: props.assignment.matrix || null,
    }
  }
}

const onToolChange = (toolId: string) => {
  if (toolId) {
    selectedTool.value = tools.value.find(tool => tool.id === toolId)
    if (selectedTool.value)
      formData.value.tool_category = selectedTool.value.category || ''
  }
  else {
    selectedTool.value = null
  }
}

const loadTools = async () => {
  loadingTools.value = true
  try {
    // TODO: Implement load tools
    console.log('Loading tools...')

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock data
    tools.value = [
      {
        id: '1',
        name: 'Broca Tricónica 12"',
        serial_number: 'DRILL-BIT-001',
        manufacturer: 'Hughes',
        category: 'drill_bit',
        status: 'available',
        total_usage_meters: 450.5,
        capacity_meters: 1000,
        remaining_meters: 549.5,
      },
      {
        id: '2',
        name: 'Broca PDC 12"',
        serial_number: 'DRILL-BIT-002',
        manufacturer: 'Smith',
        category: 'drill_bit',
        status: 'available',
        total_usage_meters: 920,
        capacity_meters: 1000,
        remaining_meters: 80,
      },
    ]
  }
  catch (error) {
    console.error('Error loading tools:', error)
  }
  finally {
    loadingTools.value = false
  }
}

const saveToolAssignment = async () => {
  if (!formValid.value)
    return

  saving.value = true
  try {
    // TODO: Implement save tool assignment
    console.log('Saving tool assignment:', {
      reportId: props.reportId,
      assignment: formData.value,
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
    console.error('Error saving tool assignment:', error)

    // TODO: Show error notification
  }
  finally {
    saving.value = false
  }
}

// Watchers
watch(() => props.modelValue, newValue => {
  if (newValue) {
    loadAssignmentData()
    loadTools()
  }
})

watch(() => props.assignment, newAssignment => {
  if (newAssignment)
    loadAssignmentData()
})

watch(() => formData.value.start_depth_meters, newValue => {
  if (newValue && formData.value.end_depth_meters && newValue >= formData.value.end_depth_meters)
    formData.value.end_depth_meters = null
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="700px"
    persistent
  >
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-tools"
          class="me-2"
        />
        {{ isEditing ? 'Editar Asignación de Herramienta' : 'Asignar Herramienta' }}
      </VCardTitle>

      <VCardText>
        <VForm
          ref="formRef"
          v-model="formValid"
          @submit.prevent="saveToolAssignment"
        >
          <VRow>
            <VCol cols="12">
              <VAutocomplete
                v-model="formData.tool_id"
                :items="tools"
                item-title="name"
                item-value="id"
                label="Buscar Herramienta *"
                :rules="[rules.required]"
                :error-messages="errors.tool_id"
                :loading="loadingTools"
                @update:model-value="onToolChange"
              >
                <template #item="{ props, item }">
                  <VListItem v-bind="props">
                    <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
                    <VListItemSubtitle>
                      {{ item.raw.serial_number }} - {{ item.raw.manufacturer }}
                    </VListItemSubtitle>
                    <VListItemSubtitle>
                      <VChip
                        :color="getToolStatusColor(item.raw.status)"
                        size="small"
                        class="me-2"
                      >
                        {{ getToolStatusLabel(item.raw.status) }}
                      </VChip>
                      <span v-if="item.raw.capacity_meters">
                        Capacidad: {{ item.raw.remaining_meters || 0 }}m / {{ item.raw.capacity_meters }}m
                      </span>
                    </VListItemSubtitle>
                  </VListItem>
                </template>
              </VAutocomplete>
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
              <VSelect
                v-model="formData.tool_category"
                :items="toolCategories"
                item-title="label"
                item-value="value"
                label="Categoría *"
                :rules="[rules.required]"
                :error-messages="errors.tool_category"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.start_depth_meters"
                type="number"
                step="0.01"
                min="0"
                label="Profundidad Inicial (m) *"
                :rules="[rules.required, rules.depth]"
                :error-messages="errors.start_depth_meters"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.end_depth_meters"
                type="number"
                step="0.01"
                min="0"
                label="Profundidad Final (m) *"
                :rules="[rules.required, rules.depth, rules.endDepth]"
                :error-messages="errors.end_depth_meters"
                :hint="depthHint"
                persistent-hint
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.wear_pattern"
                :items="wearPatterns"
                item-title="label"
                item-value="value"
                label="Patrón de Desgaste"
                clearable
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.matrix"
                :items="matrixConditions"
                item-title="label"
                item-value="value"
                label="Estado de Matriz"
                clearable
              />
            </VCol>
          </VRow>

          <!-- Tool Info Card -->
          <VCard
            v-if="selectedTool"
            variant="outlined"
            class="mt-4"
          >
            <VCardTitle class="text-h6">
              <VIcon
                :icon="getToolCategoryIcon(selectedTool.category)"
                class="me-2"
              />
              Información de la Herramienta
            </VCardTitle>
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="tool-info-item">
                    <label class="tool-info-label">Nombre:</label>
                    <span class="tool-info-value">{{ selectedTool.name }}</span>
                  </div>
                  <div class="tool-info-item">
                    <label class="tool-info-label">Número de Serie:</label>
                    <span class="tool-info-value">{{ selectedTool.serial_number }}</span>
                  </div>
                  <div class="tool-info-item">
                    <label class="tool-info-label">Fabricante:</label>
                    <span class="tool-info-value">{{ selectedTool.manufacturer }}</span>
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="tool-info-item">
                    <label class="tool-info-label">Estado:</label>
                    <VChip
                      :color="getToolStatusColor(selectedTool.status)"
                      size="small"
                    >
                      {{ getToolStatusLabel(selectedTool.status) }}
                    </VChip>
                  </div>
                  <div class="tool-info-item">
                    <label class="tool-info-label">Uso Total:</label>
                    <span class="tool-info-value">{{ selectedTool.total_usage_meters || 0 }}m</span>
                  </div>
                  <div class="tool-info-item">
                    <label class="tool-info-label">Capacidad Restante:</label>
                    <span class="tool-info-value">
                      {{ selectedTool.remaining_meters || 0 }}m
                      <span v-if="selectedTool.capacity_meters">
                        ({{ Math.round(((selectedTool.remaining_meters || 0) / selectedTool.capacity_meters) * 100) }}%)
                      </span>
                    </span>
                  </div>
                </VCol>
              </VRow>

              <VAlert
                v-if="selectedTool.remaining_meters && selectedTool.remaining_meters < 100"
                type="warning"
                class="mt-4"
              >
                <VIcon
                  icon="mdi-alert"
                  class="me-2"
                />
                ⚠️ Esta herramienta tiene poca capacidad restante ({{ selectedTool.remaining_meters }}m)
              </VAlert>
            </VCardText>
          </VCard>
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
          @click="saveToolAssignment"
        >
          <VIcon
            icon="mdi-content-save"
            class="me-2"
          />
          {{ isEditing ? 'Actualizar' : 'Asignar' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-dialog {
  max-inline-size: 700px;
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

.tool-info-item {
  display: flex;
  align-items: center;
  margin-block-end: 8px;
}

.tool-info-label {
  font-weight: 500;
  margin-inline-end: 8px;
  min-inline-size: 120px;
}

.tool-info-value {
  color: #666;
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
