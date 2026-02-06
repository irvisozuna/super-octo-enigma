<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import { CatalogsReadingsApiService } from '../../infrastructure/api/services/CatalogsReadingsApiService'

const apiService = new CatalogsReadingsApiService()

const catalogOptions = [
  { title: 'Systems', value: 'systems' },
  { title: 'Sectors', value: 'sectors' },
  { title: 'Routes', value: 'routes' },
  { title: 'Rates', value: 'rates' },
  { title: 'Rate Tiers', value: 'rate-tiers' },
  { title: 'Contract Statuses', value: 'contract-statuses' },
  { title: 'Work Order Statuses', value: 'work-order-statuses' },
  { title: 'Periods', value: 'periods' },
  { title: 'Concepts', value: 'concepts' },
  { title: 'Anomalies', value: 'anomalies' },
  { title: 'Contract Types', value: 'contracts-types' },
  { title: 'Workers', value: 'workers' },
  { title: 'Worker Types', value: 'worker-types' },
]

const selectedCatalog = ref<string>('systems')
const items = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(15)
const perPageOptions = [10, 15, 25, 50, 100]

const normalizeArray = (response: any) => {
  if (Array.isArray(response))
    return response
  if (Array.isArray(response?.data))
    return response.data
  if (Array.isArray(response?.data?.data))
    return response.data.data

  return []
}

type ColumnDef = {
  title: string
  key: string
  sortable?: boolean
  getValue: (item: any) => any
  format?: (value: any) => string
}

const normalizeLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

const getValueFromKeys = (item: any, keys: string[]) => {
  for (const key of keys) {
    const value = item?.[key]
    if (value !== undefined && value !== null && value !== '')
      return value && typeof value === 'object'
        ? (value.name ?? value.title ?? value.code ?? value.external_id ?? value.externalId ?? value)
        : value
  }

  return null
}

const formatBoolean = (value: any) => {
  if (typeof value === 'boolean')
    return value ? 'Si' : 'No'

  return value
}

const formatDate = (value: any) => {
  if (!value)
    return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return String(value)

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

const baseColumns: ColumnDef[] = [
  {
    title: 'Nombre',
    key: 'name',
    sortable: true,
    getValue: item => getValueFromKeys(item, ['name', 'title', 'description']),
  },
  {
    title: 'Codigo',
    key: 'code',
    sortable: true,
    getValue: item => getValueFromKeys(item, ['code', 'local_id', 'localId']),
  },
  {
    title: 'External ID',
    key: 'external_id',
    sortable: true,
    getValue: item => getValueFromKeys(item, ['external_id', 'externalId']),
  },
  {
    title: 'Activo',
    key: 'is_active',
    sortable: true,
    getValue: item => getValueFromKeys(item, ['is_active', 'isActive']),
    format: value => String(formatBoolean(value) ?? '-'),
  },
  {
    title: 'Actualizado',
    key: 'updated_at',
    sortable: true,
    getValue: item => getValueFromKeys(item, ['updated_at', 'updatedAt']),
    format: formatDate,
  },
]

const catalogColumnOverrides: Record<string, ColumnDef[]> = {
  periods: [
    {
      title: 'Inicio',
      key: 'start_date',
      sortable: true,
      getValue: item => getValueFromKeys(item, ['start_date', 'startDate']),
      format: formatDate,
    },
    {
      title: 'Fin',
      key: 'end_date',
      sortable: true,
      getValue: item => getValueFromKeys(item, ['end_date', 'endDate']),
      format: formatDate,
    },
  ],
  routes: [
    {
      title: 'Sector',
      key: 'sector',
      sortable: true,
      getValue: item => getValueFromKeys(item, ['sector_name', 'sector', 'sectorName']),
    },
  ],
  workers: [
    {
      title: 'Tipo',
      key: 'worker_type',
      sortable: true,
      getValue: item => getValueFromKeys(item, ['worker_type', 'workerType', 'type', 'category']),
    },
  ],
  'rate-tiers': [
    {
      title: 'Desde',
      key: 'from',
      sortable: true,
      getValue: item => getValueFromKeys(item, ['from', 'start', 'start_value', 'startValue']),
    },
    {
      title: 'Hasta',
      key: 'to',
      sortable: true,
      getValue: item => getValueFromKeys(item, ['to', 'end', 'end_value', 'endValue']),
    },
  ],
}

const getAutoColumns = (rawItems: any[], existingKeys: Set<string>): ColumnDef[] => {
  const sample = rawItems.slice(0, 50)
  const keys = new Set<string>()
  const excludedKeys = new Set(['id', 'company_id', 'companyId'])

  sample.forEach(item => {
    if (!item || typeof item !== 'object')
      return

    Object.keys(item).forEach(key => {
      if (excludedKeys.has(key))
        return
      if (existingKeys.has(key))
        return
      const value = item[key]
      if (Array.isArray(value))
        return
      if (value && typeof value === 'object')
        return
      keys.add(key)
    })
  })

  return Array.from(keys).map(key => ({
    title: normalizeLabel(key),
    key,
    sortable: true,
    getValue: item => item?.[key],
  }))
}

const columns = computed(() => {
  const base = [...baseColumns]
  const overrides = catalogColumnOverrides[selectedCatalog.value] ?? []
  const existingKeys = new Set(base.map(col => col.key))
  overrides.forEach(col => existingKeys.add(col.key))

  const autoColumns = getAutoColumns(items.value, existingKeys)

  return [...base, ...overrides, ...autoColumns]
})

const headers = computed(() => columns.value.map(column => ({
  title: column.title,
  key: column.key,
  sortable: column.sortable ?? true,
})))

const tableItems = computed(() => items.value.map(item => {
  const mapped: Record<string, any> = {}

  columns.value.forEach(column => {
    const value = column.getValue(item)
    if (column.format)
      mapped[column.key] = column.format(value)
    else
      mapped[column.key] = formatBoolean(value ?? '-')
  })

  mapped._raw = item

  return mapped
}))

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query)
    return tableItems.value

  return tableItems.value.filter(item => {
    const haystack = columns.value
      .map(column => String(item[column.key] ?? '').toLowerCase())
      .join(' ')

    return haystack.includes(query)
  })
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value

  return filteredItems.value.slice(start, end)
})

const pagination = computed(() => ({
  current_page: currentPage.value,
  last_page: Math.max(1, Math.ceil(filteredItems.value.length / itemsPerPage.value)),
  per_page: itemsPerPage.value,
  total: filteredItems.value.length,
}))

const handleOptionsUpdate = (params: Record<string, any>) => {
  if (params.page)
    currentPage.value = params.page
  if (params.per_page) {
    itemsPerPage.value = params.per_page
    currentPage.value = 1
  }
}

const loadCatalog = async () => {
  if (!selectedCatalog.value)
    return

  loading.value = true
  try {
    const response = await apiService.getCatalog(selectedCatalog.value, { itemsPerPage: 500, page: 1 })
    items.value = normalizeArray(response)
  }
  finally {
    loading.value = false
  }
}

watch(selectedCatalog, async () => {
  currentPage.value = 1
  await loadCatalog()
})

onMounted(async () => {
  await loadCatalog()
})
</script>

<template>
  <div class="catalogs-readings-page">
    <BaseListHeader
      title="Catalogos"
      icon="tabler-books"
      :total="pagination.total"
      item-label="registro"
      item-label-plural="registros"
      description="Consulta los catalogos disponibles."
      :show-create-button="false"
      class="catalogs-readings-header"
    />

    <VCard class="catalogs-readings-table">
      <VCardText>
        <div class="catalogs-readings-toolbar">
          <VSelect
            v-model="selectedCatalog"
            :items="catalogOptions"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            class="catalogs-readings-toolbar__select"
          />
          <VTextField
            v-model="search"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="Buscar"
            prepend-inner-icon="tabler-search"
            class="catalogs-readings-toolbar__search"
          />
        </div>

        <BaseDataTable
          :headers="headers"
          :items="pagedItems"
          :meta="pagination"
          :loading="loading"
          :items-per-page-options="perPageOptions"
          empty-state-title="Sin catalogo"
          empty-state-description="No hay datos para este catalogo."
          empty-state-icon="tabler-database-off"
          @update:options="handleOptionsUpdate"
        />
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.catalogs-readings-page {
  inline-size: 100%;
  padding-block: 12px 32px;
}

.catalogs-readings-header {
  margin-block-end: 16px;
}

.catalogs-readings-table {
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.catalogs-readings-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-block-end: 12px;
}

.catalogs-readings-toolbar__select {
  min-inline-size: 220px;
}

.catalogs-readings-toolbar__search {
  max-inline-size: 280px;
}

@media (max-width: 900px) {
  .catalogs-readings-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .catalogs-readings-toolbar__search {
    max-inline-size: 100%;
  }
}
</style>
