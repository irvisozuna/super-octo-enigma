<script setup lang="ts">
import { computed, ref } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import {
  REPORT_VALIDATION_RULES,
} from '../../../shared/constants'

interface Props {
  toolOptions: any[]
  loadingTools: boolean
  currentWell?: any
}

const props = defineProps<Props>()

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// State for expanded groups
const expandedGroups = ref<Set<number>>(new Set([0])) // Primer grupo expandido por defecto

// Computed
const formData = computed(() => wizardStore.formData)
const toolGroups = computed(() => formData.value.tool_groups)
const availableShiftOptions = computed(() => wizardStore.availableShiftOptions)
const isToolGroupsStepValid = computed(() => wizardStore.isToolGroupsStepValid)
const totalDrillBitDepthFromGroups = computed(() => wizardStore.totalDrillBitDepthFromGroups)
const totalDrillingDepth = computed(() => wizardStore.totalDrillingDepth)

// Filtrar herramientas por tipo (solo escarreadores)
// Excluye los escarreadores ya seleccionados en otros grupos
const getAvailableReamers = (currentGroupIndex: number) => {
  // Obtener IDs de escarreadores ya seleccionados en OTROS grupos
  const usedReamerIds = toolGroups.value
    .filter((_, index) => index !== currentGroupIndex)
    .map(group => group.reamer.tool_id)
    .filter(id => id !== null)

  return props.toolOptions.filter(tool => {
    const toolType = (tool.type || '').toLowerCase()
    const isReamer = toolType === 'reamer' || toolType.includes('reamer') || toolType.includes('escarreador')

    // Incluir si es reamer Y no está siendo usado en otro grupo
    return isReamer && !usedReamerIds.includes(tool.value)
  })
}

// Verificar si hay escarreadores disponibles para un nuevo grupo
const hasAvailableReamers = computed(() => {
  // Obtener todos los IDs de escarreadores ya usados
  const usedReamerIds = toolGroups.value
    .map(group => group.reamer.tool_id)
    .filter(id => id !== null)

  // Contar escarreadores disponibles
  const availableCount = props.toolOptions.filter(tool => {
    const toolType = (tool.type || '').toLowerCase()
    const isReamer = toolType === 'reamer' || toolType.includes('reamer') || toolType.includes('escarreador')

    return isReamer && !usedReamerIds.includes(tool.value)
  }).length

  return availableCount > 0
})

// Filtrar herramientas por tipo (solo brocas)
const bitOptions = computed(() => {
  return props.toolOptions.filter(tool => {
    const toolType = (tool.type || '').toLowerCase()

    return toolType === 'diamond_bit'
      || toolType === 'tricone'
      || toolType.includes('bit')
      || toolType.includes('broca')
      || toolType.includes('drill')
  })
})

// Opciones de tipo de broca
const bitTypeOptions = [
  { value: 'diamond_bit', title: 'Broca Diamante' },
  { value: 'tricone', title: 'Tricono' },
]

// Computed para detectar si hay profundidad capturada (0 es un valor válido)
const hasAnyDepth = computed(() => {
  // Usar !== null para que 0 sea considerado como valor válido
  return formData.value.drilling_depth_start !== null || formData.value.drilling_depth_end !== null
})

// Computed para validaciones específicas de grupos
const validationMessages = computed(() => {
  const messages: string[] = []

  const hasDepthStart = formData.value.drilling_depth_start !== null
  const hasDepthEnd = formData.value.drilling_depth_end !== null
  const hasGroups = toolGroups.value.length > 0

  // CASO: Con profundidad pero sin grupos → Debe agregar herramientas
  if ((hasDepthStart || hasDepthEnd) && !hasGroups) {
    messages.push('Si registró profundidad avanzada, debe agregar al menos un escarreador con sus brocas')

    return messages
  }

  // Si no hay profundidad y no hay grupos, no hay errores
  if (!hasDepthStart && !hasDepthEnd && !hasGroups)
    return messages

  // Validar que ambas profundidades estén capturadas si hay grupos
  if (hasGroups) {
    if (!hasDepthStart || !hasDepthEnd)
      messages.push('Debe registrar la profundidad avanzada (inicio y fin)')
    else if (formData.value.drilling_depth_end! <= formData.value.drilling_depth_start!)
      messages.push('La profundidad fin debe ser mayor que la profundidad inicio')
  }

  // Validar grupos
  toolGroups.value.forEach((group, index) => {
    if (!group.reamer.tool_id)
      messages.push(`Escarreador ${index + 1}: Debe seleccionar una herramienta`)

    group.bits.forEach((bit, bitIndex) => {
      if (!bit.tool_id)
        messages.push(`Escarreador ${index + 1}, Broca ${bitIndex + 1}: Debe seleccionar una herramienta`)

      if (bit.end_depth_meters <= bit.start_depth_meters)
        messages.push(`Escarreador ${index + 1}, Broca ${bitIndex + 1}: La profundidad fin debe ser mayor que inicio`)
    })
  })

  // Validar que las profundidades coincidan
  if (hasDepthStart && hasDepthEnd && hasGroups) {
    const depthDiff = Math.abs(totalDrillBitDepthFromGroups.value - totalDrillingDepth.value)
    if (depthDiff >= 0.01 && totalDrillBitDepthFromGroups.value > 0) {
      messages.push(
        `La suma de profundidades de brocas (${totalDrillBitDepthFromGroups.value.toFixed(2)}m) debe coincidir con la profundidad avanzada (${totalDrillingDepth.value.toFixed(2)}m)`,
      )
    }
  }

  return messages
})

// Handlers para profundidad
const updateDrillingDepth = (field: 'start' | 'end', value: number | null) => {
  if (field === 'start')
    wizardStore.updateFormData({ drilling_depth_start: value })
  else
    wizardStore.updateFormData({ drilling_depth_end: value })
}

// Limpiar profundidad (para omitir herramientas)
const clearDepthValues = () => {
  wizardStore.updateFormData({
    drilling_depth_start: null,
    drilling_depth_end: null,
  })
}

// Handlers para grupos
const addToolGroup = () => {
  wizardStore.addToolGroup()

  // Auto-expandir el nuevo grupo
  const newIndex = toolGroups.value.length - 1

  expandedGroups.value.add(newIndex)
}

const removeToolGroup = (groupIndex: number) => {
  wizardStore.removeToolGroup(groupIndex)
  expandedGroups.value.delete(groupIndex)
}

const addBitToGroup = (groupIndex: number) => {
  wizardStore.addBitToGroup(groupIndex)
}

const removeBitFromGroup = (groupIndex: number, bitIndex: number) => {
  wizardStore.removeBitFromGroup(groupIndex, bitIndex)
}

const updateReamer = (groupIndex: number, field: string, value: any) => {
  wizardStore.updateToolGroupReamer(groupIndex, { [field]: value })
}

const updateBit = (groupIndex: number, bitIndex: number, field: string, value: any) => {
  wizardStore.updateBitInGroup(groupIndex, bitIndex, { [field]: value })
}

// Toggle expansion
const toggleGroupExpansion = (index: number) => {
  if (expandedGroups.value.has(index))
    expandedGroups.value.delete(index)
  else
    expandedGroups.value.add(index)
}

const isGroupExpanded = (index: number) => expandedGroups.value.has(index)

// Get display name for reamer
const getReamerDisplayName = (toolId: string | null) => {
  if (!toolId)
    return 'Sin seleccionar'
  const tool = props.toolOptions.find(t => t.value === toolId)

  return tool?.title || 'Escarreador desconocido'
}

// Get display name for bit
const getBitDisplayName = (toolId: string | null) => {
  if (!toolId)
    return 'Sin seleccionar'
  const tool = props.toolOptions.find(t => t.value === toolId)

  return tool?.title || 'Broca desconocida'
}

// Calcular metros perforados por grupo
const getGroupDrilledMeters = (group: any) => {
  return group.bits.reduce((sum: number, bit: any) => {
    return sum + (bit.end_depth_meters - bit.start_depth_meters)
  }, 0)
}

// Verificar si se puede agregar más brocas (hay espacio disponible)
const canAddMoreBits = (group: any): boolean => {
  const maxDepth = formData.value.drilling_depth_end
  if (maxDepth === null)
    return true // Si no hay límite definido, permitir

  // Obtener la última profundidad usada
  const lastBit = group.bits[group.bits.length - 1]
  const lastDepth = lastBit?.end_depth_meters || group.reamer.start_depth_meters || 0

  // Si la última profundidad ya alcanzó o excedió el máximo, no permitir más
  return lastDepth < maxDepth
}

// Calcular espacio restante para brocas
const getRemainingDepth = (group: any): number => {
  const maxDepth = formData.value.drilling_depth_end || 0
  const lastBit = group.bits[group.bits.length - 1]
  const lastDepth = lastBit?.end_depth_meters || group.reamer.start_depth_meters || 0

  return Math.max(0, maxDepth - lastDepth)
}

// Función para limitar valor dentro de un rango
const clampValue = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value))
    return min

  return Math.min(Math.max(value, min), max)
}

// Validation rule for start depth
const startDepthRule = (v: number) => {
  const min = formData.value.drilling_depth_start
  const max = formData.value.drilling_depth_end
  if (min !== null && v < min)
    return `Mínimo: ${min}m`
  if (max !== null && v > max)
    return `Máximo: ${max}m`

  return true
}

// Validation rule for end depth
const endDepthRule = (startDepth: number) => {
  return (v: number) => {
    if (v <= startDepth)
      return 'Debe ser mayor al inicio'
    const max = formData.value.drilling_depth_end
    if (max !== null && v > max)
      return `Máximo: ${max}m`

    return true
  }
}
</script>

<template>
  <div class="pa-6">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 mb-2">
          Herramientas Utilizadas
        </h3>
        <p class="text-body-2 text-medium-emphasis">
          <template v-if="!hasAnyDepth && toolGroups.length === 0">
            <VIcon
              icon="tabler-info-circle"
              size="16"
              class="me-1"
            />
            <strong>Opcional:</strong> Si no hubo perforación este día, puede omitir esta sección.
          </template>
          <template v-else>
            Agregue escarreadores y vincule las brocas utilizadas. Las profundidades se calculan automáticamente.
          </template>
        </p>
      </div>
    </div>

    <!-- Profundidad Avanzada Section -->
    <VCard
      variant="outlined"
      class="mb-4"
    >
      <VCardTitle class="bg-grey-lighten-4">
        <VIcon
          icon="tabler-arrow-down-circle"
          class="me-2"
        />
        Profundidad Avanzada del Día
        <VChip
          v-if="!hasAnyDepth"
          size="x-small"
          color="info"
          class="ms-2"
        >
          Opcional
        </VChip>
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              :model-value="formData.drilling_depth_start"
              label="Profundidad Inicio (m)"
              type="number"
              step="0.01"
              min="0"
              :rules="[rules.nonNegativeNumber]"
              prepend-inner-icon="tabler-arrow-down-circle"
              suffix="m"
              hint="Profundidad al iniciar el turno (dejar vacío si no hubo perforación)"
              persistent-hint
              clearable
              @update:model-value="(v) => updateDrillingDepth('start', v === '' || v === null ? null : Number(v))"
            />
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              :model-value="formData.drilling_depth_end"
              label="Profundidad Fin (m)"
              type="number"
              step="0.01"
              min="0"
              :rules="[rules.nonNegativeNumber]"
              prepend-inner-icon="tabler-arrow-up-circle"
              suffix="m"
              hint="Profundidad al finalizar el turno (dejar vacío si no hubo perforación)"
              persistent-hint
              clearable
              @update:model-value="(v) => updateDrillingDepth('end', v === '' || v === null ? null : Number(v))"
            />
          </VCol>
        </VRow>
        <!-- Resumen de profundidad -->
        <VAlert
          v-if="totalDrillingDepth > 0"
          variant="tonal"
          :color="Math.abs(totalDrillBitDepthFromGroups - totalDrillingDepth) < 0.01 || totalDrillBitDepthFromGroups === 0 ? 'success' : 'warning'"
          class="mt-4"
        >
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <div>
              <VIcon
                icon="tabler-ruler-measure"
                size="18"
                class="me-1"
              />
              Avance total: <strong>{{ totalDrillingDepth.toFixed(2) }}m</strong>
            </div>
            <div v-if="totalDrillBitDepthFromGroups > 0">
              <VIcon
                icon="tabler-tool"
                size="18"
                class="me-1"
              />
              Brocas: <strong>{{ totalDrillBitDepthFromGroups.toFixed(2) }}m</strong>
            </div>
            <div
              v-if="Math.abs(totalDrillBitDepthFromGroups - totalDrillingDepth) >= 0.01 && totalDrillBitDepthFromGroups > 0"
              class="text-error"
            >
              Diferencia: {{ Math.abs(totalDrillBitDepthFromGroups - totalDrillingDepth).toFixed(2) }}m
            </div>
          </div>
        </VAlert>
      </VCardText>
    </VCard>

    <!-- Tool Groups -->
    <div class="tool-groups">
      <div
        v-for="(group, groupIndex) in toolGroups"
        :key="group.id"
        class="mb-4"
      >
        <VCard
          variant="outlined"
          class="tool-group-card"
        >
          <!-- Group Header (Escarreador) -->
          <VCardTitle
            class="d-flex align-center justify-space-between bg-warning-lighten-5 cursor-pointer pa-4"
            @click="toggleGroupExpansion(groupIndex)"
          >
            <div class="d-flex align-center gap-3">
              <VIcon
                :icon="isGroupExpanded(groupIndex) ? 'tabler-chevron-down' : 'tabler-chevron-right'"
                size="24"
              />
              <div>
                <div class="d-flex align-center gap-2">
                  <VIcon
                    icon="tabler-cylinder"
                    size="20"
                    color="warning"
                  />
                  <span class="text-h6">Escarreador {{ groupIndex + 1 }}</span>
                  <VChip
                    size="small"
                    :color="group.bits.length > 0 ? 'primary' : 'default'"
                  >
                    {{ group.bits.length }} broca(s)
                  </VChip>
                </div>
                <div class="text-body-2 text-medium-emphasis mt-1">
                  {{ getReamerDisplayName(group.reamer.tool_id) }}
                  <span
                    v-if="group.bits.length > 0"
                    class="ms-2"
                  >
                    | {{ getGroupDrilledMeters(group).toFixed(2) }}m perforados
                  </span>
                </div>
              </div>
            </div>
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click.stop="removeToolGroup(groupIndex)"
            />
          </VCardTitle>

          <!-- Group Content -->
          <VExpandTransition>
            <VCardText v-show="isGroupExpanded(groupIndex)">
              <!-- Reamer Selection -->
              <VRow class="mb-4">
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    :model-value="group.reamer.tool_id"
                    label="Seleccione Escarreador *"
                    :items="getAvailableReamers(groupIndex)"
                    :loading="loadingTools"
                    :rules="[rules.required]"
                    prepend-inner-icon="tabler-cylinder"
                    :hint="getAvailableReamers(groupIndex).length === 0 ? 'No hay escarreadores disponibles' : ''"
                    persistent-hint
                    @update:model-value="(v) => updateReamer(groupIndex, 'tool_id', v)"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="3"
                >
                  <VSelect
                    :model-value="group.reamer.shift"
                    label="Turno"
                    :items="availableShiftOptions"
                    prepend-inner-icon="tabler-clock"
                    @update:model-value="(v) => updateReamer(groupIndex, 'shift', v)"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="3"
                >
                  <VTextField
                    :model-value="group.reamer.wear_pattern"
                    label="Patrón de Desgaste"
                    prepend-inner-icon="tabler-zoom-question"
                    placeholder="Ej: Uniforme"
                    @update:model-value="(v) => updateReamer(groupIndex, 'wear_pattern', v)"
                  />
                </VCol>
              </VRow>

              <!-- Bits Section -->
              <VDivider class="mb-4" />

              <div class="d-flex align-center justify-space-between mb-3">
                <p class="text-subtitle-1 font-weight-medium mb-0">
                  <VIcon
                    icon="tabler-tool"
                    size="18"
                    class="me-1"
                  />
                  Brocas utilizadas con este escarreador
                  <VChip
                    v-if="getRemainingDepth(group) > 0"
                    size="x-small"
                    color="info"
                    class="ms-2"
                  >
                    {{ getRemainingDepth(group).toFixed(1) }}m disponibles
                  </VChip>
                  <VChip
                    v-else-if="group.bits.length > 0"
                    size="x-small"
                    color="success"
                    class="ms-2"
                  >
                    Completo
                  </VChip>
                </p>
                <VBtn
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="tabler-plus"
                  :disabled="!canAddMoreBits(group)"
                  @click="addBitToGroup(groupIndex)"
                >
                  {{ canAddMoreBits(group) ? 'Agregar Broca' : 'Límite alcanzado' }}
                </VBtn>
              </div>

              <!-- Bits List -->
              <div
                v-if="group.bits.length === 0"
                class="text-center pa-6 bg-grey-lighten-5 rounded"
              >
                <VIcon
                  icon="tabler-tool-off"
                  size="48"
                  class="text-medium-emphasis mb-2"
                />
                <p class="text-body-2 text-medium-emphasis mb-3">
                  {{ canAddMoreBits(group) ? 'No hay brocas agregadas a este escarreador' : 'No hay espacio disponible para brocas' }}
                </p>
                <VBtn
                  v-if="canAddMoreBits(group)"
                  variant="tonal"
                  color="primary"
                  prepend-icon="tabler-plus"
                  @click="addBitToGroup(groupIndex)"
                >
                  Agregar Primera Broca
                </VBtn>
              </div>

              <VCard
                v-for="(bit, bitIndex) in group.bits"
                :key="bitIndex"
                variant="tonal"
                color="primary"
                class="mb-3 pa-4"
              >
                <VRow dense>
                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VSelect
                      :model-value="bit.tool_id"
                      label="Broca *"
                      :items="bitOptions"
                      :loading="loadingTools"
                      :rules="[rules.required]"
                      prepend-inner-icon="tabler-tool"
                      density="compact"
                      @update:model-value="(v) => updateBit(groupIndex, bitIndex, 'tool_id', v)"
                    />
                  </VCol>
                  <VCol
                    cols="6"
                    md="2"
                  >
                    <VSelect
                      :model-value="bit.tool_category"
                      label="Tipo *"
                      :items="bitTypeOptions"
                      density="compact"
                      @update:model-value="(v) => updateBit(groupIndex, bitIndex, 'tool_category', v)"
                    />
                  </VCol>
                  <VCol
                    cols="6"
                    md="2"
                  >
                    <VTextField
                      :model-value="bit.start_depth_meters"
                      label="Desde (m) *"
                      type="number"
                      step="0.01"
                      :min="formData.drilling_depth_start || 0"
                      :max="formData.drilling_depth_end || 9999"
                      :rules="[rules.required, startDepthRule]"
                      density="compact"
                      suffix="m"
                      @update:model-value="(v) => updateBit(groupIndex, bitIndex, 'start_depth_meters', clampValue(Number(v), formData.drilling_depth_start || 0, formData.drilling_depth_end || 9999))"
                    />
                  </VCol>
                  <VCol
                    cols="6"
                    md="2"
                  >
                    <VTextField
                      :model-value="bit.end_depth_meters"
                      label="Hasta (m) *"
                      type="number"
                      step="0.01"
                      :min="bit.start_depth_meters || 0"
                      :max="formData.drilling_depth_end || 9999"
                      :rules="[rules.required, endDepthRule(bit.start_depth_meters)]"
                      density="compact"
                      suffix="m"
                      @update:model-value="(v) => updateBit(groupIndex, bitIndex, 'end_depth_meters', clampValue(Number(v), bit.start_depth_meters || 0, formData.drilling_depth_end || 9999))"
                    />
                  </VCol>
                  <VCol
                    cols="6"
                    md="2"
                    class="d-flex align-center justify-end gap-2"
                  >
                    <VChip
                      size="small"
                      color="success"
                    >
                      {{ (bit.end_depth_meters - bit.start_depth_meters).toFixed(1) }}m
                    </VChip>
                    <VBtn
                      icon="tabler-trash"
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="removeBitFromGroup(groupIndex, bitIndex)"
                    />
                  </VCol>
                </VRow>

                <!-- Campos opcionales colapsados -->
                <VExpandTransition>
                  <VRow
                    v-if="bit.wear_pattern || bit.matrix"
                    dense
                    class="mt-2"
                  >
                    <VCol cols="6">
                      <VTextField
                        :model-value="bit.wear_pattern"
                        label="Patrón Desgaste"
                        density="compact"
                        @update:model-value="(v) => updateBit(groupIndex, bitIndex, 'wear_pattern', v)"
                      />
                    </VCol>
                    <VCol cols="6">
                      <VTextField
                        :model-value="bit.matrix"
                        label="Matriz"
                        density="compact"
                        @update:model-value="(v) => updateBit(groupIndex, bitIndex, 'matrix', v)"
                      />
                    </VCol>
                  </VRow>
                </VExpandTransition>
              </VCard>
            </VCardText>
          </VExpandTransition>
        </VCard>
      </div>

      <!-- Empty State -->
      <VCard
        v-if="toolGroups.length === 0"
        variant="outlined"
        class="text-center pa-8"
        :class="[hasAnyDepth ? 'border-error' : '']"
      >
        <VIcon
          :icon="hasAnyDepth ? 'tabler-alert-triangle' : 'tabler-tools-off'"
          size="64"
          :class="hasAnyDepth ? 'text-error mb-4' : 'text-medium-emphasis mb-4'"
        />
        <h4 class="text-h6 mb-2">
          {{ hasAnyDepth ? 'Herramientas Requeridas' : 'No hay herramientas registradas' }}
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-4">
          <template v-if="hasAnyDepth">
            Ha registrado profundidad avanzada, por lo que debe agregar las herramientas utilizadas.
          </template>
          <template v-else-if="hasAvailableReamers">
            Comience agregando un escarreador y luego las brocas utilizadas.
            <br>
            <span class="text-success">Puede omitir esta sección si no hubo perforación.</span>
          </template>
          <template v-else>
            No hay escarreadores disponibles en el inventario.
          </template>
        </p>
        <div class="d-flex justify-center gap-3 flex-wrap">
          <VBtn
            v-if="hasAvailableReamers"
            color="warning"
            size="large"
            prepend-icon="tabler-plus"
            @click="addToolGroup"
          >
            Agregar Escarreador
          </VBtn>
          <VBtn
            v-if="hasAnyDepth"
            color="secondary"
            variant="outlined"
            size="large"
            prepend-icon="tabler-eraser"
            @click="clearDepthValues"
          >
            Limpiar Profundidad (Omitir)
          </VBtn>
        </div>
      </VCard>

      <!-- Add Group Button -->
      <VBtn
        v-if="toolGroups.length > 0"
        color="warning"
        variant="outlined"
        block
        size="large"
        prepend-icon="tabler-plus"
        class="mt-4"
        :disabled="!hasAvailableReamers"
        @click="addToolGroup"
      >
        {{ hasAvailableReamers ? 'Agregar Otro Escarreador' : 'No hay más escarreadores disponibles' }}
      </VBtn>
    </div>

    <!-- Validation Errors -->
    <VAlert
      v-if="(toolGroups.length > 0 || formData.drilling_depth_start !== null || formData.drilling_depth_end !== null) && (!isToolGroupsStepValid || validationMessages.length > 0)"
      color="error"
      variant="tonal"
      border="start"
      class="mt-4"
    >
      <template #title>
        <VIcon
          icon="tabler-alert-circle"
          class="me-2"
        />
        Validación Requerida
      </template>
      <div v-if="validationMessages.length > 0">
        <p class="mb-2">
          Por favor corrija los siguientes problemas:
        </p>
        <ul class="text-body-2">
          <li
            v-for="(message, idx) in validationMessages"
            :key="idx"
          >
            {{ message }}
          </li>
        </ul>
      </div>
    </VAlert>
  </div>
</template>

<style scoped lang="scss">
.tool-group-card {
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 12%);
  }
}

.cursor-pointer {
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-warning), 0.15) !important;
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
