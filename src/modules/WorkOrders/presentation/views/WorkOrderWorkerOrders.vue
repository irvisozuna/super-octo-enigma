<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import { useWorkOrdersStore } from '../stores/workOrdersStore'

const route = useRoute()
const router = useRouter()
const store = useWorkOrdersStore()
const pageLoading = computed(() => store.loading)

const search = ref('')
const itemsPerPage = ref(store.pagination.per_page)
const perPageOptions = [10, 25, 50, 100]

const workerId = computed(() => route.params.id as string)

const headers = [
  { title: 'Folio', key: 'folio', sortable: true },
  { title: 'Contrato', key: 'contract', sortable: true },
  { title: 'Usuario', key: 'user', sortable: true },
  { title: 'Tipo', key: 'type', sortable: true },
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

const filteredItems = computed(() => {
  if (!workerId.value)
    return store.items

  return store.items.filter(item => {
    const assignedId = item.assigned_to ?? item.worker_id ?? item.worker?.id ?? item.assigned?.id

    return String(assignedId || '') === String(workerId.value)
  })
})

const tableItems = computed(() => filteredItems.value.map(item => ({
  folio: normalizeValue(item.local_id ?? item.folio ?? item.external_id ?? item.code ?? item.id),
  contract: normalizeValue(item.contract_number ?? item.contract?.contract_number ?? item.contract_id),
  user: normalizeValue(item.user_name ?? item.contract?.user_name ?? item.user ?? item.customer),
  type: normalizeValue(item.type ?? item.type_catalog?.name ?? item.work_order_type_id),
  priority: normalizeValue(item.priority ?? item.severity ?? item.priority_code ?? item.prioridad),
  status: normalizeValue(item.status_catalog?.name ?? item.status ?? item.estado ?? item.state),
  scheduled: formatDate(item.scheduled_at ?? item.requested_at ?? item.due_at),
  _raw: item,
})))

const handleRowClick = (item: any) => {
  const workOrderId = item?._raw?.id ?? item?.id
  if (!workOrderId)
    return

  router.push({ name: 'WorkOrderDetail', params: { id: workOrderId } })
}

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

  if (normalized.includes('high') || normalized.includes('alta'))
    return 'error'

  if (normalized.includes('medium') || normalized.includes('media'))
    return 'warning'

  if (normalized.includes('low') || normalized.includes('baja'))
    return 'success'

  return 'secondary'
}

const getPriorityLabel = (value: string) => {
  const normalized = String(value || '').toLowerCase()

  if (normalized.includes('high') || normalized.includes('alta'))
    return 'Alta'
  if (normalized.includes('medium') || normalized.includes('media'))
    return 'Media'
  if (normalized.includes('low') || normalized.includes('baja'))
    return 'Baja'

  return value || '-'
}

const handleOptionsUpdate = (params: Record<string, any>) => {
  store.fetchList(params)
}

const additionalParams = computed(() => ({
  search: search.value,
  assigned_to: workerId.value,
}))

watch(() => store.pagination.per_page, value => {
  itemsPerPage.value = value
})

watch(search, () => {
  const params = store.buildParams(1, store.pagination.per_page, { search: search.value, assigned_to: workerId.value })
  store.fetchList(params)
})

watch(workerId, () => {
  const params = store.buildParams(1, store.pagination.per_page, { search: search.value, assigned_to: workerId.value })
  store.fetchList(params)
})

const handlePerPageChange = (value: number) => {
  store.setItemsPerPage(value)
  const params = store.buildParams(1, value, { search: search.value, assigned_to: workerId.value })
  store.fetchList(params)
}

onMounted(() => {
  const params = store.buildParams(1, store.pagination.per_page, { search: search.value, assigned_to: workerId.value })
  store.fetchList(params)
})
</script>

<template>
  <div class="workorders-page">
    <BaseListHeader
      v-if="!pageLoading"
      title="Ordenes asignadas"
      icon="tabler-clipboard-check"
      :total="store.pagination.total"
      item-label="orden"
      item-label-plural="ordenes"
      description="Ordenes asignadas al operador seleccionado."
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
          </div>
        </div>

        <BaseDataTable
          :headers="headers"
          :items="tableItems"
          :meta="store.pagination"
          :loading="store.loading"
          :additional-params="additionalParams"
          :items-per-page-options="perPageOptions"
          empty-state-title="Sin ordenes"
          empty-state-description="No hay ordenes asignadas."
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
              {{ getPriorityLabel(item.priority) }}
            </VChip>
          </template>
          <template #actions>
            <VBtn icon="tabler-dots-vertical" variant="text" size="small" color="secondary" />
          </template>
        </BaseDataTable>
      </VCardText>
    </VCard>
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
</style>
