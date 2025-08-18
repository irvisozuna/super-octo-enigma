<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AddNoteDialog from './AddNoteDialog.vue'
import BaseTable from '@/components/BaseTable.vue'
import { useAppManager } from '@/composables/useAppManager'
import { useContractStore } from '@/modules/support/stores/contractStore'

const { t } = useI18n()
const { closeDialog, openDialog } = useAppManager()
const contractStore = useContractStore()

const contracts = ref([])
const loading = ref(true)
const selectedContract = ref(null)
const searchQuery = ref('')
const showAdvancedSearch = ref(false)

// Encabezados de la tabla
const headers = [
  { title: t('account'), value: 'account' },
  { title: t('clave'), value: 'clave_loc', width: '120px' },
  { title: t('measurer'), value: 'measurer' },
  { title: t('name'), value: 'nameuser' },
  { title: t('address'), value: 'address' },
  { title: t('neighborhood'), value: 'neighborhood' },
  { title: t('debt'), value: 'total_debt' },
  { title: t('actionslabel'), value: 'actions', align: 'center' },
]

const pagination = ref({
  limit: 10,
  offset: 0,
  count: 0,
  total: 0,
  search: '',
  filters: '[]',
  page: 1,
})

const selectedColumn = ref('')
const selectedOperator = ref('')
const filterValue = ref('')
const filterValue2 = ref('')
const activeFilters = ref([])

// Definir los operadores de búsqueda disponibles por tipo
const operatorsByType = {
  text: [
    { value: 'contains', label: t('contains') },
    { value: 'equals', label: t('equals') },
    { value: 'startsWith', label: t('startsWith') },
    { value: 'endsWith', label: t('endsWith') },
  ],
  number: [
    { value: 'equals', label: t('equals') },
    { value: 'greater', label: t('greaterThan') },
    { value: 'less', label: t('lessThan') },
    { value: 'range', label: t('range') },
  ],
  currency: [
    { value: 'equals', label: t('equals') },
    { value: 'greater', label: t('greaterThan') },
    { value: 'less', label: t('lessThan') },
    { value: 'range', label: t('range') },
  ],
}

// Definir los tipos de campo para cada columna
const columnTypes = {
  account: 'text',
  clave_loc: 'text',
  measurer: 'text',
  nameuser: 'text',
  address: 'text',
  neighborhood: 'text',
  total_debt: 'currency',
}

// Función para obtener los operadores según el tipo de columna
function getOperatorsForColumn(columnValue) {
  const type = columnTypes[columnValue] || 'text'

  return operatorsByType[type]
}

// Función para obtener el label de un operador
function getOperatorLabel(operator, columnValue) {
  const operators = getOperatorsForColumn(columnValue)

  return operators.find(op => op.value === operator)?.label || operator
}

// Función para agregar un filtro
function addFilter() {
  if (!selectedColumn.value || !selectedOperator.value || !filterValue.value)
    return

  const header = headers.find(h => h.value === selectedColumn.value)
  if (!header)
    return

  const newFilter = {
    column: selectedColumn.value,
    columnLabel: header.title,
    operator: selectedOperator.value,
    operatorLabel: getOperatorLabel(selectedOperator.value, selectedColumn.value),
    value: filterValue.value,
    value2: filterValue2.value,
  }

  activeFilters.value.push(newFilter)

  // Limpiar los campos
  selectedColumn.value = ''
  selectedOperator.value = ''
  filterValue.value = ''
  filterValue2.value = ''

  // Aplicar los filtros
  applyFilters()
}

// Función para remover un filtro
function removeFilter(index) {
  activeFilters.value.splice(index, 1)
  applyFilters()
}

// Función para aplicar los filtros
function applyFilters() {
  pagination.value.offset = 0
  pagination.value.page = 1
  pagination.value.search = '' // Limpiar búsqueda general cuando se aplican filtros

  // Convertir los filtros a un formato más simple
  const filters = activeFilters.value.map(filter => ({
    field: filter.column,
    operator: filter.operator,
    value: filter.value,
    value2: filter.operator === 'range' ? filter.value2 : undefined,
  }))

  // Convertir el array de filtros a string para enviar al backend
  pagination.value.filters = JSON.stringify(filters)

  fetchData()
}

// Función para limpiar todos los filtros
function clearFilters() {
  activeFilters.value = []
  selectedColumn.value = ''
  selectedOperator.value = ''
  filterValue.value = ''
  filterValue2.value = ''
  pagination.value.filters = '[]'
  pagination.value.page = 1
  pagination.value.offset = 0
  fetchData()
}

// Definir los filtros avanzados
const advancedFilters = ref({
  account: { operator: 'contains', value: '', value2: '' },
  clave_loc: { operator: 'contains', value: '', value2: '' },
  measurer: { operator: 'contains', value: '', value2: '' },
  nameuser: { operator: 'contains', value: '', value2: '' },
  address: { operator: 'contains', value: '', value2: '' },
  neighborhood: { operator: 'contains', value: '', value2: '' },
  total_debt: { operator: 'range', value: '', value2: '' },
})

// Función para seleccionar un contrato y cerrar el diálogo
async function selectContract(contract) {
  try {
    // Mostrar un loading mientras se selecciona el contrato
    loading.value = true
    await contractStore.getContract(contract.account) // Ejecutar la acción del store con el ID del contrato

    closeDialog('submit')

    // Abrir el diálogo de notas obligatorio
    // openDialog(AddNoteDialog, { isMandatory: true }, { width: '50%', persistent: true }).then(result => {
    //   if (result === 'submit') {
    //     console.log('Nota creada, cerrando diálogo de búsqueda...')
    //     closeDialog('submit') // Cerrar el diálogo después de crear la nota
    //   }
    // })
  }
  catch (error) {
    console.error('Error al seleccionar el contrato:', error)
  }
  finally {
    loading.value = false
  }
}

// Función para cerrar el diálogo
function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result)
}

// Función para actualizar la página
function updatePage(newPage: number) {
  pagination.value = {
    ...pagination.value,
    page: newPage,
    offset: (newPage - 1) * pagination.value.limit,
    search: searchQuery.value,
    filters: typeof pagination.value.filters === 'object'
      ? JSON.stringify(pagination.value.filters)
      : pagination.value.filters,
  }
  fetchData()
}

// Función para actualizar los elementos por página
function updateItemsPerPage(newItemsPerPage: number) {
  pagination.value = {
    ...pagination.value,
    limit: newItemsPerPage,
    offset: 0,
    page: 1,
    search: searchQuery.value,
    filters: typeof pagination.value.filters === 'object'
      ? JSON.stringify(pagination.value.filters)
      : pagination.value.filters,
  }
  fetchData()
}

// Función para reemplazar valores null por una cadena vacía
function replaceNullWithEmptyString(data: any[]) {
  return data.map(item => {
    const newItem = { ...item }
    for (const key in newItem) {
      if (newItem[key] === null)
        newItem[key] = ''
    }

    return newItem
  })
}

// Función para manejar la entrada de búsqueda
function onSearchInput() {
  pagination.value.offset = 0
  pagination.value.page = 1
  pagination.value.filters = '[]' // Limpiar filtros cuando se usa la búsqueda general
  pagination.value.search = searchQuery.value
  fetchData()
}

// Función para aplicar los filtros avanzados
function applyAdvancedFilters() {
  pagination.value.offset = 0
  pagination.value.filters = {}

  // Convertir los filtros avanzados al formato esperado por el backend
  Object.entries(advancedFilters.value).forEach(([key, filter]) => {
    if (filter.value) {
      pagination.value.filters[key] = {
        operator: filter.operator,
        value: filter.value,
        value2: filter.value2,
      }
    }
  })

  fetchData()
}

// Función para limpiar los filtros avanzados
function clearAdvancedFilters() {
  Object.keys(advancedFilters.value).forEach(key => {
    advancedFilters.value[key] = { operator: 'contains', value: '', value2: '' }
  })
  applyAdvancedFilters()
}

// Cargar los contratos al montar el componente
onMounted(fetchData)

async function fetchData() {
  loading.value = true
  try {
    const response = await contractStore.getContracts(pagination.value)

    contracts.value = replaceNullWithEmptyString(response.data)

    // Actualizar la paginación con los datos del servidor
    pagination.value = {
      ...pagination.value,
      ...response.pagination,

      // Mantener los filtros y búsqueda actuales
      search: pagination.value.search,
      filters: pagination.value.filters,
    }
  }
  catch (error) {
    console.error('Error al cargar los contratos:', error)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <DialogCloseBtn @click="close" />
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Título y descripción -->
      <div class="text-center mb-6">
        <h4 class="text-h5 font-weight-medium mb-2">
          {{ t('advanceSearch') }}
        </h4>
        <p class="text-body-1 text-medium-emphasis">
          {{ t('advanceSearchDescription') }}
        </p>
      </div>

      <!-- Campo de búsqueda general con botón de búsqueda avanzada -->
      <div class="d-flex align-center gap-2 mb-6">
        <VTextField
          v-model="searchQuery"
          :placeholder="t('search.searchPlaceholder')"
          variant="outlined"
          density="comfortable"
          hide-details
          class="flex-grow-1"
          @input="onSearchInput"
        >
          <template #append-inner>
            <VIcon
              color="primary"
              icon="tabler-search"
            />
          </template>
        </VTextField>

        <VBtn
          variant="text"
          color="primary"
          class="shrink-0"
          @click="showAdvancedSearch = !showAdvancedSearch"
        >
          <VIcon
            :icon="showAdvancedSearch ? 'tabler-chevron-up' : 'tabler-chevron-down'"
            start
          />
          {{ showAdvancedSearch ? t('hideAdvancedSearch') : t('showAdvancedSearch') }}
        </VBtn>
      </div>

      <!-- Filtros activos -->
      <div
        v-if="activeFilters.length > 0"
        class="mb-4"
      >
        <div class="d-flex flex-wrap gap-2">
          <VChip
            v-for="(filter, index) in activeFilters"
            :key="index"
            variant="flat"
            color="primary"
            closable
            size="small"
            class="rounded"
            @click:close="removeFilter(index)"
          >
            <template #prepend>
              <VIcon
                size="16"
                :icon="columnTypes[filter.column] === 'number' || columnTypes[filter.column] === 'currency' ? 'tabler-calculator' : 'tabler-text-size'"
              />
            </template>
            <span class="font-weight-medium">{{ filter.columnLabel }}:</span>
            <span class="ms-1">{{ filter.operatorLabel.toLowerCase() }} {{ filter.value }}{{ filter.value2 ? ` - ${filter.value2}` : '' }}</span>
          </VChip>
          <VBtn
            v-if="activeFilters.length > 0"
            variant="text"
            color="error"
            density="comfortable"
            size="small"
            @click="clearFilters"
          >
            {{ t('clearAllFilters') }}
          </VBtn>
        </div>
      </div>

      <!-- Panel de búsqueda avanzada -->
      <VExpandTransition>
        <div v-if="showAdvancedSearch">
          <VCard
            variant="flat"
            class="mb-6 pa-4 bg-surface rounded"
            elevation="0"
          >
            <div class="d-flex gap-4">
              <!-- Selector de columna -->
              <VSelect
                v-model="selectedColumn"
                :items="headers.filter(h => h.value !== 'actions')"
                item-title="title"
                item-value="value"
                :label="t('selectColumn')"
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              >
                <template #prepend>
                  <VIcon icon="tabler-table" />
                </template>
              </VSelect>

              <!-- Selector de operador -->
              <VSelect
                v-if="selectedColumn"
                v-model="selectedOperator"
                :items="getOperatorsForColumn(selectedColumn)"
                item-title="label"
                item-value="value"
                :label="t('selectOperator')"
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              >
                <template #prepend>
                  <VIcon icon="tabler-math-symbols" />
                </template>
              </VSelect>

              <!-- Campo(s) de valor -->
              <template v-if="selectedOperator === 'range'">
                <div class="d-flex gap-2 flex-grow-1">
                  <VTextField
                    v-model="filterValue"
                    :label="t('from')"
                    :type="columnTypes[selectedColumn] === 'number' || columnTypes[selectedColumn] === 'currency' ? 'number' : 'text'"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="flex-grow-1"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-arrow-bar-right" />
                    </template>
                  </VTextField>
                  <VTextField
                    v-model="filterValue2"
                    :label="t('to')"
                    :type="columnTypes[selectedColumn] === 'number' || columnTypes[selectedColumn] === 'currency' ? 'number' : 'text'"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="flex-grow-1"
                  >
                    <template #prepend>
                      <VIcon icon="tabler-arrow-bar-left" />
                    </template>
                  </VTextField>
                </div>
              </template>
              <VTextField
                v-else-if="selectedOperator"
                v-model="filterValue"
                :label="t('enterValue')"
                :type="columnTypes[selectedColumn] === 'number' || columnTypes[selectedColumn] === 'currency' ? 'number' : 'text'"
                variant="outlined"
                density="comfortable"
                hide-details
                class="flex-grow-1"
              >
                <template #prepend>
                  <VIcon :icon="columnTypes[selectedColumn] === 'number' || columnTypes[selectedColumn] === 'currency' ? 'tabler-calculator' : 'tabler-text-size'" />
                </template>
              </VTextField>

              <!-- Botón de agregar filtro -->
              <VBtn
                color="primary"
                :disabled="!selectedColumn || !selectedOperator || !filterValue"
                class="align-self-center"
                @click="addFilter"
              >
                <VIcon
                  icon="tabler-plus"
                  start
                />
                {{ t('addFilter') }}
              </VBtn>
            </div>
          </VCard>
        </div>
      </VExpandTransition>

      <!-- Tabla de contratos -->
      <BaseTable
        v-if="!loading"
        v-model:selection="selectedContract"
        :headers="headers"
        :items="contracts"
        :total="pagination.total"
        :page="pagination.page"
        :items-per-page="pagination.limit"
        :loading="loading"
        @update:page="updatePage"
        @update:items-per-page="updateItemsPerPage"
      >
        <template #total_debt="{ item }">
          <div class="text-end">
            {{ $formatCurrency(item.total_debt) || 'N/A' }}
          </div>
        </template>
        <template #actions="{ item }">
          <VBtn
            color="primary"
            variant="text"
            @click="selectContract(item)"
          >
            {{ t('select') }}
          </VBtn>
        </template>
      </BaseTable>

      <!-- Estado de carga -->
      <div
        v-if="loading"
        class="d-flex flex-column align-center justify-center py-8"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="32"
        />
        <span class="text-medium-emphasis mt-2">
          {{ t('loading') }}...
        </span>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}
</style>
