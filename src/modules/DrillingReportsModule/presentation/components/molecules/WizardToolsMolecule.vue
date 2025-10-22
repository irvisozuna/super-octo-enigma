<script setup lang="ts">
import { computed } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import {
  REPORT_VALIDATION_RULES,
  TOOL_CATEGORY_OPTIONS,
} from '../../../shared/constants'

interface Props {
  toolOptions: any[]
  loadingTools: boolean
}

const props = defineProps<Props>()

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// Computed
const formData = computed(() => wizardStore.formData)
const availableShiftOptions = computed(() => wizardStore.availableShiftOptions)
const isToolsStepValid = computed(() => wizardStore.isToolsStepValid)
const getLastDepth = () => wizardStore.getLastDepth()

// Options
const toolCategoryOptions = TOOL_CATEGORY_OPTIONS

// Handlers
const addToolAssignment = () => wizardStore.addToolAssignment()
const removeToolAssignment = (index: number) => wizardStore.removeToolAssignment(index)

const updateToolAssignment = (index: number, field: string, value: any) => {
  wizardStore.updateToolAssignment(index, { [field]: value })
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
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between bg-warning-lighten-5">
            <span class="text-body-1">Herramienta {{ index + 1 }}</span>
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click="removeToolAssignment(index)"
            />
          </VCardTitle>
          <VCardText>
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
                  :hint="index === 0 ? 'Primera herramienta' : `Sugerido: ${getLastDepth()} m`"
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
