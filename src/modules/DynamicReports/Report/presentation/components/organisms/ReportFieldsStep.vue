<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Draggable from 'vuedraggable'

interface Field {
  id: string
  field: string
  alias: string
  type?: string
  format: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'datetime' | 'boolean' | 'custom'
  width: number | 'auto'
  minWidth?: number
  maxWidth?: number
  align: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'CONCAT' | 'DISTINCT'
  sortable: boolean
  filterable: boolean
  visible: boolean
  frozen?: boolean
  wrapText?: boolean
  tooltip?: boolean
  order: number

  // Formato específico
  prefix?: string
  suffix?: string
  decimals?: number
  thousandsSeparator?: boolean
  dateFormat?: string
  timeFormat?: string
  trueValue?: string
  falseValue?: string
  customFormat?: string

  // Estilos
  bold?: boolean
  italic?: boolean
  underline?: boolean
  textColor?: string
  backgroundColor?: string
  conditionalFormatting?: Array<{
    condition: string
    operator: string
    value: any
    style: any
  }>
}

interface AvailableField {
  name: string
  label: string
  type: string
  display_format?: string
  default_width?: number
  sortable?: boolean
  filterable?: boolean
}

interface Props {
  modelValue: Field[]
  availableFields: AvailableField[]
  dataSourceId?: string
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: Field[]): void
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

// Estado
const selectedFields = ref<Field[]>([])
const expandedPanels = ref<Record<string, boolean>>({})
const searchAvailable = ref('')
const searchSelected = ref('')
const showAdvancedConfig = ref(false)
const editingField = ref<Field | null>(null)

// Tabs para configuración avanzada
const configTab = ref('format')

// Formatos disponibles por tipo
const formatsByType = {
  text: [
    { value: 'text', title: 'Texto simple' },
    { value: 'custom', title: 'Formato personalizado' },
  ],
  number: [
    { value: 'number', title: 'Número' },
    { value: 'currency', title: 'Moneda' },
    { value: 'percentage', title: 'Porcentaje' },
    { value: 'custom', title: 'Formato personalizado' },
  ],
  date: [
    { value: 'date', title: 'Solo fecha' },
    { value: 'datetime', title: 'Fecha y hora' },
    { value: 'custom', title: 'Formato personalizado' },
  ],
  boolean: [
    { value: 'boolean', title: 'Verdadero/Falso' },
    { value: 'custom', title: 'Valores personalizados' },
  ],
}

// Formatos de fecha predefinidos
const dateFormats = [
  { value: 'DD/MM/YYYY', title: '31/12/2024' },
  { value: 'MM/DD/YYYY', title: '12/31/2024' },
  { value: 'YYYY-MM-DD', title: '2024-12-31' },
  { value: 'DD MMM YYYY', title: '31 Dic 2024' },
  { value: 'MMMM DD, YYYY', title: 'Diciembre 31, 2024' },
]

const timeFormats = [
  { value: 'HH:mm', title: '23:59' },
  { value: 'HH:mm:ss', title: '23:59:59' },
  { value: 'hh:mm A', title: '11:59 PM' },
  { value: 'hh:mm:ss A', title: '11:59:59 PM' },
]

// Operadores de agregación por tipo
const aggregationsByType = {
  text: [
    { value: 'COUNT', title: 'Contar' },
    { value: 'DISTINCT', title: 'Contar únicos' },
    { value: 'CONCAT', title: 'Concatenar' },
  ],
  number: [
    { value: 'SUM', title: 'Suma' },
    { value: 'AVG', title: 'Promedio' },
    { value: 'COUNT', title: 'Contar' },
    { value: 'MIN', title: 'Mínimo' },
    { value: 'MAX', title: 'Máximo' },
  ],
  date: [
    { value: 'COUNT', title: 'Contar' },
    { value: 'MIN', title: 'Primera fecha' },
    { value: 'MAX', title: 'Última fecha' },
  ],
  boolean: [
    { value: 'COUNT', title: 'Contar' },
  ],
}

// Inicializar
onMounted(() => {
  if (props.modelValue && props.modelValue.length > 0) {
    selectedFields.value = props.modelValue.map((field, index) => ({
      ...field,
      id: field.id || `field_${Date.now()}_${index}`,
      order: index,
    }))
  }
  validateFields()
})

// Watchers
watch(() => props.modelValue, newVal => {
  if (JSON.stringify(newVal) !== JSON.stringify(selectedFields.value))
    selectedFields.value = newVal ? [...newVal] : []
}, { deep: true })

watch(selectedFields, () => {
  emitUpdate()
}, { deep: true })

// Métodos
const emitUpdate = () => {
  emit('update:modelValue', selectedFields.value)
  validateFields()
}

const validateFields = () => {
  const isValid = selectedFields.value.length > 0

  emit('validate', isValid)
}

// Campos disponibles filtrados
const filteredAvailableFields = computed(() => {
  const selected = selectedFields.value.map(f => f.field)

  return props.availableFields
    .filter(f => !selected.includes(f.name))
    .filter(f => {
      if (!searchAvailable.value)
        return true
      const search = searchAvailable.value.toLowerCase()

      return f.label.toLowerCase().includes(search)
             || f.name.toLowerCase().includes(search)
    })
})

// Campos seleccionados filtrados
const filteredSelectedFields = computed(() => {
  if (!searchSelected.value)
    return selectedFields.value
  const search = searchSelected.value.toLowerCase()

  return selectedFields.value.filter(f =>
    f.alias.toLowerCase().includes(search)
    || f.field.toLowerCase().includes(search),
  )
})

// Agregar campo
const addField = (availableField: AvailableField) => {
  const newField: Field = {
    id: `field_${Date.now()}`,
    field: availableField.name,
    alias: availableField.label || availableField.name,
    type: availableField.type,
    format: getDefaultFormat(availableField.type),
    width: availableField.default_width || 150,
    align: getDefaultAlign(availableField.type),
    sortable: availableField.sortable !== false,
    filterable: availableField.filterable !== false,
    visible: true,
    order: selectedFields.value.length,
    wrapText: false,
    tooltip: true,
    thousandsSeparator: true,
    decimals: 2,
  }

  selectedFields.value.push(newField)
}

// Agregar todos los campos
const addAllFields = () => {
  filteredAvailableFields.value.forEach(field => {
    if (!selectedFields.value.some(f => f.field === field.name))
      addField(field)
  })
}

// Eliminar campo
const removeField = (index: number) => {
  selectedFields.value.splice(index, 1)
}

// Eliminar todos los campos
const removeAllFields = () => {
  selectedFields.value = []
}

// Duplicar campo
const duplicateField = (field: Field, index: number) => {
  const duplicate = {
    ...field,
    id: `field_${Date.now()}`,
    alias: `${field.alias} (copia)`,
  }

  selectedFields.value.splice(index + 1, 0, duplicate)
}

// Abrir configuración avanzada
const openAdvancedConfig = (field: Field) => {
  editingField.value = { ...field }
  showAdvancedConfig.value = true
  configTab.value = 'format'
}

// Guardar configuración avanzada
const saveAdvancedConfig = () => {
  if (editingField.value) {
    const index = selectedFields.value.findIndex(f => f.id === editingField.value!.id)
    if (index >= 0)
      selectedFields.value[index] = { ...editingField.value }
  }
  showAdvancedConfig.value = false
  editingField.value = null
}

// Helpers
const getDefaultFormat = (type: string): Field['format'] => {
  switch (type) {
    case 'integer':
    case 'decimal':
    case 'float':
    case 'double':
      return 'number'
    case 'date':
      return 'date'
    case 'datetime':
    case 'timestamp':
      return 'datetime'
    case 'boolean':
      return 'boolean'
    default:
      return 'text'
  }
}

const getDefaultAlign = (type: string): Field['align'] => {
  switch (type) {
    case 'integer':
    case 'decimal':
    case 'float':
    case 'double':
    case 'currency':
      return 'right'
    case 'boolean':
      return 'center'
    default:
      return 'left'
  }
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case 'integer':
    case 'decimal':
    case 'float':
    case 'double':
      return 'tabler-number'
    case 'currency':
      return 'tabler-currency-dollar'
    case 'date':
    case 'datetime':
    case 'timestamp':
      return 'tabler-calendar'
    case 'boolean':
      return 'tabler-toggle-right'
    case 'text':
    default:
      return 'tabler-text'
  }
}

const getFieldTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    text: 'Texto',
    integer: 'Entero',
    decimal: 'Decimal',
    float: 'Decimal',
    double: 'Decimal',
    currency: 'Moneda',
    date: 'Fecha',
    datetime: 'Fecha/Hora',
    timestamp: 'Fecha/Hora',
    boolean: 'Booleano',
  }

  return types[type] || type
}

const getFormatOptions = (type: string) => {
  return formatsByType[type as keyof typeof formatsByType] || formatsByType.text
}

const getAggregationOptions = (type: string) => {
  const baseType = ['integer', 'decimal', 'float', 'double', 'currency'].includes(type)
    ? 'number'
    : ['date', 'datetime', 'timestamp'].includes(type)
      ? 'date'
      : type === 'boolean' ? 'boolean' : 'text'

  return aggregationsByType[baseType as keyof typeof aggregationsByType] || []
}

// Toggle de paneles
const togglePanel = (fieldId: string) => {
  expandedPanels.value[fieldId] = !expandedPanels.value[fieldId]
}

const getExampleValue = (field: Field) => {
  switch (field.format) {
    case 'number':
      return field.thousandsSeparator ? '1,234.56' : '1234.56'
    case 'currency':
      return `${field.prefix || ''}1,234.56${field.suffix || ''}`
    case 'percentage':
      return '85.50%'
    case 'date':
      return '31/12/2024'
    case 'datetime':
      return '31/12/2024 23:59'
    case 'boolean':
      return field.trueValue || 'Sí'
    default:
      return 'Texto de ejemplo'
  }
}
</script>

<template>
  <div class="report-fields-advanced">
    <VRow>
      <VCol cols="12">
        <h6 class="text-h6 font-weight-medium mb-2">
          Selección y Configuración de Campos
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Selecciona los campos que aparecerán en el reporte y configura cómo se mostrarán.
        </p>
      </VCol>
    </VRow>

    <VRow>
      <!-- Panel de campos disponibles -->
      <VCol
        cols="12"
        md="5"
      >
        <VCard
          variant="outlined"
          class="h-100"
        >
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-database"
                class="me-2"
              />
              <span>Campos disponibles</span>
              <VChip
                size="small"
                class="ms-2"
              >
                {{ filteredAvailableFields.length }}
              </VChip>
            </div>
            <VBtn
              icon
              size="small"
              variant="text"
              :disabled="filteredAvailableFields.length === 0"
              @click="addAllFields"
            >
              <VIcon icon="tabler-chevrons-right" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Agregar todos
              </VTooltip>
            </VBtn>
          </VCardTitle>

          <VCardText class="pa-0">
            <!-- Búsqueda -->
            <div class="pa-4 pt-0">
              <VTextField
                v-model="searchAvailable"
                placeholder="Buscar campos..."
                density="compact"
                variant="outlined"
                hide-details
                clearable
              >
                <template #prepend-inner>
                  <VIcon
                    icon="tabler-search"
                    size="18"
                  />
                </template>
              </VTextField>
            </div>

            <!-- Lista de campos -->
            <div class="available-fields-list">
              <div
                v-for="field in filteredAvailableFields"
                :key="field.name"
                class="field-item available"
                @dblclick="addField(field)"
              >
                <div class="d-flex align-center flex-grow-1">
                  <VIcon
                    :icon="getFieldIcon(field.type)"
                    size="20"
                    class="me-3 text-medium-emphasis"
                  />
                  <div class="flex-grow-1">
                    <div class="field-label">
                      {{ field.label }}
                    </div>
                    <div class="field-info">
                      <span class="text-caption text-medium-emphasis">{{ field.name }}</span>
                      <VChip
                        size="x-small"
                        variant="tonal"
                        class="ms-2"
                      >
                        {{ getFieldTypeLabel(field.type) }}
                      </VChip>
                    </div>
                  </div>
                </div>
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  @click="addField(field)"
                >
                  <VIcon
                    icon="tabler-plus"
                    size="18"
                  />
                </VBtn>
              </div>

              <div
                v-if="filteredAvailableFields.length === 0"
                class="text-center py-8"
              >
                <VIcon
                  icon="tabler-database-off"
                  size="48"
                  color="grey"
                  class="mb-3"
                />
                <p class="text-body-2 text-medium-emphasis">
                  {{ searchAvailable ? 'No se encontraron campos' : 'Todos los campos ya están seleccionados' }}
                </p>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Flecha central -->
      <VCol
        cols="12"
        md="2"
        class="d-flex align-center justify-center"
      >
        <div class="transfer-arrows d-none d-md-flex flex-column gap-4">
          <VIcon
            icon="tabler-arrow-right"
            size="32"
            color="primary"
          />
          <VIcon
            icon="tabler-arrow-left"
            size="32"
            color="secondary"
          />
        </div>
      </VCol>

      <!-- Panel de campos seleccionados -->
      <VCol
        cols="12"
        md="5"
      >
        <VCard
          variant="outlined"
          class="h-100"
        >
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-list-check"
                class="me-2"
              />
              <span>Campos seleccionados</span>
              <VChip
                size="small"
                class="ms-2"
                :color="selectedFields.length > 0 ? 'primary' : 'default'"
              >
                {{ selectedFields.length }}
              </VChip>
            </div>
            <VBtn
              icon
              size="small"
              variant="text"
              color="error"
              :disabled="selectedFields.length === 0"
              @click="removeAllFields"
            >
              <VIcon icon="tabler-chevrons-left" />
              <VTooltip
                activator="parent"
                location="top"
              >
                Quitar todos
              </VTooltip>
            </VBtn>
          </VCardTitle>

          <VCardText class="pa-0">
            <!-- Búsqueda -->
            <div class="pa-4 pt-0">
              <VTextField
                v-model="searchSelected"
                placeholder="Buscar campos seleccionados..."
                density="compact"
                variant="outlined"
                hide-details
                clearable
              >
                <template #prepend-inner>
                  <VIcon
                    icon="tabler-search"
                    size="18"
                  />
                </template>
              </VTextField>
            </div>

            <!-- Lista de campos con drag & drop -->
            <Draggable
              v-model="selectedFields"
              :animation="200"
              handle=".drag-handle"
              ghost-class="ghost"
              item-key="id"
              class="selected-fields-list"
            >
              <template #item="{ element: field, index }">
                <div
                  v-show="!searchSelected
                    || field.alias.toLowerCase().includes(searchSelected.toLowerCase())
                    || field.field.toLowerCase().includes(searchSelected.toLowerCase())"
                  class="field-item selected"
                >
                  <div class="field-header">
                    <div class="d-flex align-center flex-grow-1">
                      <VIcon
                        icon="tabler-grip-vertical"
                        size="20"
                        class="drag-handle cursor-move text-medium-emphasis me-2"
                      />
                      <VIcon
                        :icon="getFieldIcon(field.type)"
                        size="20"
                        class="me-2"
                      />
                      <div class="flex-grow-1">
                        <div class="field-label">
                          {{ field.alias }}
                          <VIcon
                            v-if="!field.visible"
                            icon="tabler-eye-off"
                            size="16"
                            class="ms-1 text-warning"
                          />
                        </div>
                        <div class="field-info">
                          <span class="text-caption text-medium-emphasis">{{ field.field }}</span>
                          <VChip
                            v-if="field.aggregation"
                            size="x-small"
                            color="info"
                            class="ms-2"
                          >
                            {{ field.aggregation }}
                          </VChip>
                          <VChip
                            v-if="field.format !== 'text'"
                            size="x-small"
                            variant="tonal"
                            class="ms-2"
                          >
                            {{ field.format }}
                          </VChip>
                        </div>
                      </div>
                    </div>

                    <div class="d-flex gap-1">
                      <VBtn
                        icon
                        size="x-small"
                        variant="text"
                        @click="togglePanel(field.id)"
                      >
                        <VIcon
                          :icon="expandedPanels[field.id] ? 'tabler-chevron-up' : 'tabler-chevron-down'"
                          size="16"
                        />
                      </VBtn>
                      <VBtn
                        icon
                        size="x-small"
                        variant="text"
                        @click="openAdvancedConfig(field)"
                      >
                        <VIcon
                          icon="tabler-settings"
                          size="16"
                        />
                        <VTooltip
                          activator="parent"
                          location="top"
                        >
                          Configuración avanzada
                        </VTooltip>
                      </VBtn>
                      <VBtn
                        icon
                        size="x-small"
                        variant="text"
                        @click="duplicateField(field, index)"
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
                        @click="removeField(index)"
                      >
                        <VIcon
                          icon="tabler-x"
                          size="16"
                        />
                      </VBtn>
                    </div>
                  </div>

                  <!-- Panel de configuración rápida -->
                  <VExpandTransition>
                    <div
                      v-show="expandedPanels[field.id]"
                      class="field-config"
                    >
                      <VRow>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <VTextField
                            v-model="field.alias"
                            label="Nombre a mostrar"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="6"
                        >
                          <VSelect
                            v-model="field.format"
                            label="Formato"
                            :items="getFormatOptions(field.type)"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="4"
                        >
                          <VTextField
                            v-model.number="field.width"
                            label="Ancho"
                            type="number"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="4"
                        >
                          <VSelect
                            v-model="field.align"
                            label="Alineación"
                            :items="[
                              { value: 'left', title: 'Izquierda' },
                              { value: 'center', title: 'Centro' },
                              { value: 'right', title: 'Derecha' },
                            ]"
                            density="compact"
                            variant="outlined"
                            hide-details
                          />
                        </VCol>
                        <VCol
                          cols="12"
                          md="4"
                        >
                          <VSelect
                            v-model="field.aggregation"
                            label="Agregación"
                            :items="getAggregationOptions(field.type)"
                            density="compact"
                            variant="outlined"
                            hide-details
                            clearable
                          />
                        </VCol>
                        <VCol cols="12">
                          <div class="d-flex gap-4">
                            <VSwitch
                              v-model="field.visible"
                              label="Visible"
                              density="compact"
                              hide-details
                            />
                            <VSwitch
                              v-model="field.sortable"
                              label="Ordenable"
                              density="compact"
                              hide-details
                            />
                            <VSwitch
                              v-model="field.filterable"
                              label="Filtrable"
                              density="compact"
                              hide-details
                            />
                          </div>
                        </VCol>
                      </VRow>
                    </div>
                  </VExpandTransition>
                </div>
              </template>
            </Draggable>

            <div
              v-if="selectedFields.length === 0"
              class="text-center py-8"
            >
              <VIcon
                icon="tabler-list-details"
                size="48"
                color="grey"
                class="mb-3"
              />
              <p class="text-body-2 text-medium-emphasis">
                Selecciona campos de la lista izquierda
              </p>
              <p class="text-caption text-medium-emphasis">
                Puedes hacer doble clic o usar el botón +
              </p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Vista previa -->
    <VCard
      v-if="selectedFields.length > 0"
      variant="outlined"
      class="mt-4"
    >
      <VCardTitle class="text-h6 pa-4">
        <VIcon
          icon="tabler-eye"
          class="me-2"
        />
        Vista previa del reporte
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
          Así se verán las columnas en el reporte final
        </VAlert>

        <div class="table-preview">
          <VTable density="compact">
            <thead>
              <tr>
                <th
                  v-for="field in selectedFields.filter(f => f.visible)"
                  :key="field.id"
                  :style="{
                    width: field.width === 'auto' ? 'auto' : `${field.width}px`,
                    textAlign: field.align,
                  }"
                >
                  <div
                    class="d-flex align-center"
                    :class="`justify-${field.align}`"
                  >
                    <VIcon
                      v-if="field.sortable"
                      icon="tabler-arrows-sort"
                      size="14"
                      class="me-1"
                    />
                    <span :class="{ 'font-weight-bold': field.bold, 'font-italic': field.italic }">
                      {{ field.alias }}
                    </span>
                    <VIcon
                      v-if="field.filterable"
                      icon="tabler-filter"
                      size="14"
                      class="ms-1"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  v-for="field in selectedFields.filter(f => f.visible)"
                  :key="field.id"
                  :style="{ textAlign: field.align }"
                >
                  <span class="text-caption text-medium-emphasis">
                    {{ getExampleValue(field) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
      </VCardText>
    </VCard>

    <!-- Dialog de configuración avanzada -->
    <VDialog
      v-model="showAdvancedConfig"
      max-width="800"
      persistent
    >
      <VCard v-if="editingField">
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>Configuración avanzada: {{ editingField.alias }}</span>
          <VBtn
            icon
            variant="text"
            @click="showAdvancedConfig = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VCardText>
          <VTabs
            v-model="configTab"
            class="mb-4"
          >
            <VTab value="format">
              <VIcon
                icon="tabler-palette"
                start
              />
              Formato
            </VTab>
            <VTab value="style">
              <VIcon
                icon="tabler-brush"
                start
              />
              Estilo
            </VTab>
            <VTab value="behavior">
              <VIcon
                icon="tabler-settings"
                start
              />
              Comportamiento
            </VTab>
            <VTab value="conditional">
              <VIcon
                icon="tabler-adjustments"
                start
              />
              Condicional
            </VTab>
          </VTabs>

          <VWindow v-model="configTab">
            <!-- Tab Formato -->
            <VWindowItem value="format">
              <VRow>
                <VCol cols="12">
                  <VSelect
                    v-model="editingField.format"
                    label="Tipo de formato"
                    :items="getFormatOptions(editingField.type)"
                    variant="outlined"
                  />
                </VCol>

                <!-- Opciones para números -->
                <template v-if="['number', 'currency', 'percentage'].includes(editingField.format)">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model.number="editingField.decimals"
                      label="Decimales"
                      type="number"
                      min="0"
                      max="10"
                      variant="outlined"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSwitch
                      v-model="editingField.thousandsSeparator"
                      label="Separador de miles"
                      color="primary"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingField.prefix"
                      label="Prefijo"
                      placeholder="Ej: $"
                      variant="outlined"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingField.suffix"
                      label="Sufijo"
                      placeholder="Ej: %"
                      variant="outlined"
                    />
                  </VCol>
                </template>

                <!-- Opciones para fechas -->
                <template v-if="['date', 'datetime'].includes(editingField.format)">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="editingField.dateFormat"
                      label="Formato de fecha"
                      :items="dateFormats"
                      variant="outlined"
                    />
                  </VCol>
                  <VCol
                    v-if="editingField.format === 'datetime'"
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="editingField.timeFormat"
                      label="Formato de hora"
                      :items="timeFormats"
                      variant="outlined"
                    />
                  </VCol>
                </template>

                <!-- Opciones para booleanos -->
                <template v-if="editingField.format === 'boolean'">
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingField.trueValue"
                      label="Valor para verdadero"
                      placeholder="Sí"
                      variant="outlined"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="editingField.falseValue"
                      label="Valor para falso"
                      placeholder="No"
                      variant="outlined"
                    />
                  </VCol>
                </template>

                <!-- Formato personalizado -->
                <VCol
                  v-if="editingField.format === 'custom'"
                  cols="12"
                >
                  <VTextField
                    v-model="editingField.customFormat"
                    label="Formato personalizado"
                    placeholder="Ej: {value} unidades"
                    variant="outlined"
                    hint="Use {value} para el valor del campo"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Tab Estilo -->
            <VWindowItem value="style">
              <VRow>
                <VCol
                  cols="12"
                  md="4"
                >
                  <VSelect
                    v-model="editingField.align"
                    label="Alineación horizontal"
                    :items="[
                      { value: 'left', title: 'Izquierda' },
                      { value: 'center', title: 'Centro' },
                      { value: 'right', title: 'Derecha' },
                    ]"
                    variant="outlined"
                  >
                    <template #prepend-inner>
                      <VIcon icon="tabler-align-left" />
                    </template>
                  </VSelect>
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                >
                  <VSelect
                    v-model="editingField.verticalAlign"
                    label="Alineación vertical"
                    :items="[
                      { value: 'top', title: 'Arriba' },
                      { value: 'middle', title: 'Centro' },
                      { value: 'bottom', title: 'Abajo' },
                    ]"
                    variant="outlined"
                  >
                    <template #prepend-inner>
                      <VIcon icon="tabler-align-center" />
                    </template>
                  </VSelect>
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                >
                  <div class="d-flex gap-2 mt-2">
                    <VBtn
                      :variant="editingField.bold ? 'flat' : 'outlined'"
                      :color="editingField.bold ? 'primary' : undefined"
                      @click="editingField.bold = !editingField.bold"
                    >
                      <VIcon icon="tabler-bold" />
                    </VBtn>
                    <VBtn
                      :variant="editingField.italic ? 'flat' : 'outlined'"
                      :color="editingField.italic ? 'primary' : undefined"
                      @click="editingField.italic = !editingField.italic"
                    >
                      <VIcon icon="tabler-italic" />
                    </VBtn>
                    <VBtn
                      :variant="editingField.underline ? 'flat' : 'outlined'"
                      :color="editingField.underline ? 'primary' : undefined"
                      @click="editingField.underline = !editingField.underline"
                    >
                      <VIcon icon="tabler-underline" />
                    </VBtn>
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="editingField.textColor"
                    label="Color de texto"
                    placeholder="#000000"
                    variant="outlined"
                  >
                    <template #append-inner>
                      <input
                        v-model="editingField.textColor"
                        type="color"
                        style=" border: none; block-size: 30px; cursor: pointer;inline-size: 30px;"
                      >
                    </template>
                  </VTextField>
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="editingField.backgroundColor"
                    label="Color de fondo"
                    placeholder="#FFFFFF"
                    variant="outlined"
                  >
                    <template #append-inner>
                      <input
                        v-model="editingField.backgroundColor"
                        type="color"
                        style=" border: none; block-size: 30px; cursor: pointer;inline-size: 30px;"
                      >
                    </template>
                  </VTextField>
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Tab Comportamiento -->
            <VWindowItem value="behavior">
              <VRow>
                <VCol
                  cols="12"
                  md="4"
                >
                  <VTextField
                    v-model="editingField.width"
                    label="Ancho de columna"
                    variant="outlined"
                    hint="Número en píxeles o 'auto'"
                    persistent-hint
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                >
                  <VTextField
                    v-model.number="editingField.minWidth"
                    label="Ancho mínimo"
                    type="number"
                    variant="outlined"
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                >
                  <VTextField
                    v-model.number="editingField.maxWidth"
                    label="Ancho máximo"
                    type="number"
                    variant="outlined"
                  />
                </VCol>
                <VCol cols="12">
                  <VSwitch
                    v-model="editingField.visible"
                    label="Columna visible"
                    color="primary"
                  />
                  <VSwitch
                    v-model="editingField.sortable"
                    label="Permitir ordenamiento"
                    color="primary"
                  />
                  <VSwitch
                    v-model="editingField.filterable"
                    label="Permitir filtrado"
                    color="primary"
                  />
                  <VSwitch
                    v-model="editingField.frozen"
                    label="Columna fija (no se desplaza)"
                    color="primary"
                  />
                  <VSwitch
                    v-model="editingField.wrapText"
                    label="Ajustar texto"
                    color="primary"
                  />
                  <VSwitch
                    v-model="editingField.tooltip"
                    label="Mostrar tooltip al pasar el mouse"
                    color="primary"
                  />
                </VCol>
                <VCol cols="12">
                  <VSelect
                    v-model="editingField.aggregation"
                    label="Función de agregación"
                    :items="getAggregationOptions(editingField.type)"
                    variant="outlined"
                    clearable
                    hint="Se aplicará cuando se agrupen datos"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </VWindowItem>

            <!-- Tab Formato condicional -->
            <VWindowItem value="conditional">
              <VAlert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                <VIcon icon="tabler-info-circle" />
                El formato condicional permite cambiar el estilo de las celdas según su valor
              </VAlert>

              <div class="text-center py-8">
                <VIcon
                  icon="tabler-adjustments-horizontal"
                  size="48"
                  color="grey"
                />
                <p class="text-body-2 text-medium-emphasis mt-3">
                  Formato condicional disponible próximamente
                </p>
              </div>
            </VWindowItem>
          </VWindow>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showAdvancedConfig = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            @click="saveAdvancedConfig"
          >
            Guardar cambios
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Mensajes de ayuda -->
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
          <span class="text-subtitle-2 font-weight-medium">Tips de configuración</span>
        </div>
        <ul class="text-body-2 mb-0">
          <li>Arrastra los campos para cambiar el orden de las columnas</li>
          <li>Haz doble clic en un campo disponible para agregarlo rápidamente</li>
          <li>Usa la configuración avanzada para personalizar completamente cada columna</li>
          <li>Los campos con agregación se calcularán automáticamente cuando se agrupen datos</li>
        </ul>
      </VCardText>
    </VCard>

    <!-- Mensajes de error -->
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ error }}
    </VAlert>

    <VAlert
      v-if="selectedFields.length === 0"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      <template #prepend>
        <VIcon icon="tabler-alert-triangle" />
      </template>
      <div>
        <strong>No hay campos seleccionados</strong>
        <p class="mb-0 mt-1">
          Debes seleccionar al menos un campo para continuar con la configuración del reporte.
        </p>
      </div>
    </VAlert>
  </div>
</template>

<style scoped>
.report-fields-advanced {
  min-block-size: 600px;
}

.available-fields-list,
.selected-fields-list {
  max-block-size: 500px;
  overflow-y: auto;
  padding-block: 0 16px;
  padding-inline: 16px;
}

.field-item {
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  background-color: rgb(var(--v-theme-surface));
  margin-block-end: 8px;
  transition: all 0.2s;
}

.field-item:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 5%);
}

.field-item.available {
  cursor: pointer;
}

.field-item.selected {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.field-info {
  display: flex;
  align-items: center;
  margin-block-start: 2px;
}

.field-config {
  border-block-start: 1px solid rgba(var(--v-border-color), 0.5);
  margin-block-start: 12px;
  padding-block-start: 12px;
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

.transfer-arrows {
  opacity: 0.3;
}

.table-preview {
  border: 1px dashed rgba(var(--v-border-color), 0.5);
  border-radius: 4px;
  overflow-x: auto;
}

.table-preview table {
  min-inline-size: 100%;
}

/* Función helper para obtener valor de ejemplo */
</style>
