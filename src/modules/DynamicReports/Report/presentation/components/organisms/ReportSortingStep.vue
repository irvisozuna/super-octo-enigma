<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'

interface SortRule {
  id: string
  field: string
  alias?: string
  direction: 'ASC' | 'DESC'
  nullsHandling?: 'FIRST' | 'LAST' | 'DEFAULT'
  caseSensitive?: boolean
  priority?: number
}

interface Props {
  modelValue: SortRule[]
  availableFields: Array<{
    field: string
    alias: string
    type?: string
    sortable?: boolean
  }>
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: SortRule[]): void
  (e: 'validate', isValid: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  availableFields: () => [],
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

// Estado local
const sortingRules = ref<SortRule[]>([])
const expandedPanels = ref<Record<string, boolean>>({})

// Inicializar
onMounted(() => {
  if (props.modelValue && props.modelValue.length > 0) {
    sortingRules.value = props.modelValue.map((rule, index) => ({
      ...rule,
      priority: index + 1,
    }))
  }
  else {
    // Agregar una regla por defecto si no hay ninguna
    addSortRule()
  }
})

// Watch para cambios externos
watch(() => props.modelValue, newVal => {
  if (JSON.stringify(newVal) !== JSON.stringify(sortingRules.value))
    sortingRules.value = newVal ? [...newVal] : []
}, { deep: true })

// Emit cambios
let updateTimeout: NodeJS.Timeout | null = null

const emitUpdate = () => {
  if (updateTimeout)
    clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    // Actualizar prioridades basadas en el orden
    const rulesWithPriority = sortingRules.value.map((rule, index) => ({
      ...rule,
      priority: index + 1,
    }))

    emit('update:modelValue', rulesWithPriority)
    validateRules()
  }, 100)
}

watch(sortingRules, () => {
  emitUpdate()
}, { deep: true })

// Métodos
const addSortRule = () => {
  const usedFields = sortingRules.value.map(r => r.field)
  const availableField = sortableFields.value.find(f => !usedFields.includes(f.field))

  if (!availableField)
    return

  const newRule: SortRule = {
    id: `sort_${Date.now()}`,
    field: availableField.field,
    alias: availableField.alias,
    direction: 'ASC',
    nullsHandling: 'DEFAULT',
    caseSensitive: false,
    priority: sortingRules.value.length + 1,
  }

  sortingRules.value.push(newRule)
}

const removeRule = (index: number) => {
  sortingRules.value.splice(index, 1)
}

const duplicateRule = (rule: SortRule, index: number) => {
  const duplicate = {
    ...rule,
    id: `sort_${Date.now()}`,
  }

  sortingRules.value.splice(index + 1, 0, duplicate)
}

const togglePanel = (ruleId: string) => {
  expandedPanels.value[ruleId] = !expandedPanels.value[ruleId]
}

const updateRuleField = (rule: SortRule, fieldName: string) => {
  const field = props.availableFields.find(f => f.field === fieldName)
  if (field) {
    rule.field = fieldName
    rule.alias = field.alias
  }
}

// Computed
const sortableFields = computed(() => {
  return props.availableFields.filter(f => f.sortable !== false)
})

const availableFieldsForRule = (currentRuleId: string) => {
  const usedFields = sortingRules.value
    .filter(r => r.id !== currentRuleId)
    .map(r => r.field)

  return sortableFields.value.map(field => ({
    ...field,
    disabled: usedFields.includes(field.field),
  }))
}

const canAddMore = computed(() => {
  const usedFields = sortingRules.value.map(r => r.field)

  return sortableFields.value.some(f => !usedFields.includes(f.field))
})

// Validación
const validateRules = () => {
  const isValid = sortingRules.value.length > 0
    && sortingRules.value.every(rule => rule.field)

  emit('validate', isValid)
}

// Iconos para dirección
const getDirectionIcon = (direction: string) => {
  return direction === 'ASC' ? 'tabler-sort-ascending' : 'tabler-sort-descending'
}

const getDirectionColor = (direction: string) => {
  return direction === 'ASC' ? 'primary' : 'secondary'
}

// SQL Preview
const generateOrderBySQL = () => {
  if (sortingRules.value.length === 0)
    return ''

  const orderClauses = sortingRules.value.map(rule => {
    let clause = `${rule.field} ${rule.direction}`

    if (rule.nullsHandling && rule.nullsHandling !== 'DEFAULT')
      clause += ` NULLS ${rule.nullsHandling}`

    if (rule.caseSensitive === false)
      clause = `LOWER(${rule.field}) ${rule.direction}`

    return clause
  })

  return `ORDER BY ${orderClauses.join(', ')}`
}

const sqlPreview = computed(() => generateOrderBySQL())

// Cleanup
onUnmounted(() => {
  if (updateTimeout)
    clearTimeout(updateTimeout)
})
</script>

<template>
  <div class="report-sorting-advanced">
    <VRow>
      <VCol cols="12">
        <h6 class="text-h6 font-weight-medium mb-2">
          Configuración de Ordenamiento del Reporte
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Define cómo se ordenarán los datos del reporte por defecto. Los usuarios podrán cambiar el ordenamiento si lo permites.
        </p>
      </VCol>

      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-arrows-sort"
                class="me-2"
              />
              <span>Reglas de Ordenamiento</span>
            </div>
            <VChip
              size="small"
              variant="tonal"
              color="info"
            >
              <VIcon
                icon="tabler-info-circle"
                size="16"
                start
              />
              Orden por prioridad
            </VChip>
          </VCardTitle>

          <VCardText class="pa-0">
            <div class="sorting-container pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center">
                  <VIcon
                    icon="tabler-list-numbers"
                    size="20"
                    class="me-2"
                  />
                  <span class="text-body-1">Campos de ordenamiento</span>
                </div>
                <VTooltip location="top">
                  <template #activator="{ props }">
                    <VIcon
                      icon="tabler-help-circle"
                      size="18"
                      v-bind="props"
                      class="text-medium-emphasis"
                    />
                  </template>
                  <span>El orden de prioridad se aplica de arriba hacia abajo</span>
                </VTooltip>
              </div>

              <div class="ms-4">
                <!-- Lista de reglas con drag & drop -->
                <Draggable
                  v-model="sortingRules"
                  :animation="200"
                  handle=".drag-handle"
                  ghost-class="ghost"
                  item-key="id"
                >
                  <template #item="{ element: rule, index }">
                    <div class="sort-rule-item mb-3">
                      <div class="d-flex align-center gap-2">
                        <!-- Drag handle -->
                        <VIcon
                          icon="tabler-grip-vertical"
                          size="20"
                          class="drag-handle cursor-move text-medium-emphasis"
                        />

                        <!-- Número de prioridad -->
                        <VChip
                          :color="index === 0 ? 'primary' : 'default'"
                          size="small"
                          variant="tonal"
                        >
                          {{ index + 1 }}
                        </VChip>

                        <!-- Campo -->
                        <VSelect
                          :model-value="rule.field"
                          :items="availableFieldsForRule(rule.id)"
                          item-title="alias"
                          item-value="field"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="flex-grow-0"
                          style="min-inline-size: 250px;"
                          @update:model-value="val => updateRuleField(rule, val)"
                        >
                          <template #prepend-inner>
                            <VIcon
                              icon="tabler-database"
                              size="18"
                            />
                          </template>
                        </VSelect>

                        <!-- Dirección -->
                        <VBtnToggle
                          v-model="rule.direction"
                          mandatory
                          divided
                          density="compact"
                          variant="outlined"
                        >
                          <VBtn
                            value="ASC"
                            size="small"
                          >
                            <VIcon
                              icon="tabler-sort-ascending"
                              size="16"
                              start
                            />
                            A-Z
                          </VBtn>
                          <VBtn
                            value="DESC"
                            size="small"
                          >
                            <VIcon
                              icon="tabler-sort-descending"
                              size="16"
                              start
                            />
                            Z-A
                          </VBtn>
                        </VBtnToggle>

                        <VSpacer />

                        <!-- Acciones -->
                        <div class="d-flex gap-1">
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            @click="togglePanel(rule.id)"
                          >
                            <VIcon
                              :icon="expandedPanels[rule.id] ? 'tabler-chevron-up' : 'tabler-chevron-down'"
                              size="16"
                            />
                            <VTooltip
                              activator="parent"
                              location="top"
                            >
                              Opciones avanzadas
                            </VTooltip>
                          </VBtn>
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            @click="duplicateRule(rule, index)"
                          >
                            <VIcon
                              icon="tabler-copy"
                              size="16"
                            />
                            <VTooltip
                              activator="parent"
                              location="top"
                            >
                              Duplicar
                            </VTooltip>
                          </VBtn>
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            color="error"
                            :disabled="sortingRules.length === 1"
                            @click="removeRule(index)"
                          >
                            <VIcon
                              icon="tabler-trash"
                              size="16"
                            />
                            <VTooltip
                              activator="parent"
                              location="top"
                            >
                              {{ sortingRules.length === 1 ? 'Debe haber al menos una regla' : 'Eliminar' }}
                            </VTooltip>
                          </VBtn>
                        </div>
                      </div>

                      <!-- Panel de opciones avanzadas -->
                      <VExpandTransition>
                        <div
                          v-show="expandedPanels[rule.id]"
                          class="mt-3 pa-3 bg-grey-lighten-5 rounded"
                        >
                          <VRow>
                            <VCol
                              cols="12"
                              md="6"
                            >
                              <VSelect
                                v-model="rule.nullsHandling"
                                label="Manejo de valores nulos"
                                :items="[
                                  { title: 'Por defecto del motor', value: 'DEFAULT' },
                                  { title: 'Nulos al principio', value: 'FIRST' },
                                  { title: 'Nulos al final', value: 'LAST' },
                                ]"
                                density="compact"
                                variant="outlined"
                                hide-details
                              >
                                <template #prepend-inner>
                                  <VIcon
                                    icon="tabler-circle-dashed"
                                    size="18"
                                  />
                                </template>
                              </VSelect>
                            </VCol>
                            <VCol
                              cols="12"
                              md="6"
                              class="d-flex align-center"
                            >
                              <VSwitch
                                v-model="rule.caseSensitive"
                                label="Distinguir mayúsculas/minúsculas"
                                color="primary"
                                density="compact"
                                hide-details
                              />
                            </VCol>
                          </VRow>
                        </div>
                      </VExpandTransition>
                    </div>
                  </template>
                </Draggable>

                <!-- Mensaje cuando no hay reglas -->
                <div
                  v-if="sortingRules.length === 0"
                  class="text-center py-8"
                >
                  <VIcon
                    icon="tabler-arrows-sort"
                    size="48"
                    color="grey"
                    class="mb-3"
                  />
                  <p class="text-body-2 text-medium-emphasis">
                    No hay reglas de ordenamiento configuradas
                  </p>
                </div>

                <!-- Botón agregar -->
                <VBtn
                  variant="outlined"
                  :disabled="!canAddMore"
                  class="mt-2"
                  @click="addSortRule"
                >
                  <VIcon
                    icon="tabler-plus"
                    size="16"
                    start
                  />
                  Agregar campo de ordenamiento
                </VBtn>
              </div>
            </div>

            <!-- SQL Preview -->
            <VDivider />
            <div class="pa-4 bg-grey-lighten-5">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="d-flex align-center">
                  <VIcon
                    icon="tabler-code"
                    size="20"
                    class="me-2"
                  />
                  <span class="text-body-2 font-weight-medium">Cláusula ORDER BY generada</span>
                </div>
                <VBtn
                  v-if="sqlPreview"
                  icon
                  size="x-small"
                  variant="text"
                  @click="() => navigator.clipboard.writeText(sqlPreview)"
                >
                  <VIcon
                    icon="tabler-copy"
                    size="16"
                  />
                  <VTooltip
                    activator="parent"
                    location="top"
                  >
                    Copiar SQL
                  </VTooltip>
                </VBtn>
              </div>
              <code class="text-caption">{{ sqlPreview || 'Sin ordenamiento configurado' }}</code>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Vista previa visual -->
    <VCard
      v-if="sortingRules.length > 0"
      variant="outlined"
      class="mt-4"
    >
      <VCardTitle class="text-h6 pa-4">
        <VIcon
          icon="tabler-eye"
          class="me-2"
        />
        Vista previa del ordenamiento
      </VCardTitle>
      <VCardText>
        <VAlert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <VIcon
            icon="tabler-bulb"
            size="18"
          />
          Los datos se ordenarán siguiendo estas prioridades
        </VAlert>

        <div class="sorting-preview pa-4 rounded border">
          <VTable density="compact">
            <thead>
              <tr>
                <th
                  class="text-left"
                  style="inline-size: 60px;"
                >
                  Prioridad
                </th>
                <th class="text-left">
                  Campo
                </th>
                <th class="text-left">
                  Orden
                </th>
                <th class="text-left">
                  Configuración
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(rule, index) in sortingRules"
                :key="rule.id"
              >
                <td>
                  <VChip
                    :color="index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ index + 1 }}°
                  </VChip>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <VIcon
                      icon="tabler-database"
                      size="16"
                      class="me-2"
                    />
                    {{ rule.alias || rule.field }}
                  </div>
                </td>
                <td>
                  <VChip
                    :color="getDirectionColor(rule.direction)"
                    size="small"
                    variant="tonal"
                  >
                    <VIcon
                      :icon="getDirectionIcon(rule.direction)"
                      size="16"
                      start
                    />
                    {{ rule.direction === 'ASC' ? 'Ascendente' : 'Descendente' }}
                  </VChip>
                </td>
                <td>
                  <div class="d-flex gap-2">
                    <VChip
                      v-if="rule.caseSensitive"
                      size="x-small"
                      variant="outlined"
                    >
                      <VIcon
                        icon="tabler-letter-case"
                        size="14"
                        start
                      />
                      Case sensitive
                    </VChip>
                    <VChip
                      v-if="rule.nullsHandling !== 'DEFAULT'"
                      size="x-small"
                      variant="outlined"
                    >
                      <VIcon
                        icon="tabler-circle-dashed"
                        size="14"
                        start
                      />
                      Nulos {{ rule.nullsHandling === 'FIRST' ? 'primero' : 'último' }}
                    </VChip>
                  </div>
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>
    </VCard>

    <!-- Ejemplo de uso -->
    <VCard
      variant="tonal"
      class="mt-4"
    >
      <VCardText>
        <div class="d-flex align-center mb-2">
          <VIcon
            icon="tabler-bulb"
            size="20"
            color="warning"
            class="me-2"
          />
          <span class="text-subtitle-2 font-weight-medium">Ejemplo de aplicación</span>
        </div>
        <p class="text-body-2 mb-2">
          Si configuras ordenamiento por:
        </p>
        <ol class="text-body-2 ms-4">
          <li><strong>Estado (DESC)</strong> - Los activos aparecerán primero</li>
          <li><strong>Fecha (ASC)</strong> - Dentro de cada estado, ordenados por fecha antigua a reciente</li>
          <li><strong>Nombre (ASC)</strong> - Si hay misma fecha, ordenados alfabéticamente</li>
        </ol>
        <p class="text-body-2 mt-2 mb-0">
          <VIcon
            icon="tabler-info-circle"
            size="16"
            class="me-1"
          />
          Los usuarios podrán cambiar este ordenamiento al visualizar el reporte si lo permites en la configuración.
        </p>
      </VCardText>
    </VCard>

    <!-- Mensajes de error o información -->
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ error }}
    </VAlert>
  </div>
</template>

<style scoped>
.sorting-container {
  background-color: rgb(var(--v-theme-surface));
}

.sort-rule-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  background-color: rgb(var(--v-theme-surface));
  padding-block: 12px;
  padding-inline: 16px;
  transition: all 0.2s;
}

.sort-rule-item:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 8%);
}

.drag-handle {
  cursor: move;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.drag-handle:hover {
  opacity: 1;
}

.ghost {
  background: rgba(var(--v-theme-primary), 0.1);
  opacity: 0.5;
}

.cursor-move {
  cursor: move;
}

code {
  display: block;
  padding: 12px;
  border-radius: 6px;
  background-color: rgba(var(--v-theme-on-surface), 0.06);
  font-family: Consolas, Monaco, "Courier New", monospace;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.bg-grey-lighten-5 {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.sorting-preview {
  border: 1px dashed rgba(var(--v-border-color), 0.5);
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

/* Transiciones suaves */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease;
}
</style>
