<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSqlExpressionPreview } from '@/composables/useSqlExpressionPreview'

const props = defineProps<{
  stepData: any
  modelData?: any
}>()

const emit = defineEmits(['next', 'back'])

const { buildFullSql, getHighlightedSql, generateTableAlias } = useSqlExpressionPreview()

// Campos disponibles según el tipo de origen
const availableFields = computed(() => {
  if (props.stepData.type === 'table') {
    let fields = [...(props.stepData.tableColumns || [])]

    // Agregar displayName a las columnas de la tabla principal
    const mainTableAlias = generateTableAlias(props.stepData.table)

    fields = fields.map(col => ({
      ...col,
      displayName: col.displayName || `${mainTableAlias}.${col.name}`,
      name: `${mainTableAlias}.${col.name}`,
    }))

    // Agregar columnas de los JOINs si existen
    if (props.stepData.joins && props.stepData.joins.length > 0) {
      props.stepData.joins.forEach(join => {
        if (join.table && props.stepData.joinColumns && props.stepData.joinColumns[join.table]) {
          const joinAlias = join.alias || generateTableAlias(join.table)

          // Agregar alias de tabla para evitar conflictos de nombres
          const joinFields = props.stepData.joinColumns[join.table].map(col => ({
            ...col,
            name: `${joinAlias}.${col.name}`,
            displayName: `${joinAlias}.${col.name}`,
          }))

          fields = [...fields, ...joinFields]
        }
      })
    }

    return fields
  }

  if (props.stepData.type === 'stored_procedure')
    return props.stepData.procedureColumns || []

  return []
})

// Campos seleccionados para el reporte
const selectedFields = ref([])

// Alias personalizados para las columnas
const fieldAliases = ref<Record<string, string>>({})

// Configuración de agregaciones
const aggregations = ref({})

// Configuración de filtros básicos
const filters = ref([])

// Configuración de ordenamiento
const sorting = ref([])

function buildWhere(filters, logic = 'AND') {
  if (!filters || !filters.length)
    return ''

  const parts = filters.map(f => {
    if (f.group && Array.isArray(f.group)) {
      return `(${buildWhere(f.group, f.logic || 'AND')})`
    }
    else if (f.field && f.operator) {
      const value = typeof f.value === 'string' ? `'${f.value}'` : f.value

      return `${f.field} ${f.operator} ${value}`
    }

    return ''
  }).filter(Boolean)

  return parts.join(` ${logic} `)
}

function buildJoins(mainTableAlias, joins = []) {
  let sql = ''
  joins.forEach(join => {
    if (join.table && join.type && join.mainField && join.joinField) {
      const joinAlias = join.alias || generateTableAlias(join.table)

      sql += ` ${join.type} JOIN ${join.table} AS ${joinAlias} ON ${mainTableAlias}.${join.mainField} = ${joinAlias}.${join.joinField}`
    }
  })

  return sql
}

const generatedSql = computed(() => {
  if (props.stepData.type === 'custom_sql')
    return props.stepData.custom_sql
  if (props.stepData.type === 'table') {
    const mainTableAlias = generateTableAlias(props.stepData.table)
    const columns = Array.isArray(selectedFields.value) ? selectedFields.value : []
    let sql = buildFullSql({
      columns,
      table: props.stepData.table,
      tableAlias: mainTableAlias,
      joins: props.stepData.joins,
      filters: filters.value,
      sorting: sorting.value,
      limit: 50,
    })
    sql = sql.replace(/FROM [^ ]+ AS [^ ]+/, match => match + buildJoins(mainTableAlias, props.stepData.joins || []))

    const where = buildWhere(filters.value)
    if (where && !/WHERE/i.test(sql))
      sql += ` WHERE ${where}`

    return sql
  }
  if (props.stepData.type === 'stored_procedure')
    return `CALL ${props.stepData.procedure}(${Object.values(props.stepData.procedureParams).join(', ')})`

  return ''
})

const generatedSqlHighlighted = computed(() => getHighlightedSql(generatedSql.value))

const canContinue = computed(() => {
  return selectedFields.value.length > 0 || props.stepData.type === 'custom_sql'
})

function addFilter() {
  filters.value.push({
    field: '',
    operator: '=',
    value: '',
    condition: '',
  })
}

function removeFilter(index: number) {
  filters.value.splice(index, 1)
}

function updateFilterCondition(index: number) {
  const filter = filters.value[index]
  if (filter.field && filter.operator && filter.value)
    filter.condition = `${filter.field} ${filter.operator} '${filter.value}'`
}

function addSorting() {
  sorting.value.push({
    field: '',
    direction: 'ASC',
  })
}

function removeSorting(index: number) {
  sorting.value.splice(index, 1)
}

function nextStep() {
  emit('next', {
    selectedFields: selectedFields.value,
    fieldAliases: fieldAliases.value,
    aggregations: aggregations.value,
    filters: filters.value,
    sorting: sorting.value,
    generatedSql: generatedSql.value,
  })
}

function backStep() {
  emit('back')
}

// Inicializar campos seleccionados con todos los disponibles
watch(availableFields, fields => {
  if (fields.length && props.stepData.type !== 'custom_sql')
    selectedFields.value = fields.map(f => f.name)
}, { immediate: true })

onMounted(() => {
  if (props.modelData) {
    selectedFields.value = props.modelData.selectedFields || []
    fieldAliases.value = props.modelData.fieldAliases || {}
    filters.value = props.modelData.filters || []
    sorting.value = props.modelData.sorting || []
    aggregations.value = props.modelData.aggregations || {}

    // ...otros campos relevantes
  }
})

// Función para sugerir alias automáticamente
function sugerirAlias(field: string): string {
  // Quitar prefijo de tabla si existe
  const parts = field.split('.')
  const base = parts[parts.length - 1]

  // Snake_case a Title Case
  return base.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-database"
              class="me-2"
            />
            Resumen de Conexión
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="6">
                <div class="text-caption">
                  Conexión:
                </div>
                <div class="text-body-1">
                  {{ stepData.connection_name }}
                </div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption">
                  Tipo:
                </div>
                <div class="text-body-1">
                  {{ stepData.type === 'custom_sql' ? 'SQL Personalizado'
                    : stepData.type === 'table' ? 'Tabla/Vista' : 'Stored Procedure' }}
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Selección de campos -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-view-column"
              class="me-2"
            />
            Campos del Reporte
          </VCardTitle>
          <VCardText>
            <div v-if="stepData.type === 'custom_sql'">
              <VAlert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                <VIcon
                  icon="mdi-information"
                  class="me-2"
                />
                Para SQL personalizado, los campos se detectarán automáticamente al ejecutar la consulta.
              </VAlert>
            </div>
            <div v-else>
              <VSelect
                v-model="selectedFields"
                :items="availableFields"
                item-title="displayName"
                item-value="name"
                label="Seleccionar campos"
                multiple
                chips
                closable-chips
                :hint="`${selectedFields.length} campos seleccionados`"
                persistent-hint
              />
              <div
                v-if="selectedFields.length"
                class="mt-6"
              >
                <VTable density="compact">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Alias sugerido</th>
                      <th>Alias personalizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="field in selectedFields"
                      :key="field"
                    >
                      <td>{{ field }}</td>
                      <td>{{ sugerirAlias(field) }}</td>
                      <td>
                        <VTextField
                          v-model="fieldAliases[field]"
                          :placeholder="sugerirAlias(field)"
                          density="compact"
                          hide-details
                        />
                      </td>
                    </tr>
                  </tbody>
                </VTable>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Filtros -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-filter"
              class="me-2"
            />
            Filtros
          </VCardTitle>
          <VCardText>
            <div
              v-for="(filter, index) in filters"
              :key="index"
              class="mb-3"
            >
              <VRow>
                <VCol cols="3">
                  <VSelect
                    v-model="filter.field"
                    :items="availableFields"
                    item-title="displayName"
                    item-value="name"
                    label="Campo"
                    @update:model-value="updateFilterCondition(index)"
                  />
                </VCol>
                <VCol cols="2">
                  <VSelect
                    v-model="filter.operator"
                    :items="['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN']"
                    label="Operador"
                    @update:model-value="updateFilterCondition(index)"
                  />
                </VCol>
                <VCol cols="4">
                  <VTextField
                    v-model="filter.value"
                    label="Valor"
                    @update:model-value="updateFilterCondition(index)"
                  />
                </VCol>
                <VCol cols="2">
                  <VBtn
                    icon="mdi-delete"
                    color="error"
                    variant="text"
                    @click="removeFilter(index)"
                  />
                </VCol>
              </VRow>
            </div>
            <VBtn
              prepend-icon="mdi-plus"
              variant="outlined"
              @click="addFilter"
            >
              Agregar Filtro
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Ordenamiento -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-sort"
              class="me-2"
            />
            Ordenamiento
          </VCardTitle>
          <VCardText>
            <div
              v-for="(sort, index) in sorting"
              :key="index"
              class="mb-3"
            >
              <VRow>
                <VCol cols="4">
                  <VSelect
                    v-model="sort.field"
                    :items="availableFields"
                    item-title="displayName"
                    item-value="name"
                    label="Campo"
                  />
                </VCol>
                <VCol cols="2">
                  <VSelect
                    v-model="sort.direction"
                    :items="['ASC', 'DESC']"
                    label="Dirección"
                  />
                </VCol>
                <VCol cols="2">
                  <VBtn
                    icon="mdi-delete"
                    color="error"
                    variant="text"
                    @click="removeSorting(index)"
                  />
                </VCol>
              </VRow>
            </div>
            <VBtn
              prepend-icon="mdi-plus"
              variant="outlined"
              @click="addSorting"
            >
              Agregar Ordenamiento
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>

      <!-- SQL Generado -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-code-braces"
              class="me-2"
            />
            SQL Generado
          </VCardTitle>
          <VCardText>
            <VTextarea
              :model-value="generatedSql"
              label="Consulta SQL"
              readonly
              auto-grow
              rows="4"
              variant="outlined"
            />
            <div class="mt-4">
              <div class="text-caption text-grey-darken-1 mb-1">
                Vista previa de SQL generado:
              </div>
              <pre
                class="rounded bg-grey-lighten-4 pa-3"
                style="overflow-x: auto;"
                v-html="generatedSqlHighlighted"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <div class="d-flex justify-space-between mt-6">
      <VBtn
        variant="outlined"
        @click="backStep"
      >
        <VIcon
          icon="mdi-arrow-left"
          class="me-2"
        />
        Anterior
      </VBtn>
      <VBtn
        color="primary"
        :disabled="!canContinue"
        @click="nextStep"
      >
        Siguiente
        <VIcon
          icon="mdi-arrow-right"
          class="ms-2"
        />
      </VBtn>
    </div>
  </div>
</template>
