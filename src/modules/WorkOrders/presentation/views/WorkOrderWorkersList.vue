<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import { WorkOrderApiService } from '../../infrastructure/api/services/WorkOrderApiService'
import { rawApi } from '@/services/api'
import { useNotification } from '@/helpers/notificationHelper'
import { useTenantStore } from '@/stores/tenant.store'

const router = useRouter()
const apiService = new WorkOrderApiService()
const { showSuccess, showError } = useNotification()
const tenantStore = useTenantStore()
const companyId = computed(() => tenantStore.data?.companyId || '')

const workers = ref<any[]>([])
const workOrders = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(15)
const perPageOptions = [10, 15, 25, 50, 100]
const linkDialogOpen = ref(false)
const users = ref<any[]>([])
const usersLoading = ref(false)
const savingLink = ref(false)
const selectedWorker = ref<any | null>(null)
const selectedUserId = ref<string | null>(null)

const headers = [
  { title: 'Operador', key: 'name', sortable: true },
  { title: 'Codigo', key: 'employee_code', sortable: true },
  { title: 'Usuario vinculado', key: 'linked_user', sortable: true },
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
    const employeeCode = item.employee_code ?? item.external_id ?? item.externalId ?? item.code ?? '-'
    const userId = item.user_id ?? item.userId ?? item.user?.id ?? null
    const linkedUserFromCatalog = userId ? usersById.value.get(String(userId)) : null
    const linkedUser = linkedUserFromCatalog?.name
      ?? linkedUserFromCatalog?.username
      ?? linkedUserFromCatalog?.email
      ?? item.user?.name
      ?? item.user_name
      ?? item.user?.email
      ?? (userId ? `#${userId}` : 'Sin vincular')

    return {
      name: item.name ?? item.assigned_to ?? item.full_name ?? item.username ?? '-',
      employee_code: employeeCode,
      linked_user: linkedUser,
      assigned: counts.get(key) ?? item.assigned_count ?? item.orders_count ?? item.total ?? 0,
      _raw: item,
    }
  })
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value

  return tableItems.value.slice(start, end)
})

const pagination = computed(() => ({
  current_page: currentPage.value,
  last_page: Math.max(1, Math.ceil(tableItems.value.length / itemsPerPage.value)),
  per_page: itemsPerPage.value,
  total: tableItems.value.length,
}))

const handleOptionsUpdate = (params: Record<string, any>) => {
  if (params.page)
    currentPage.value = params.page
  if (params.per_page) {
    itemsPerPage.value = params.per_page
    currentPage.value = 1
  }
}

const userOptions = computed(() => {
  return users.value.map(item => ({
    title: item.name ?? item.full_name ?? item.username ?? item.email ?? String(item.rowid ?? item.id ?? ''),
    value: String(item.rowid ?? item.id ?? ''),
  })).filter(item => item.value)
})

const usersById = computed(() => {
  const map = new Map<string, any>()
  users.value.forEach(item => {
    const keys = [
      item.id,
      item.rowid,
      item.user_id,
      item.userId,
      item.uuid,
      item.external_id,
      item.externalId,
    ].filter(key => key !== null && key !== undefined && key !== '')

    keys.forEach(key => map.set(String(key), item))
  })

  return map
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

const loadUsers = async () => {
  usersLoading.value = true
  try {
    const response = await rawApi('/users', {
      method: 'GET',
      params: {
        itemsPerPage: 1000,
        page: 1,
        company_id: companyId.value || undefined,
      },
    })
    const allUsers = normalizeArray(response)
    const hasCompanyField = allUsers.some((item: any) => item?.company_id || item?.companyId)
    if (companyId.value && hasCompanyField) {
      users.value = allUsers.filter((item: any) =>
        String(item.company_id ?? item.companyId ?? '') === String(companyId.value),
      )
    }
    else {
      // If the catalog does not include company_id, keep the full list.
      users.value = allUsers
    }
  }
  catch {
    users.value = []
  }
  finally {
    usersLoading.value = false
  }
}

const openLinkDialog = async (item: any) => {
  selectedWorker.value = item?._raw ?? null
  const currentUserId = selectedWorker.value?.user_id ?? selectedWorker.value?.userId ?? selectedWorker.value?.user?.id ?? null
  selectedUserId.value = currentUserId ? String(currentUserId) : null
  linkDialogOpen.value = true

  if (!users.value.length)
    await loadUsers()
}

const saveUserLink = async () => {
  const workerId = selectedWorker.value?.id ?? selectedWorker.value?.worker_id
  if (!workerId || !selectedUserId.value)
    return

  savingLink.value = true
  try {
    const worker = selectedWorker.value ?? {}
    await apiService.updateWorker(workerId, {
      id: worker.id ?? workerId,
      local_id: worker.local_id ?? worker.localId ?? worker.localid ?? undefined,
      company_id: worker.company_id ?? worker.companyId ?? undefined,
      name: worker.name ?? worker.full_name ?? worker.username ?? undefined,
      employee_code: worker.employee_code ?? worker.employeeCode ?? undefined,
      phone: worker.phone ?? undefined,
      email: worker.email ?? undefined,
      is_active: worker.is_active ?? worker.isActive ?? true,
      meta: worker.meta ?? undefined,
      user_id: selectedUserId.value,
      userId: selectedUserId.value,
      fk_user_assign: selectedUserId.value,
    })

    showSuccess('Usuario vinculado correctamente.')
    linkDialogOpen.value = false
    await Promise.all([loadWorkers(), loadWorkOrders()])
  }
  catch (error) {
    showError('No se pudo vincular el usuario.')
    console.error(error)
  }
  finally {
    savingLink.value = false
  }
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
  await Promise.all([loadWorkers(), loadWorkOrders(), loadUsers()])
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
          :items="pagedItems"
          :meta="pagination"
          :loading="loading"
          :items-per-page-options="perPageOptions"
          empty-state-title="Sin operadores"
          empty-state-description="No hay operadores disponibles."
          empty-state-icon="tabler-user-off"
          @update:options="handleOptionsUpdate"
          @row:click="handleRowClick"
        >
          <template #actions="{ item }">
            <VMenu location="bottom end">
              <template #activator="{ props }">
                <VBtn v-bind="props" icon="tabler-dots-vertical" variant="text" size="small" color="secondary" />
              </template>
              <VList density="compact">
                <VListItem prepend-icon="tabler-link" title="Vincular usuario" @click="openLinkDialog(item)" />
              </VList>
            </VMenu>
          </template>
        </BaseDataTable>
      </VCardText>
    </VCard>

    <VDialog v-model="linkDialogOpen" max-width="520">
      <VCard>
        <VCardTitle class="text-h6">Vincular usuario</VCardTitle>
        <VCardText class="d-flex flex-column gap-4">
          <div class="text-body-2">
            Operador: <strong>{{ selectedWorker?.name ?? selectedWorker?.full_name ?? selectedWorker?.username ?? '-' }}</strong>
          </div>
          <VSelect
            v-model="selectedUserId"
            :items="userOptions"
            item-title="title"
            item-value="value"
            label="Usuario"
            variant="outlined"
            density="compact"
            :loading="usersLoading"
            :disabled="usersLoading || savingLink"
            hide-details
          />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn variant="text" color="secondary" :disabled="savingLink" @click="linkDialogOpen = false">
            Cancelar
          </VBtn>
          <VBtn color="primary" variant="tonal" :loading="savingLink" :disabled="!selectedUserId" @click="saveUserLink">
            Guardar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
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
