<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'

interface FilterOption {
  value: any
  label: string
}

interface Filter {
  id: string
  type: 'filter' | 'group'
  field?: string
  alias?: string
  fieldType?: 'text' | 'number' | 'date' | 'select' | 'range' | 'boolean'
  operator?: string
  defaultValue?: any
  value?: any
  required?: boolean
  placeholder?: string
  multiple?: boolean
  options?: FilterOption[]
  advanced?: boolean
  optionsSource?: 'manual' | 'endpoint'
  optionsEndpoint?: string
  min?: number
  max?: number
  step?: number
  children?: Filter[]
  expanded?: boolean
  condition?: 'AND' | 'OR'
}

interface FieldDefinition {
  field: string
  alias: string
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean'
  filterable?: boolean
  options?: FilterOption[]
}

interface Props {
  modelValue: Filter[]
  availableFields: FieldDefinition[]
  loading?: boolean
  error?: string | null
  search?: { enabled: boolean; fields: string[] }
}

interface Emits {
  (e: 'update:modelValue', value: Filter[]): void
  (e: 'validate', isValid: boolean): void
  (e: 'update:search', value: { enabled: boolean; fields: string[] }): void // Nuevo evento
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
const rootGroup = ref<Filter>({
  id: 'root',
  type: 'group',
  condition: 'AND',
  expanded: true,
  children: [],
})

// Para opciones manuales
const manualOptionInputs = ref<Record<string, { value: string; label: string }>>({})

// Panel de configuración expandido
const expandedConfigPanels = ref<Record<string, boolean>>({})

// Operadores por tipo
const operatorsByType = {
  text: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'contains', label: 'Contiene' },
    { value: 'not_contains', label: 'No contiene' },
    { value: 'starts_with', label: 'Empieza con' },
    { value: 'ends_with', label: 'Termina con' },
    { value: 'is_null', label: 'Es nulo' },
    { value: 'is_not_null', label: 'No es nulo' },
  ],
  number: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'greater', label: 'Mayor que' },
    { value: 'greater_equal', label: 'Mayor o igual que' },
    { value: 'less', label: 'Menor que' },
    { value: 'less_equal', label: 'Menor o igual que' },
    { value: 'between', label: 'Entre' },
    { value: 'is_null', label: 'Es nulo' },
    { value: 'is_not_null', label: 'No es nulo' },
  ],
  date: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'greater', label: 'Después de' },
    { value: 'greater_equal', label: 'Desde' },
    { value: 'less', label: 'Antes de' },
    { value: 'less_equal', label: 'Hasta' },
    { value: 'between', label: 'Entre' },
    { value: 'is_null', label: 'Es nulo' },
    { value: 'is_not_null', label: 'No es nulo' },
  ],
  select: [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'in', label: 'Está en lista' },
    { value: 'not_in', label: 'No está en lista' },
    { value: 'is_null', label: 'Es nulo' },
    { value: 'is_not_null', label: 'No es nulo' },
  ],
  boolean: [
    { value: 'equals', label: 'Igual a' },
    { value: 'is_null', label: 'Es nulo' },
    { value: 'is_not_null', label: 'No es nulo' },
  ],
  range: [
    { value: 'between', label: 'Entre' },
  ],
}

// Tipos de filtro disponibles
const filterTypeOptions = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Selección' },
  { value: 'range', label: 'Rango' },
  { value: 'boolean', label: 'Booleano' },
]

// Estado para buscador global
const searchEnabled = ref(false)
const searchFields = ref<string[]>([])

let updatingFromProp = false

// Sincronizar estado local con la prop search
watch(
  () => props.search,
  val => {
    console.log('PROPS SEARCH CHANGED', val)
    updatingFromProp = true
    if (val) {
      searchEnabled.value = val.enabled
      searchFields.value = [...val.fields]
    }
    else {
      searchEnabled.value = false
      searchFields.value = []
    }
    updatingFromProp = false
  },
  { immediate: true, deep: true },
)

function arraysEqual(a: any[], b: any[]) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i])
}

watch([searchEnabled, searchFields], ([enabled, fields]) => {
  if (updatingFromProp)
    return
  if (!props.search || props.search.enabled !== enabled || !arraysEqual(props.search.fields, fields))
    emit('update:search', { enabled, fields })
})

// Inicializar
onMounted(() => {
  console.log('PROPS SEARCH INIT', props.search)
  if (props.modelValue && props.modelValue.length > 0) {
    // Si ya viene con estructura de grupos, usarla
    if (props.modelValue[0]?.type === 'group') {
      rootGroup.value = props.modelValue[0]
    }
    else {
      // Si son filtros simples, convertirlos a la nueva estructura
      rootGroup.value.children = props.modelValue.map(filter => ({
        ...filter,
        type: filter.type || 'filter',
      }))
    }
  }

  // Inicializar inputs manuales
  initializeManualInputs(rootGroup.value)
})

// Inicializar inputs para opciones manuales
const initializeManualInputs = (group: Filter) => {
  if (group.type === 'filter' && !manualOptionInputs.value[group.id])
    manualOptionInputs.value[group.id] = { value: '', label: '' }

  if (group.children)
    group.children.forEach(child => initializeManualInputs(child))
}

// Watch para cambios externos
watch(() => props.modelValue, newVal => {
  if (JSON.stringify(newVal) !== JSON.stringify([rootGroup.value])) {
    if (newVal && newVal.length > 0) {
      if (newVal[0]?.type === 'group') {
        rootGroup.value = newVal[0]
      }
      else {
        rootGroup.value.children = newVal.map(filter => ({
          ...filter,
          type: filter.type || 'filter',
        }))
      }
    }
    else {
      rootGroup.value.children = []
    }
    initializeManualInputs(rootGroup.value)
  }
}, { deep: true })

// Watch para inicializar defaultValue como array cuando el operador sea 'between'
watch(
  () => rootGroup.value,
  newVal => {
    // Función recursiva para todos los filtros
    const ensureBetweenArray = group => {
      if (group.type === 'filter' && group.operator === 'between') {
        if (!Array.isArray(group.defaultValue) || group.defaultValue.length !== 2)
          group.defaultValue = ['', '']
      }
      if (group.children)
        group.children.forEach(child => ensureBetweenArray(child))
    }

    ensureBetweenArray(newVal)
  },
  { deep: true, immediate: true },
)

// Emit cambios
let updateTimeout: NodeJS.Timeout | null = null

const emitUpdate = () => {
  if (updateTimeout)
    clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    // Emitir solo la estructura de grupos principal
    emit('update:modelValue', [rootGroup.value])
    emit('validate', true)
  }, 100)
}

watch(() => rootGroup.value, () => {
  emitUpdate()
}, { deep: true })

// Métodos
const addFilter = (parent: Filter) => {
  const firstAvailable = availableFields.value.find(f => f.filterable !== false)

  const newFilter: Filter = {
    id: `filter_${Date.now()}`,
    type: 'filter',
    field: firstAvailable?.field || '',
    alias: firstAvailable?.alias || '',
    fieldType: 'text',
    operator: 'contains',
    defaultValue: '',
    value: '',
    required: false,
    placeholder: '',
    multiple: false,
    options: [],
    advanced: false,
    optionsSource: 'manual',
  }

  if (!parent.children)
    parent.children = []
  parent.children.push(newFilter)

  // Inicializar input manual
  manualOptionInputs.value[newFilter.id] = { value: '', label: '' }
}

const addGroup = (parent: Filter) => {
  const newGroup: Filter = {
    id: `group_${Date.now()}`,
    type: 'group',
    condition: 'AND',
    expanded: true,
    children: [],
  }

  if (!parent.children)
    parent.children = []
  parent.children.push(newGroup)
}

const removeItem = (parent: Filter, index: number) => {
  if (parent.children) {
    const item = parent.children[index]

    // Limpiar inputs manuales
    if (item.id && manualOptionInputs.value[item.id])
      delete manualOptionInputs.value[item.id]

    parent.children.splice(index, 1)
  }
}

const toggleGroup = (group: Filter) => {
  group.expanded = !group.expanded
}

const toggleConfigPanel = (filterId: string) => {
  expandedConfigPanels.value[filterId] = !expandedConfigPanels.value[filterId]
}

const duplicateItem = (parent: Filter, item: Filter, index: number) => {
  const duplicate = JSON.parse(JSON.stringify(item))

  duplicate.id = `${item.type}_${Date.now()}`

  // Si es un filtro, inicializar su input manual
  if (duplicate.type === 'filter')
    manualOptionInputs.value[duplicate.id] = { value: '', label: '' }

  if (parent.children)
    parent.children.splice(index + 1, 0, duplicate)
}

// Computed
const availableFields = computed(() => {
  return props.availableFields.filter(f => f.filterable !== false)
})

const getFieldType = (fieldName: string): string => {
  const field = props.availableFields.find(f => f.field === fieldName)

  return field?.type || 'text'
}

const getFieldAlias = (fieldName: string): string => {
  const field = props.availableFields.find(f => f.field === fieldName)

  return field?.alias || fieldName
}

const getOperatorsForType = (type: string) => {
  return operatorsByType[type as keyof typeof operatorsByType] || operatorsByType.text
}

const getFieldOptions = (fieldName: string): FilterOption[] => {
  const field = props.availableFields.find(f => f.field === fieldName)

  return field?.options || []
}

const needsValueInput = (operator: string): boolean => {
  return !['is_null', 'is_not_null'].includes(operator)
}

const getValueInputType = (filter: Filter) => {
  if (!needsValueInput(filter.operator || ''))
    return null

  const operator = filter.operator || ''

  if (operator === 'between')
    return 'range'
  if (operator === 'in' || operator === 'not_in')
    return 'multiple'
  if (filter.fieldType === 'select')
    return 'select'
  if (filter.fieldType === 'boolean')
    return 'boolean'
  if (filter.fieldType === 'date')
    return 'date'
  if (filter.fieldType === 'number')
    return 'number'
  if (filter.fieldType === 'range')
    return 'range'

  return 'text'
}

// Manejo de opciones manuales
const addManualOption = (filter: Filter) => {
  const input = manualOptionInputs.value[filter.id]

  const value = input?.value?.trim()
  const label = input?.label?.trim() || value

  if (!value)
    return

  if (!filter.options)
    filter.options = []
  filter.options.push({ value, label })

  // Limpiar inputs
  manualOptionInputs.value[filter.id] = { value: '', label: '' }
}

const removeManualOption = (filter: Filter, optIdx: number) => {
  if (filter.options)
    filter.options.splice(optIdx, 1)
}

// Actualizar campo
const updateFilterField = (filter: Filter, fieldName: string) => {
  const field = props.availableFields.find(f => f.field === fieldName)
  if (field) {
    filter.field = fieldName
    filter.alias = field.alias
    filter.fieldType = field.type || 'text'
    filter.operator = getOperatorsForType(filter.fieldType)[0]?.value || 'equals'

    // Si el campo tiene opciones predefinidas, copiarlas
    if (field.options)
      filter.options = [...field.options]
  }
}

// SQL Preview
const generateSQL = (group: Filter, level = 0): string => {
  if (group.type === 'filter') {
    const field = group.field || ''
    const operator = group.operator || ''
    const value = group.value || group.defaultValue || ''

    switch (operator) {
      case 'contains':
        return `${field} LIKE '%${value}%'`
      case 'not_contains':
        return `${field} NOT LIKE '%${value}%'`
      case 'starts_with':
        return `${field} LIKE '${value}%'`
      case 'ends_with':
        return `${field} LIKE '%${value}'`
      case 'equals':
        return `${field} = '${value}'`
      case 'not_equals':
        return `${field} != '${value}'`
      case 'greater':
        return `${field} > ${value}`
      case 'greater_equal':
        return `${field} >= ${value}`
      case 'less':
        return `${field} < ${value}`
      case 'less_equal':
        return `${field} <= ${value}`
      case 'between':
        const vals = Array.isArray(value) ? value : [value, value]
        return `${field} BETWEEN ${vals[0]} AND ${vals[1]}`
      case 'in':
        return `${field} IN (${Array.isArray(value) ? value.map(v => `'${v}'`).join(', ') : `'${value}'`})`
      case 'not_in':
        return `${field} NOT IN (${Array.isArray(value) ? value.map(v => `'${v}'`).join(', ') : `'${value}'`})`
      case 'is_null':
        return `${field} IS NULL`
      case 'is_not_null':
        return `${field} IS NOT NULL`
      default:
        return ''
    }
  }

  if (group.children && group.children.length > 0) {
    const conditions = group.children
      .map(child => generateSQL(child, level + 1))
      .filter(sql => sql)
      .join(` ${group.condition || 'AND'} `)

    return level > 0 && conditions ? `(${conditions})` : conditions
  }

  return ''
}

const sqlPreview = computed(() => {
  const sql = generateSQL(rootGroup.value)

  return sql ? `WHERE ${sql}` : ''
})

// Cleanup
onUnmounted(() => {
  if (updateTimeout)
    clearTimeout(updateTimeout)
})
</script>

<template>
  <div class="report-filters-advanced">
    <VRow>
      <!-- Buscador global -->
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="d-flex align-center pa-4">
            <VIcon
              icon="tabler-search"
              class="me-2"
            />
            <span>Buscador global</span>
          </VCardTitle>
          <VCardText>
            <VSwitch
              v-model="searchEnabled"
              label="¿Activar buscador global?"
              color="primary"
              hide-details
            />
            <VSelect
              v-if="searchEnabled"
              v-model="searchFields"
              :items="availableFields"
              item-title="alias"
              item-value="field"
              label="Campos sobre los que buscar"
              multiple
              chips
              clearable
              variant="outlined"
              class="mt-2"
              hide-details
            />
            <VAlert
              v-if="searchEnabled && searchFields.length === 0"
              type="info"
              variant="tonal"
              class="mt-2"
              density="compact"
            >
              Selecciona al menos un campo para habilitar el buscador.
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>
      <!-- Fin buscador global -->
      <VCol cols="12">
        <h6 class="text-h6 font-weight-medium mb-2">
          Configuración de Filtros del Reporte
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Define qué filtros estarán disponibles para los usuarios cuando ejecuten este reporte.
          Los usuarios podrán aplicar estos filtros para personalizar los datos mostrados.
        </p>
      </VCol>

      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-adjustments-horizontal"
                class="me-2"
              />
              <span>Definir Filtros Disponibles</span>
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
              Configuración de filtros
            </VChip>
          </VCardTitle>

          <VCardText class="pa-0">
            <!-- Grupo principal -->
            <div class="filter-container pa-4">
              <div class="d-flex align-center justify-space-between mb-3">
                <div class="d-flex align-center">
                  <VIcon
                    icon="tabler-folder"
                    size="20"
                    class="me-2"
                  />
                  <span class="text-body-1">Filtros del reporte</span>
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
                  <span>Los usuarios podrán aplicar estos filtros cuando ejecuten el reporte</span>
                </VTooltip>
              </div>

              <div class="ms-6">
                <div class="d-flex gap-2 mb-3">
                  <VBtn
                    size="small"
                    variant="outlined"
                    @click="addFilter(rootGroup)"
                  >
                    <VIcon
                      icon="tabler-plus"
                      size="16"
                      start
                    />
                    Filtro
                  </VBtn>
                  <VBtn
                    size="small"
                    variant="outlined"
                    @click="addGroup(rootGroup)"
                  >
                    <VIcon
                      icon="tabler-plus"
                      size="16"
                      start
                    />
                    Grupo
                  </VBtn>
                </div>

                <!-- Lista de filtros con drag & drop -->
                <Draggable
                  v-model="rootGroup.children"
                  :animation="200"
                  handle=".drag-handle"
                  ghost-class="ghost"
                  group="filters"
                  item-key="id"
                >
                  <template #item="{ element: item, index }">
                    <div class="filter-item mb-3">
                      <!-- Filtro simple -->
                      <div v-if="item.type === 'filter'">
                        <div class="d-flex align-center gap-2">
                          <VIcon
                            icon="tabler-grip-vertical"
                            size="20"
                            class="drag-handle cursor-move text-medium-emphasis"
                          />
                          <VIcon
                            icon="tabler-filter"
                            size="20"
                            color="primary"
                          />

                          <span class="text-body-2 font-weight-medium me-2">Filtro</span>

                          <!-- Campo -->
                          <VSelect
                            :model-value="item.field"
                            :items="availableFields"
                            item-title="alias"
                            item-value="field"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="flex-grow-0"
                            style="min-inline-size: 200px;"
                            @update:model-value="val => updateFilterField(item, val)"
                          />

                          <!-- Operador -->
                          <VSelect
                            v-model="item.operator"
                            :items="getOperatorsForType(item.fieldType || 'text')"
                            item-title="label"
                            item-value="value"
                            density="compact"
                            variant="outlined"
                            hide-details
                            class="flex-grow-0"
                            style="min-inline-size: 180px;"
                          />

                          <!-- Valor -->
                          <div
                            v-if="needsValueInput(item.operator)"
                            class="flex-grow-1"
                            style="min-inline-size: 200px;"
                          >
                            <!-- Campo de texto -->
                            <VTextField
                              v-if="getValueInputType(item) === 'text'"
                              v-model="item.defaultValue"
                              density="compact"
                              variant="outlined"
                              hide-details
                              :placeholder="item.placeholder || 'Ejemplo: Activo'"
                              prepend-inner-icon="tabler-abc"
                            />

                            <!-- Campo numérico -->
                            <VTextField
                              v-else-if="getValueInputType(item) === 'number'"
                              v-model.number="item.defaultValue"
                              type="number"
                              density="compact"
                              variant="outlined"
                              hide-details
                              :placeholder="item.placeholder || 'Ejemplo: 1000'"
                              :min="item.min"
                              :max="item.max"
                              :step="item.step"
                              prepend-inner-icon="tabler-number"
                            />

                            <!-- Campo de fecha -->
                            <VTextField
                              v-else-if="getValueInputType(item) === 'date'"
                              v-model="item.defaultValue"
                              type="date"
                              density="compact"
                              variant="outlined"
                              hide-details
                              prepend-inner-icon="tabler-calendar"
                            />

                            <!-- Select simple -->
                            <VSelect
                              v-else-if="getValueInputType(item) === 'select' && !item.multiple"
                              v-model="item.defaultValue"
                              :items="item.options || []"
                              item-title="label"
                              item-value="value"
                              density="compact"
                              variant="outlined"
                              hide-details
                              :placeholder="item.placeholder || 'Valor por defecto (opcional)'"
                              clearable
                              prepend-inner-icon="tabler-list"
                            />

                            <!-- Select múltiple -->
                            <VSelect
                              v-else-if="getValueInputType(item) === 'multiple' || (getValueInputType(item) === 'select' && item.multiple)"
                              v-model="item.defaultValue"
                              :items="item.options || []"
                              item-title="label"
                              item-value="value"
                              multiple
                              chips
                              closable-chips
                              density="compact"
                              variant="outlined"
                              hide-details
                              :placeholder="item.placeholder || 'Valores por defecto (opcional)'"
                              clearable
                              prepend-inner-icon="tabler-list-check"
                            />

                            <!-- Boolean -->
                            <VSelect
                              v-else-if="getValueInputType(item) === 'boolean'"
                              v-model="item.defaultValue"
                              :items="[
                                { title: 'Sin valor por defecto', value: null },
                                { title: 'Verdadero', value: true },
                                { title: 'Falso', value: false },
                              ]"
                              density="compact"
                              variant="outlined"
                              hide-details
                              prepend-inner-icon="tabler-toggle-left"
                            />

                            <!-- Rango -->
                            <div
                              v-else-if="getValueInputType(item) === 'range'"
                              class="d-flex gap-2"
                            >
                              <VTextField
                                :model-value="Array.isArray(item.defaultValue) ? item.defaultValue[0] : ''"
                                density="compact"
                                variant="outlined"
                                hide-details
                                placeholder="Min"
                                type="number"
                                :min="item.min"
                                :max="item.max"
                                @update:model-value="val => {
                                  if (!Array.isArray(item.defaultValue)) item.defaultValue = ['', '']
                                  item.defaultValue[0] = val
                                }"
                              />
                              <VTextField
                                :model-value="Array.isArray(item.defaultValue) ? item.defaultValue[1] : ''"
                                density="compact"
                                variant="outlined"
                                hide-details
                                placeholder="Max"
                                type="number"
                                :min="item.min"
                                :max="item.max"
                                @update:model-value="val => {
                                  if (!Array.isArray(item.defaultValue)) item.defaultValue = ['', '']
                                  item.defaultValue[1] = val
                                }"
                              />
                            </div>
                          </div>

                          <!-- Acciones -->
                          <div class="d-flex gap-1">
                            <VBtn
                              icon
                              size="x-small"
                              variant="text"
                              @click="toggleConfigPanel(item.id)"
                            >
                              <VIcon
                                icon="tabler-chevron-down"
                                size="16"
                              />
                              <VTooltip
                                activator="parent"
                                location="top"
                              >
                                Configuración
                              </VTooltip>
                            </VBtn>
                            <VBtn
                              icon
                              size="x-small"
                              variant="text"
                              @click="duplicateItem(rootGroup, item, index)"
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
                              @click="removeItem(rootGroup, index)"
                            >
                              <VIcon
                                icon="tabler-trash"
                                size="16"
                              />
                              <VTooltip
                                activator="parent"
                                location="top"
                              >
                                Eliminar
                              </VTooltip>
                            </VBtn>
                          </div>
                        </div>

                        <!-- Panel de configuración expandible -->
                        <VExpandTransition>
                          <div
                            v-show="expandedConfigPanels[item.id]"
                            class="mt-3 pa-3 bg-grey-lighten-5 rounded"
                          >
                            <VRow>
                              <!-- Configuración básica -->
                              <VCol
                                cols="12"
                                md="6"
                              >
                                <VTextField
                                  v-model="item.alias"
                                  label="Alias del campo"
                                  density="compact"
                                  variant="outlined"
                                  hide-details
                                  class="mb-3"
                                />

                                <VTextField
                                  v-model="item.placeholder"
                                  label="Placeholder"
                                  density="compact"
                                  variant="outlined"
                                  hide-details
                                  class="mb-3"
                                />

                                <VSelect
                                  v-model="item.fieldType"
                                  :items="filterTypeOptions"
                                  item-title="label"
                                  item-value="value"
                                  label="Tipo de filtro"
                                  density="compact"
                                  variant="outlined"
                                  hide-details
                                />
                              </VCol>

                              <!-- Switches de configuración -->
                              <VCol
                                cols="12"
                                md="6"
                              >
                                <VSwitch
                                  v-model="item.required"
                                  label="Campo requerido"
                                  color="warning"
                                  density="compact"
                                  hide-details
                                  class="mb-2"
                                />

                                <VSwitch
                                  v-model="item.advanced"
                                  label="Filtro avanzado"
                                  color="info"
                                  density="compact"
                                  hide-details
                                  class="mb-2"
                                />

                                <VSwitch
                                  v-if="item.fieldType === 'select'"
                                  v-model="item.multiple"
                                  label="Selección múltiple"
                                  color="primary"
                                  density="compact"
                                  hide-details
                                />
                              </VCol>

                              <!-- Configuración para tipo rango -->
                              <VCol
                                v-if="item.fieldType === 'range' || item.fieldType === 'number'"
                                cols="12"
                              >
                                <VRow>
                                  <VCol cols="4">
                                    <VTextField
                                      v-model.number="item.min"
                                      label="Valor mínimo"
                                      type="number"
                                      density="compact"
                                      variant="outlined"
                                      hide-details
                                    />
                                  </VCol>
                                  <VCol cols="4">
                                    <VTextField
                                      v-model.number="item.max"
                                      label="Valor máximo"
                                      type="number"
                                      density="compact"
                                      variant="outlined"
                                      hide-details
                                    />
                                  </VCol>
                                  <VCol cols="4">
                                    <VTextField
                                      v-model.number="item.step"
                                      label="Incremento"
                                      type="number"
                                      density="compact"
                                      variant="outlined"
                                      hide-details
                                    />
                                  </VCol>
                                </VRow>
                              </VCol>

                              <!-- Configuración de opciones para select -->
                              <VCol
                                v-if="item.fieldType === 'select'"
                                cols="12"
                              >
                                <VDivider class="my-3" />

                                <VRadioGroup
                                  v-model="item.optionsSource"
                                  inline
                                  hide-details
                                  class="mb-3"
                                >
                                  <VRadio
                                    label="Opciones manuales"
                                    value="manual"
                                  />
                                  <VRadio
                                    label="Cargar desde endpoint"
                                    value="endpoint"
                                  />
                                </VRadioGroup>

                                <!-- Opciones manuales -->
                                <div v-if="item.optionsSource === 'manual'">
                                  <VCard
                                    variant="tonal"
                                    class="pa-3"
                                  >
                                    <VCardTitle class="text-subtitle-2 pa-0 mb-2">
                                      Agregar opciones
                                    </VCardTitle>
                                    <VRow>
                                      <VCol cols="5">
                                        <VTextField
                                          v-model="manualOptionInputs[item.id].value"
                                          label="Valor"
                                          density="compact"
                                          variant="outlined"
                                          hide-details
                                        />
                                      </VCol>
                                      <VCol cols="5">
                                        <VTextField
                                          v-model="manualOptionInputs[item.id].label"
                                          label="Etiqueta"
                                          density="compact"
                                          variant="outlined"
                                          hide-details
                                        />
                                      </VCol>
                                      <VCol
                                        cols="2"
                                        class="d-flex align-end"
                                      >
                                        <VBtn
                                          icon
                                          color="primary"
                                          variant="tonal"
                                          @click="addManualOption(item)"
                                        >
                                          <VIcon icon="tabler-plus" />
                                        </VBtn>
                                      </VCol>
                                    </VRow>

                                    <VList
                                      v-if="item.options && item.options.length > 0"
                                      density="compact"
                                      class="mt-3"
                                    >
                                      <VListItem
                                        v-for="(opt, optIdx) in item.options"
                                        :key="`${opt.value}-${optIdx}`"
                                      >
                                        <VListItemTitle>
                                          {{ opt.label }}
                                          <span class="text-caption text-grey">({{ opt.value }})</span>
                                        </VListItemTitle>
                                        <template #append>
                                          <VBtn
                                            icon
                                            size="x-small"
                                            variant="text"
                                            color="error"
                                            @click="removeManualOption(item, optIdx)"
                                          >
                                            <VIcon
                                              icon="tabler-trash"
                                              size="14"
                                            />
                                          </VBtn>
                                        </template>
                                      </VListItem>
                                    </VList>
                                    <p
                                      v-else
                                      class="text-caption text-grey mt-2"
                                    >
                                      No hay opciones agregadas
                                    </p>
                                  </VCard>
                                </div>

                                <!-- Endpoint de opciones -->
                                <div v-else-if="item.optionsSource === 'endpoint'">
                                  <VTextField
                                    v-model="item.optionsEndpoint"
                                    label="URL del endpoint"
                                    placeholder="https://api.ejemplo.com/opciones"
                                    density="compact"
                                    variant="outlined"
                                    hide-details
                                    hint="El endpoint debe devolver un array de objetos con 'value' y 'label'"
                                    persistent-hint
                                  />
                                </div>
                              </VCol>
                            </VRow>
                          </div>
                        </VExpandTransition>
                      </div>

                      <!-- Grupo -->
                      <div
                        v-else-if="item.type === 'group'"
                        class="group-container"
                      >
                        <div class="d-flex align-center gap-2 mb-2">
                          <VIcon
                            icon="tabler-grip-vertical"
                            size="20"
                            class="drag-handle cursor-move text-medium-emphasis"
                          />
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            @click="toggleGroup(item)"
                          >
                            <VIcon
                              :icon="item.expanded ? 'tabler-chevron-down' : 'tabler-chevron-right'"
                              size="16"
                            />
                          </VBtn>
                          <VIcon
                            icon="tabler-folders"
                            size="20"
                            color="secondary"
                          />
                          <span class="text-body-2 font-weight-medium">Grupo</span>

                          <!-- Condición del grupo -->
                          <VBtnToggle
                            v-model="item.condition"
                            mandatory
                            divided
                            density="compact"
                            variant="outlined"
                          >
                            <VBtn
                              value="AND"
                              size="small"
                            >
                              Y
                            </VBtn>
                            <VBtn
                              value="OR"
                              size="small"
                            >
                              O
                            </VBtn>
                          </VBtnToggle>

                          <VSpacer />

                          <!-- Acciones del grupo -->
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            @click="duplicateItem(rootGroup, item, index)"
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
                            @click="removeItem(rootGroup, index)"
                          >
                            <VIcon
                              icon="tabler-trash"
                              size="16"
                            />
                            <VTooltip
                              activator="parent"
                              location="top"
                            >
                              Eliminar
                            </VTooltip>
                          </VBtn>
                        </div>

                        <VExpandTransition>
                          <div
                            v-show="item.expanded"
                            class="ms-8"
                          >
                            <div class="d-flex gap-2 mb-2">
                              <VBtn
                                size="x-small"
                                variant="tonal"
                                @click="addFilter(item)"
                              >
                                <VIcon
                                  icon="tabler-plus"
                                  size="14"
                                  start
                                />
                                Filtro
                              </VBtn>
                              <VBtn
                                size="x-small"
                                variant="tonal"
                                @click="addGroup(item)"
                              >
                                <VIcon
                                  icon="tabler-plus"
                                  size="14"
                                  start
                                />
                                Grupo
                              </VBtn>
                            </div>

                            <!-- Recursivo para subgrupos -->
                            <p
                              v-if="!item.children || item.children.length === 0"
                              class="text-caption text-grey"
                            >
                              Grupo vacío - Agrega filtros o subgrupos
                            </p>
                          </div>
                        </VExpandTransition>
                      </div>
                    </div>
                  </template>
                </Draggable>

                <p
                  v-if="!rootGroup.children || rootGroup.children.length === 0"
                  class="text-center text-grey py-4"
                >
                  No hay filtros configurados. Haz clic en "Filtro" o "Grupo" para comenzar.
                </p>
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
                  <span class="text-body-2 font-weight-medium">Ejemplo de SQL cuando el usuario aplique los filtros</span>
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
              <code class="text-caption">{{ sqlPreview || 'Sin filtros configurados' }}</code>
              <p class="text-caption text-medium-emphasis mt-2 mb-0">
                * Este es un ejemplo de cómo se verá la consulta cuando el usuario aplique valores a estos filtros
              </p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Vista previa visual de filtros -->
    <VCard
      v-if="rootGroup.children && rootGroup.children.length > 0"
      variant="outlined"
      class="mt-4"
    >
      <VCardTitle class="text-h6 pa-4">
        <VIcon
          icon="tabler-eye"
          class="me-2"
        />
        Cómo verán los filtros los usuarios
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
          Esta es una simulación de cómo aparecerán los filtros cuando el usuario ejecute el reporte
        </VAlert>

        <div class="user-filters-preview pa-4 rounded border">
          <h6 class="text-subtitle-2 mb-3">
            <VIcon
              icon="tabler-filter"
              size="18"
              class="me-1"
            />
            Filtros disponibles
          </h6>

          <VRow>
            <VCol
              v-for="filter in rootGroup.children.filter(f => f.type === 'filter')"
              :key="filter.id"
              cols="12"
              :md="filter.fieldType === 'range' ? 12 : 6"
            >
              <div class="filter-preview-item">
                <label class="text-body-2 d-flex align-center mb-1">
                  {{ filter.alias || filter.field }}
                  <VIcon
                    v-if="filter.required"
                    icon="tabler-asterisk"
                    size="12"
                    color="error"
                    class="ms-1"
                  />
                  <VTooltip
                    v-if="filter.advanced"
                    location="top"
                  >
                    <template #activator="{ props }">
                      <VIcon
                        icon="tabler-settings"
                        size="14"
                        class="ms-1 text-medium-emphasis"
                        v-bind="props"
                      />
                    </template>
                    <span>Filtro avanzado</span>
                  </VTooltip>
                </label>

                <!-- Simulación del input según el tipo -->
                <VTextField
                  v-if="filter.fieldType === 'text'"
                  :placeholder="filter.placeholder || `Filtrar por ${filter.alias || filter.field}`"
                  density="compact"
                  variant="outlined"
                  readonly
                  prepend-inner-icon="tabler-search"
                />

                <VTextField
                  v-else-if="filter.fieldType === 'number'"
                  :placeholder="filter.placeholder || 'Ingrese un número'"
                  density="compact"
                  variant="outlined"
                  readonly
                  type="number"
                  prepend-inner-icon="tabler-number"
                />

                <VTextField
                  v-else-if="filter.fieldType === 'date'"
                  placeholder="Seleccione fecha"
                  density="compact"
                  variant="outlined"
                  readonly
                  type="date"
                  prepend-inner-icon="tabler-calendar"
                />

                <VSelect
                  v-else-if="filter.fieldType === 'select'"
                  :placeholder="filter.placeholder || 'Seleccione una opción'"
                  density="compact"
                  variant="outlined"
                  readonly
                  :items="[]"
                  :multiple="filter.multiple"
                  :prepend-inner-icon="filter.multiple ? 'tabler-list-check' : 'tabler-list'"
                />

                <div
                  v-else-if="filter.fieldType === 'range'"
                  class="d-flex gap-2"
                >
                  <VTextField
                    :model-value="Array.isArray(filter.defaultValue) ? filter.defaultValue[0] : ''"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="Desde"
                    type="number"
                    @update:model-value="val => {
                      if (!Array.isArray(filter.defaultValue)) filter.defaultValue = ['', '']
                      filter.defaultValue[0] = val
                    }"
                  />
                  <VTextField
                    :model-value="Array.isArray(filter.defaultValue) ? filter.defaultValue[1] : ''"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="Hasta"
                    type="number"
                    @update:model-value="val => {
                      if (!Array.isArray(filter.defaultValue)) filter.defaultValue = ['', '']
                      filter.defaultValue[1] = val
                    }"
                  />
                </div>

                <VSwitch
                  v-else-if="filter.fieldType === 'boolean'"
                  label="Activar/Desactivar"
                  density="compact"
                  readonly
                />
              </div>
            </VCol>
          </VRow>

          <div class="d-flex justify-end mt-4 gap-2">
            <VBtn
              variant="tonal"
              size="small"
              disabled
            >
              <VIcon
                icon="tabler-refresh"
                size="16"
                start
              />
              Limpiar filtros
            </VBtn>
            <VBtn
              color="primary"
              size="small"
              disabled
            >
              <VIcon
                icon="tabler-check"
                size="16"
                start
              />
              Aplicar filtros
            </VBtn>
          </div>
        </div>
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

    <VAlert
      v-if="!rootGroup.children || rootGroup.children.length === 0"
      type="info"
      variant="tonal"
      class="mt-4"
    >
      <template #prepend>
        <VIcon icon="tabler-info-circle" />
      </template>
      <div>
        <strong>Sin filtros configurados</strong>
        <p class="mb-0 mt-1">
          Los filtros son opcionales. Si no configuras filtros, los usuarios verán todos los datos del reporte sin opciones de filtrado.
        </p>
      </div>
    </VAlert>

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
          <span class="text-subtitle-2 font-weight-medium">Ejemplo de uso</span>
        </div>
        <p class="text-body-2 mb-0">
          Si configuras un filtro para el campo "Estado" con opciones "Activo/Inactivo", los usuarios podrán:
        </p>
        <ul class="text-body-2 mt-2 mb-0">
          <li>Ver todos los registros por defecto</li>
          <li>Filtrar solo registros activos</li>
          <li>Filtrar solo registros inactivos</li>
          <li>Combinar este filtro con otros que hayas configurado</li>
        </ul>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.filter-container {
  background-color: rgb(var(--v-theme-surface));
}

.filter-item {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  background-color: rgb(var(--v-theme-surface));
  padding-block: 12px;
  padding-inline: 16px;
  transition: all 0.2s;
}

.filter-item:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 8%);
}

.group-container {
  padding: 12px;
  border-radius: 6px;
  background-color: rgba(var(--v-theme-on-surface), 0.02);
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

/* Mejoras visuales */
.v-select--density-compact .v-field__input {
  padding-block: 4px;
}

.v-text-field--density-compact .v-field__input {
  padding-block: 4px;
}

/* Transiciones suaves */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease;
}

.user-filters-preview {
  border: 1px dashed rgba(var(--v-border-color), 0.5);
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

.filter-preview-item {
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.filter-preview-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
