<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import { WorkOrderApiService } from '../../infrastructure/api/services/WorkOrderApiService'

const router = useRouter()
const apiService = new WorkOrderApiService()

const workers = ref<any[]>([])
const workOrders = ref<any[]>([])
const loading = ref(false)

const headers = [
  { title: 'Operador', key: 'name', sortable: true },
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Asignaciones', key: 'assigned', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

const normalizeArray = (response: any) => {
  if (Array.isArray(response))
    return response
  if (Array.isArray(response?.data))
    return response.data
  if (Array.isArray(response?.data?.data))
    return response.data.data

  return []
}

const tableItems = computed(() => {
  const counts = new Map<string, number>()

  workOrders.value.forEach(order => {
    const assignedId = order.assigned_to ?? order.worker_id ?? order.worker?.id ?? order.assigned?.id
    if (!assignedId)
      return

    const key = String(assignedId)
    counts.set(key, (counts.get(key) || 0) + 1)
  })

  return workers.value.map(item => {
    const id = item.id ?? item.worker_id ?? item.user_id ?? '-'
    const key = String(id)

    return {
      id,
      name: item.name ?? item.assigned_to ?? item.full_name ?? item.username ?? '-',
      assigned: counts.get(key) ?? item.assigned_count ?? item.orders_count ?? item.total ?? 0,
      _raw: item,
    }
  })
})

const handleRowClick = (item: any) => {
  const workerId = item?._raw?.id ?? item?.id
  if (!workerId)
    return

  router.push({
    name: 'WorkOrderWorkerOrders',
    params: { id: workerId },
  })
}

const loadWorkers = async () => {
  loading.value = true
  try {
    const response = await apiService.getWorkers()
    workers.value = normalizeArray(response)
  }
  finally {
    loading.value = false
  }
}

const loadWorkOrders = async () => {
  try {
    const response = await apiService.getList({ itemsPerPage: 500, page: 1 })
    workOrders.value = normalizeArray(response)
  }
  catch {
    workOrders.value = []
  }
}

onMounted(async () => {
  await Promise.all([loadWorkers(), loadWorkOrders()])
})
</script>

<template>
  <div class="workorders-page">
    <BaseListHeader
      title="Operadores"
      icon="tabler-user"
      :total="workers.length"
      item-label="operador"
      item-label-plural="operadores"
      description="Lista de operadores con ordenes asignadas."
      :show-create-button="false"
      class="workorders-header"
    />

    <VCard class="workorders-table">
      <VCardText>
        <BaseDataTable
          :headers="headers"
          :items="tableItems"
          :meta="{ current_page: 1, last_page: 1, per_page: tableItems.length, total: tableItems.length }"
          :loading="loading"
          :items-per-page-options="[10, 25, 50, 100]"
          empty-state-title="Sin operadores"
          empty-state-description="No hay operadores disponibles."
          empty-state-icon="tabler-user-off"
          @row:click="handleRowClick"
        >
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
</style>
