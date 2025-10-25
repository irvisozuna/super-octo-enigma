<script setup lang="ts">
import { computed, ref } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import {
  REPORT_VALIDATION_RULES,
  TOOL_CATEGORY_OPTIONS,
} from '../../../shared/constants'

interface Props {
  toolOptions: any[]
  loadingTools: boolean
  currentWell?: any
}

const props = defineProps<Props>()

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// State for collapsed/expanded tools
const expandedTools = ref<Set<number>>(new Set())

// Computed
const formData = computed(() => wizardStore.formData)
const availableShiftOptions = computed(() => wizardStore.availableShiftOptions)
const isToolsStepValid = computed(() => wizardStore.isToolsStepValid)
const getLastDepth = () => wizardStore.getLastDepth()

// Options
const toolCategoryOptions = TOOL_CATEGORY_OPTIONS

// Handlers
const addToolAssignment = () => {
  wizardStore.addToolAssignment()

  // Auto-expand the new tool
  const newIndex = formData.value.tool_assignments.length - 1

  expandedTools.value.add(newIndex)

  // Auto-set the suggested start depth
  const suggestedStartDepth = getSuggestedStartDepth(newIndex)
  if (suggestedStartDepth !== undefined)
    updateToolAssignment(newIndex, 'start_depth_meters', suggestedStartDepth)

  // Auto-set the suggested end depth
  const suggestedEndDepth = getSuggestedEndDepth(newIndex)
  if (suggestedEndDepth !== undefined)
    updateToolAssignment(newIndex, 'end_depth_meters', suggestedEndDepth)
}

const removeToolAssignment = (index: number) => {
  wizardStore.removeToolAssignment(index)

  // Remove from expanded set and adjust indices
  expandedTools.value.delete(index)

  const newExpanded = new Set<number>()

  expandedTools.value.forEach(i => {
    if (i > index)
      newExpanded.add(i - 1)
    else if (i < index)
      newExpanded.add(i)
  })
  expandedTools.value = newExpanded
}

const updateToolAssignment = (index: number, field: string, value: any) => {
  wizardStore.updateToolAssignment(index, { [field]: value })
}

const toggleToolExpansion = (index: number) => {
  if (expandedTools.value.has(index))
    expandedTools.value.delete(index)
  else
    expandedTools.value.add(index)
}

const isToolExpanded = (index: number) => expandedTools.value.has(index)

// Get tool display name for collapsed view
const getToolDisplayName = (tool: any) => {
  if (!tool.tool_id)
    return 'Herramienta sin seleccionar'
  const selectedTool = props.toolOptions.find(t => t.value === tool.tool_id)

  return selectedTool?.title || 'Herramienta desconocida'
}

// Get suggested start depth for a tool
const getSuggestedStartDepth = (index: number) => {
  if (index === 0) {
    // For the first tool, use the well's current depth
    return props.currentWell?.depth?.current_meters || 0
  }

  // For subsequent tools, use the end depth of the previous tool
  const previousTool = formData.value.tool_assignments[index - 1]

  return previousTool?.end_depth_meters || 0
}

// Get suggested end depth for a tool (start depth + typical drilling range)
const getSuggestedEndDepth = (index: number) => {
  const startDepth = getSuggestedStartDepth(index)

  // Suggest a typical drilling range of 10-20 meters
  const typicalRange = 15

  return startDepth + typicalRange
}

// Validation rule for end depth
const endDepthRule = (tool: any) => {
  return (v: number) => v > tool.start_depth_meters || 'Debe ser mayor a la profundidad inicial'
}
</script>

<template>
  <div class="pa-6">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 mb-2">
          Herramientas Utilizadas
        </h3>
        <p class="text-body-2 text-medium-emphasis">
          Registra las herramientas usadas. La profundidad se sugiere automáticamente.
        </p>
      </div>
      <VBtn
        color="warning"
        prepend-icon="tabler-plus"
        @click="addToolAssignment"
      >
        Agregar
      </VBtn>
    </div>

    <!-- Tools List -->
    <VRow>
      <VCol
        v-for="(tool, index) in formData.tool_assignments"
        :key="index"
        cols="12"
      >
        <VCard
          variant="outlined"
          class="tool-card"
        >
          <!-- Collapsible Header -->
          <VCardTitle
            class="d-flex align-center justify-space-between bg-warning-lighten-5 cursor-pointer"
            @click="toggleToolExpansion(index)"
          >
            <div class="d-flex align-center">
              <VIcon
                :icon="isToolExpanded(index) ? 'tabler-chevron-down' : 'tabler-chevron-right'"
                class="me-2"
                size="20"
              />
              <div>
                <span class="text-body-1 font-weight-medium">
                  <VIcon
                    icon="tabler-tool"
                    size="14"
                    class="me-1"
                  />
                  {{ getToolDisplayName(tool) }}

                </span>
                <span class="text-body-1 font-weight-medium">
                  <VIcon
                    icon="tabler-arrow-down-circle"
                    size="14"
                    class="me-1"
                  />
                  {{ (tool.end_depth_meters - tool.start_depth_meters).toFixed(2) }}m
                </span>
                <!-- Collapsed Summary -->
                <div
                  v-if="!isToolExpanded(index)"
                  class="text-caption text-medium-emphasis mt-1"
                >
                  <div class="d-flex align-center gap-4">
                    <span v-if="tool.start_depth_meters !== undefined">
                      <VIcon
                        icon="tabler-arrow-down-circle"
                        size="14"
                        class="me-1"
                      />
                      {{ tool.start_depth_meters }}m
                    </span>
                    <span v-if="tool.end_depth_meters !== undefined">
                      <VIcon
                        icon="tabler-arrow-up-circle"
                        size="14"
                        class="me-1"
                      />
                      {{ tool.end_depth_meters }}m
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click.stop="removeToolAssignment(index)"
            />
          </VCardTitle>

          <!-- Expandable Content -->
          <VExpandTransition>
            <VCardText v-show="isToolExpanded(index)">
              <VRow>
                <VCol
                  cols="12"
                  md="4"
                >
                  <VSelect
                    :model-value="tool.tool_id"
                    label="Herramienta *"
                    :items="toolOptions"
                    :loading="loadingTools"
                    :rules="[rules.required]"
                    prepend-inner-icon="tabler-tool"
                    @update:model-value="(v) => updateToolAssignment(index, 'tool_id', v)"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="4"
                >
                  <VSelect
                    :model-value="tool.tool_category"
                    label="Categoría *"
                    :items="toolCategoryOptions"
                    :rules="[rules.required]"
                    prepend-inner-icon="tabler-category"
                    @update:model-value="(v) => updateToolAssignment(index, 'tool_category', v)"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="4"
                >
                  <VSelect
                    :model-value="tool.shift"
                    label="Turno *"
                    :items="availableShiftOptions"
                    :rules="[rules.required]"
                    prepend-inner-icon="tabler-clock"
                    @update:model-value="(v) => updateToolAssignment(index, 'shift', v)"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    :model-value="tool.start_depth_meters"
                    label="Profundidad Inicio (m) *"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[rules.required, rules.positiveNumber]"
                    prepend-inner-icon="tabler-arrow-down-circle"
                    suffix="m"
                    :hint="index === 0 ? `Profundidad actual del pozo: ${props.currentWell?.depth?.current_meters || 0} m` : `Sugerido: ${getSuggestedStartDepth(index)} m`"
                    persistent-hint
                    @update:model-value="(v) => updateToolAssignment(index, 'start_depth_meters', Number(v))"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    :model-value="tool.end_depth_meters"
                    label="Profundidad Fin (m) *"
                    type="number"
                    step="0.01"
                    min="0"
                    :rules="[rules.required, rules.positiveNumber, endDepthRule(tool)]"
                    prepend-inner-icon="tabler-arrow-up-circle"
                    suffix="m"
                    :hint="`Sugerido: ${getSuggestedEndDepth(index)} m`"
                    persistent-hint
                    @update:model-value="(v) => updateToolAssignment(index, 'end_depth_meters', Number(v))"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    :model-value="tool.wear_pattern"
                    label="Patrón de Desgaste"
                    counter="100"
                    :rules="[rules.maxLength(100)]"
                    prepend-inner-icon="tabler-zoom-question"
                    placeholder="Ej: Desgaste uniforme en corona"
                    @update:model-value="(v) => updateToolAssignment(index, 'wear_pattern', v)"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    :model-value="tool.matrix"
                    label="Matriz"
                    counter="50"
                    :rules="[rules.maxLength(50)]"
                    prepend-inner-icon="tabler-grid-dots"
                    placeholder="Ej: M7"
                    @update:model-value="(v) => updateToolAssignment(index, 'matrix', v)"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VExpandTransition>
        </VCard>
      </VCol>

      <!-- Empty State -->
      <VCol
        v-if="formData.tool_assignments.length === 0"
        cols="12"
      >
        <VCard
          variant="outlined"
          class="text-center pa-8"
        >
          <VIcon
            icon="tabler-tools-off"
            size="64"
            class="text-medium-emphasis mb-4"
          />
          <p class="text-body-2 text-medium-emphasis mb-4">
            No hay herramientas registradas. Debe agregar al menos una herramienta para continuar.
          </p>
          <VBtn
            color="warning"
            prepend-icon="tabler-plus"
            @click="addToolAssignment"
          >
            Agregar Herramienta
          </VBtn>
        </VCard>
      </VCol>

      <!-- Validation Error -->
      <VCol
        v-if="formData.tool_assignments.length > 0 && !isToolsStepValid"
        cols="12"
      >
        <VAlert
          color="error"
          variant="tonal"
          border="start"
          class="mb-4"
        >
          <template #title>
            <VIcon
              icon="tabler-alert-circle"
              class="me-2"
            />
            Validación Requerida
          </template>
          <p class="mb-2">
            Por favor complete todos los campos requeridos y verifique que:
          </p>
          <ul class="text-body-2">
            <li>• Todas las herramientas tengan un nombre seleccionado</li>
            <li>• La profundidad fin sea mayor que la profundidad inicio</li>
            <li>• Todos los campos obligatorios estén completos</li>
          </ul>
        </VAlert>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped lang="scss">
.tool-card {
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 10%);
  }
}

.cursor-pointer {
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-warning), 0.1) !important;
  }
}

// Smooth transitions for the expand/collapse
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease;
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
