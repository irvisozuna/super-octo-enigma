<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import { useWorkOrdersStore } from '../stores/workOrdersStore'
import WorkOrdersFilterDrawer from '../../share/WorkOrdersFilterDrawer.vue'

const { t } = useI18n()
const router = useRouter()
const workOrdersStore = useWorkOrdersStore()
const pageLoading = computed(() => workOrdersStore.loading)

const search = ref('')
const itemsPerPage = ref(workOrdersStore.pagination.per_page)
const perPageOptions = [10, 25, 50, 100]
const filterOpen = ref(false)
const filters = ref({
  status: '',
  type: '',
  priority: '',
})

const headers = [
  { title: 'Folio', key: 'folio', sortable: true },
  { title: 'Contrato', key: 'contract', sortable: true },
  { title: 'Usuario', key: 'user', sortable: true },
  { title: 'Tipo', key: 'type', sortable: true },
  { title: 'Asunto', key: 'subject', sortable: true },
  { title: 'Prioridad', key: 'priority', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Programada', key: 'scheduled', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

const normalizeValue = (value: any) => {
  if (value === null || value === undefined)
    return ''

  if (typeof value === 'object')
    return JSON.stringify(value)

  return value
}

const formatDate = (value?: string) => {
  if (!value)
    return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return value

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

const tableItems = computed(() => workOrdersStore.items.map(item => ({
  folio: normalizeValue(item.local_id ?? item.folio ?? item.external_id ?? item.code ?? item.id),
  contract: normalizeValue(item.contract_number ?? item.contract?.contract_number ?? item.contract_id),
  user: normalizeValue(item.user_name ?? item.contract?.user_name ?? item.user ?? item.customer),
  type: normalizeValue(item.type ?? item.type_catalog?.name ?? item.work_order_type_id),
  subject: normalizeValue(item.subject ?? item.title ?? item.description ?? item.asunto ?? item.notes),
  priority: normalizeValue(item.priority ?? item.severity ?? item.priority_code ?? item.prioridad),
  status: normalizeValue(item.status ?? item.estado ?? item.state),
  scheduled: formatDate(item.scheduled_at ?? item.requested_at ?? item.due_at),
  _raw: item,
})))

const statusOptions = [
  { title: 'Creada', value: 'created' },
  { title: 'Pendiente', value: 'pending' },
  { title: 'En proceso', value: 'in_progress' },
  { title: 'En revision', value: 'in_review' },
  { title: 'Completada', value: 'completed' },
  { title: 'Cerrada', value: 'closed' },
]

const priorityOptions = [
  { title: 'High', value: 'high' },
  { title: 'Medium', value: 'medium' },
  { title: 'Low', value: 'low' },
]

const typeOptions = computed(() => {
  const map = new Map<string, string>()

  workOrdersStore.items.forEach(item => {
    const value = item.type ?? item.type_catalog?.name
    if (value)
      map.set(String(value), String(value))
  })

  return Array.from(map.entries()).map(([value, title]) => ({ value, title }))
})

const getStatusColor = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('pendiente') || normalized.includes('pending'))
    return 'warning'

  if (normalized.includes('created'))
    return 'info'

  if (normalized.includes('cerrado') || normalized.includes('closed'))
    return 'secondary'

  if (normalized.includes('proceso') || normalized.includes('progress'))
    return 'info'

  return 'success'
}

const getStatusLabel = (value: string) => {
  if (!value)
    return '-'

  return String(value).toUpperCase()
}

const getPriorityColor = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('high'))
    return 'error'

  if (normalized.includes('medium'))
    return 'warning'

  if (normalized.includes('low'))
    return 'success'

  return 'secondary'
}

const handleExport = () => {
  const rows = tableItems.value

  if (!rows.length)
    return

  const columns = [
    { key: 'folio', title: 'FOLIO' },
    { key: 'contract', title: 'CONTRATO' },
    { key: 'user', title: 'USUARIO' },
    { key: 'type', title: 'TIPO' },
    { key: 'subject', title: 'ASUNTO' },
    { key: 'priority', title: 'PRIORIDAD' },
    { key: 'status', title: 'ESTATUS' },
    { key: 'scheduled', title: 'PROGRAMADA' },
  ]

  const escapeValue = (value: any) => {
    const text = String(value ?? '')
    const needsEscaping = text.includes(',') || text.includes('"') || text.includes('\n')

    return needsEscaping ? `"${text.replace(/\"/g, '""')}"` : text
  }

  const csvRows = [
    columns.map(column => column.title).join(','),
    ...rows.map(row => columns.map(column => escapeValue((row as any)[column.key])).join(',')),
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', `workorders_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const handleOptionsUpdate = (params: Record<string, any>) => {
  const page = params.page ?? workOrdersStore.pagination.current_page ?? 1
  const perPage = params.per_page ?? itemsPerPage.value ?? workOrdersStore.pagination.per_page

  if (params.per_page) {
    workOrdersStore.setItemsPerPage(perPage)
    itemsPerPage.value = perPage
  }
  if (params.page)
    workOrdersStore.setPage(page)

  const requestParams = workOrdersStore.buildParams(page, perPage, {
    search: search.value,
    local_id: search.value || undefined,
    folio: search.value || undefined,
    status: filters.value.status,
    type: filters.value.type,
    priority: filters.value.priority,
  })
  requestParams.itemsPerPage = perPage
  workOrdersStore.fetchList(requestParams)
}

const handleRowClick = (item: any) => {
  const workOrderId = item?._raw?.id ?? item?.id
  if (!workOrderId)
    return

  router.push({ name: 'WorkOrderDetail', params: { id: workOrderId } })
}

const additionalParams = computed(() => ({
  search: search.value,
  local_id: search.value || undefined,
  folio: search.value || undefined,
  status: filters.value.status,
  type: filters.value.type,
  priority: filters.value.priority,
}))

watch(() => workOrdersStore.pagination.per_page, value => {
  itemsPerPage.value = value
})

watch(search, () => {
  const params = workOrdersStore.buildParams(1, workOrdersStore.pagination.per_page, {
    search: search.value,
    local_id: search.value || undefined,
    folio: search.value || undefined,
  })
  params.itemsPerPage = workOrdersStore.pagination.per_page
  workOrdersStore.fetchList(params)
})

const applyFilters = () => {
  const params = workOrdersStore.buildParams(1, workOrdersStore.pagination.per_page, {
    search: search.value,
    local_id: search.value || undefined,
    folio: search.value || undefined,
    status: filters.value.status,
    type: filters.value.type,
    priority: filters.value.priority,
  })
  params.itemsPerPage = workOrdersStore.pagination.per_page
  workOrdersStore.fetchList(params)
}

const clearFilters = () => {
  filters.value = {
    status: '',
    type: '',
    priority: '',
  }
  applyFilters()
}

const handlePerPageChange = (value: number) => {
  handleOptionsUpdate({ page: 1, per_page: value })
}

onMounted(() => {
  const params = workOrdersStore.buildParams(1, workOrdersStore.pagination.per_page, {
    search: search.value,
    local_id: search.value || undefined,
    folio: search.value || undefined,
  })
  params.itemsPerPage = workOrdersStore.pagination.per_page
  workOrdersStore.fetchList(params)
})
</script>

<template>
  <div class="workorders-page">
    <BaseListHeader
      v-if="!pageLoading"
      :title="t('WorkOrders.WorkOrdersModule.title')"
      icon="tabler-clipboard-list"
      :total="workOrdersStore.pagination.total"
      item-label="orden"
      item-label-plural="ordenes"
      :description="t('WorkOrders.WorkOrdersModule.description')"
      :show-create-button="false"
      class="workorders-header"
    />
    <VSkeletonLoader
      v-else
      type="heading"
      class="workorders-header"
    />

    <VCard class="workorders-table">
      <VCardText>
        <div v-if="pageLoading" class="workorders-toolbar">
          <VSkeletonLoader type="text" class="workorders-toolbar__search" />
          <div class="workorders-toolbar__actions">
            <VSkeletonLoader type="text" width="140" />
            <VSkeletonLoader type="text" width="120" />
            <VSkeletonLoader type="text" width="120" />
          </div>
        </div>
        <div v-else class="workorders-toolbar">
          <VTextField
            v-model="search"
            variant="outlined"
            density="compact"
            placeholder="Buscar"
            prepend-inner-icon="tabler-search"
            hide-details
            class="workorders-toolbar__search"
          />
          <div class="workorders-toolbar__actions">
            <VSelect
              v-model="itemsPerPage"
              :items="perPageOptions"
              density="compact"
              variant="outlined"
              hide-details
              class="workorders-toolbar__select"
              @update:model-value="handlePerPageChange"
            />
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="tabler-upload"
              class="workorders-toolbar__export"
              @click="handleExport"
            >
              Exportar
            </VBtn>
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="tabler-adjustments"
              @click="filterOpen = true"
            >
              Filtros
            </VBtn>
          </div>
        </div>

        <BaseDataTable
          :headers="headers"
          :items="tableItems"
          :meta="workOrdersStore.pagination"
          :loading="workOrdersStore.loading"
          :additional-params="additionalParams"
          :items-per-page-options="perPageOptions"
          :empty-state-title="t('WorkOrders.WorkOrdersModule.empty.title')"
          :empty-state-description="t('WorkOrders.WorkOrdersModule.empty.description')"
          empty-state-icon="tabler-clipboard-off"
          @update:options="handleOptionsUpdate"
          @row:click="handleRowClick"
        >
          <template #item.status="{ item }">
            <VChip
              size="small"
              variant="tonal"
              :color="getStatusColor(item.status)"
            >
              {{ getStatusLabel(item.status) }}
            </VChip>
          </template>
          <template #item.priority="{ item }">
            <VChip
              size="small"
              variant="tonal"
              :color="getPriorityColor(item.priority)"
            >
              {{ item.priority || '-' }}
            </VChip>
          </template>
          <template #actions>
            <VBtn
              icon="tabler-dots-vertical"
              variant="text"
              size="small"
              color="secondary"
            />
          </template>
        </BaseDataTable>
      </VCardText>
    </VCard>

    <WorkOrdersFilterDrawer
      v-model="filterOpen"
      title="Estatus"
      @apply="applyFilters"
      @clear="clearFilters"
    >
      <VSelect
        v-model="filters.status"
        :items="statusOptions"
        item-title="title"
        item-value="value"
        label="Estado"
        density="compact"
        variant="outlined"
        hide-details
      />
      <VSelect
        v-model="filters.type"
        :items="typeOptions"
        item-title="title"
        item-value="value"
        label="Tipo"
        density="compact"
        variant="outlined"
        hide-details
      />
      <VSelect
        v-model="filters.priority"
        :items="priorityOptions"
        item-title="title"
        item-value="value"
        label="Prioridad"
        density="compact"
        variant="outlined"
        hide-details
      />
    </WorkOrdersFilterDrawer>
  </div>
</template>

<style scoped lang="scss">
.workorders-page {
  inline-size: 100%;
  padding-block: 12px 32px;
}

.workorders-header {
  margin-block-end: 16px;
}

.workorders-table {
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.workorders-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-block-end: 12px;
}

.workorders-toolbar__search {
  max-inline-size: 280px;
}

.workorders-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.workorders-toolbar__select {
  max-inline-size: 88px;
}

.workorders-toolbar__export {
  font-weight: 600;
}
</style>
