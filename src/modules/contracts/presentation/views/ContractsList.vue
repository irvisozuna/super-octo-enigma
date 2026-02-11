<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContractsStore } from '../stores/contractsStore'
import { useContractsHelpers } from '../composables/useContractsHelpers'
import ContractsFilterDrawer from '../../share/ContractsFilterDrawer.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import BaseDataTable from '@/components/BaseDataTable.vue'

const router = useRouter()
const contractsStore = useContractsStore()

const { formatCurrency, getStatusColor } = useContractsHelpers()

const searchQuery = ref('')
const selectedStatus = ref<string | null>(null)
const selectedSector = ref<string | null>(null)
const selectedSystem = ref<string | null>(null)
const selectedTypeContract = ref<string | null>(null)
const selectedRoute = ref<string | null>(null)
const selectedRate = ref<string | null>(null)
const selectedPeriod = ref<string | null>(null)

const page = ref(1)
const itemsPerPage = ref(contractsStore.pagination.per_page || 15)
const perPageOptions = [10, 25, 50, 100]
const filterOpen = ref(false)

const catalogOptions = ref({
  status: [] as any[],
  sectors: [] as any[],
  systems: [] as any[],
  type_contracts: [] as any[],
  routes: [] as any[],
  rates: [] as any[],
  periods: [] as any[],
})

const catalogsLoading = ref(false)

const getLocalId = (item: any): string | number | null => {
  const localId = item?.local_id ?? item?.localId ?? item?.contract_local_id ?? item?.contractLocalId ?? null

  return localId === undefined || localId === null || localId === '' ? null : localId
}

const navigateToDetail = (item: any) => {
  const localId = getLocalId(item)
  if (localId === null)
    return

  router.push({ name: 'contracts-detail', params: { id: localId } })
}

const headers = [
  { title: 'ID CONTRATO', key: 'contract_id', sortable: false, width: '120px' },
  { title: 'CUENTA', key: 'contract_number', sortable: false, width: '110px' },
  { title: 'CLIENTE', key: 'user_name', sortable: false },
  { title: 'DIRECCION', key: 'address', sortable: false },
  { title: 'TIPO', key: 'contract_type', sortable: false, width: '100px' },
  { title: 'RUTA', key: 'route', sortable: false, width: '100px' },
  { title: 'TARIFA', key: 'rate', sortable: false, width: '120px' },
  { title: 'PERIODO', key: 'period', sortable: false, width: '100px' },
  { title: 'ADEUDO', key: 'debt', sortable: false, align: 'end', width: '100px' },
  { title: 'ESTADO', key: 'status', sortable: false, align: 'center', width: '100px' },
  { title: 'ACCIONES', key: 'actions', sortable: false, align: 'center', width: '80px' },
]

const normalize = (value: any) => String(value ?? '').toLowerCase()

const toSelectOptions = (items?: any[]) => (items ?? []).map(item => ({
  title: item.name || item.code || item.external_id || item.externalId || item.id,
  value: item.external_id ?? item.externalId ?? item.code ?? item.id,
}))

const statusOptions = computed(() => toSelectOptions(catalogOptions.value.status))
const systemOptions = computed(() => toSelectOptions(catalogOptions.value.systems))
const sectorOptions = computed(() => toSelectOptions(catalogOptions.value.sectors))
const typeOptions = computed(() => toSelectOptions(catalogOptions.value.type_contracts))
const routeOptions = computed(() => toSelectOptions(catalogOptions.value.routes))
const rateOptions = computed(() => toSelectOptions(catalogOptions.value.rates))
const periodOptions = computed(() => toSelectOptions(catalogOptions.value.periods))

const getOptionName = (options: Array<{ value: any; title: any }>, value: string | null) => {
  if (!value)
    return null

  const match = options.find(option => normalize(option.value) === normalize(value))

  return match?.title ? String(match.title) : null
}

const matchesCatalogValue = (itemValue: any, filterValue: string | null, options?: Array<{ value: any; title: any }>) => {
  if (!filterValue)
    return true

  const filter = normalize(filterValue)

  const candidates = [
    itemValue?.external_id,
    itemValue?.externalId,
    itemValue?.code,
    itemValue?.name,
    itemValue,
  ].filter(Boolean)

  if (candidates.some(candidate => normalize(candidate) === filter))
    return true

  if (options && typeof itemValue === 'string') {
    const optionName = getOptionName(options, filterValue)
    if (optionName && normalize(optionName) === normalize(itemValue))
      return true
  }

  return false
}

const filteredItems = computed(() => {
  const query = normalize(searchQuery.value).trim()

  return contractsStore.items.filter(item => {
    if (!matchesCatalogValue(item.status, selectedStatus.value, statusOptions.value))
      return false
    if (!matchesCatalogValue(item.system, selectedSystem.value, systemOptions.value))
      return false
    if (!matchesCatalogValue(item.sector, selectedSector.value, sectorOptions.value))
      return false
    if (!matchesCatalogValue(item.contract_type, selectedTypeContract.value, typeOptions.value))
      return false
    if (!matchesCatalogValue(item.route, selectedRoute.value, routeOptions.value))
      return false
    if (!matchesCatalogValue(item.rate, selectedRate.value, rateOptions.value))
      return false
    if (!matchesCatalogValue(item.period, selectedPeriod.value, periodOptions.value))
      return false

    if (!query)
      return true

    const haystack = [
      item.contract_id,
      item.contract_number,
      item.user_name,
      item.address,
      item.route,
      item.rate,
      item.period,
    ].filter(Boolean).map(value => normalize(value)).join(' ')

    return haystack.includes(query)
  })
})

const tableItems = computed(() => filteredItems.value)

const buildParams = () => {
  const status = selectedStatus.value || undefined
  const system = selectedSystem.value || undefined
  const sector = selectedSector.value || undefined
  const typeContract = selectedTypeContract.value || undefined
  const query = searchQuery.value || undefined

  return {
    page: page.value,
    per_page: itemsPerPage.value,
    itemsPerPage: itemsPerPage.value,
    search: query,
    q: query,
    query,
    status,
    contract_status: status,
    external_contract_status_id: status,
    sector,
    sector_id: sector,
    external_sector_id: sector,
    systems: system,
    system,
    system_id: system,
    external_system_id: system,
    type_contract: typeContract,
    contract_type: typeContract,
    external_contract_type_id: typeContract,
    route: selectedRoute.value || undefined,
    external_route_id: selectedRoute.value || undefined,
    rate: selectedRate.value || undefined,
    external_rate_id: selectedRate.value || undefined,
    period: selectedPeriod.value || undefined,
    external_period_id: selectedPeriod.value || undefined,
    type: typeContract,
  }
}

const fetchContracts = async () => {
  await contractsStore.fetchList(buildParams())
}

const loadCatalogs = async () => {
  catalogsLoading.value = true
  try {
    const catalogs = await contractsStore.fetchCatalogs()

    catalogOptions.value = catalogs
  }
  finally {
    catalogsLoading.value = false
  }
}

const clearFilters = () => {
  selectedStatus.value = null
  selectedSector.value = null
  selectedSystem.value = null
  selectedTypeContract.value = null
  selectedRoute.value = null
  selectedRate.value = null
  selectedPeriod.value = null
  searchQuery.value = ''
  page.value = 1
  fetchContracts()
}

const applyFilters = () => {
  page.value = 1
  fetchContracts()
  filterOpen.value = false
}

const handleOptionsUpdate = (params: Record<string, any>) => {
  if (params.page)
    page.value = params.page
  if (params.per_page)
    itemsPerPage.value = params.per_page

  fetchContracts()
}

const handlePerPageChange = (value: number) => {
  handleOptionsUpdate({ page: 1, per_page: value })
}

watch(() => contractsStore.pagination.current_page, value => {
  if (value && value !== page.value)
    page.value = value
})

watch(() => contractsStore.pagination.per_page, value => {
  if (value && value !== itemsPerPage.value)
    itemsPerPage.value = value
})

watch(searchQuery, () => {
  page.value = 1
  fetchContracts()
})

watch(selectedPeriod, () => {
  page.value = 1
  fetchContracts()
})

onMounted(() => {
  loadCatalogs()
  fetchContracts()
})
</script>

<template>
  <div class="contracts-page">
    <BaseListHeader
      title="Contratos"
      icon="tabler-file-description"
      :total="contractsStore.pagination.total"
      item-label="contrato"
      item-label-plural="contratos"
      :show-create-button="false"
      class="contracts-header"
    />

    <VCard class="contracts-table">
      <VCardText>
        <div class="contracts-toolbar">
          <VTextField
            v-model="searchQuery"
            variant="outlined"
            density="compact"
            placeholder="Buscar"
            prepend-inner-icon="tabler-search"
            hide-details
            class="contracts-toolbar__search"
          />
          <div class="contracts-toolbar__actions">
            <VSelect
              v-model="selectedPeriod"
              :items="periodOptions"
              density="compact"
              variant="outlined"
              hide-details
              class="contracts-toolbar__select contracts-toolbar__select--period"
              placeholder="Periodo"
            />
            <VSelect
              v-model="itemsPerPage"
              :items="perPageOptions"
              density="compact"
              variant="outlined"
              hide-details
              class="contracts-toolbar__select"
              @update:model-value="handlePerPageChange"
            />
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
          :meta="contractsStore.pagination"
          :loading="contractsStore.loading"
          :items-per-page-options="perPageOptions"
          empty-state-title="No hay contratos"
          empty-state-description="No se encontraron contratos con los filtros actuales."
          empty-state-icon="tabler-file-off"
          @update:options="handleOptionsUpdate"
        >
          <template #item.contract_id="{ item }">
            <span class="text-body-2 font-weight-medium">{{ item.contract_id }}</span>
          </template>

          <template #item.contract_number="{ item }">
            <span class="text-body-2 font-weight-medium">{{ item.contract_number }}</span>
          </template>

          <template #item.user_name="{ item }">
            <span class="text-body-1 font-weight-medium">{{ item.user_name }}</span>
          </template>

          <template #item.address="{ item }">
            <VTooltip
              location="top"
              :disabled="!item.address || item.address.length < 30"
            >
              <template #activator="{ props }">
                <div
                  v-bind="props"
                  class="address-text"
                >
                  {{ item.address }}
                </div>
              </template>
              <span>{{ item.address }}</span>
            </VTooltip>
          </template>

          <template #item.contract_type="{ item }">
            <span class="text-caption">{{ item.contract_type }}</span>
          </template>

          <template #item.route="{ item }">
            <span class="text-caption">{{ item.route }}</span>
          </template>

          <template #item.rate="{ item }">
            <span class="text-caption">{{ item.rate }}</span>
          </template>

          <template #item.period="{ item }">
            <span class="text-caption">{{ item.period }}</span>
          </template>

          <template #item.debt="{ item }">
            <span
              :class="item.debt > 0 ? 'text-error font-weight-bold' : 'text-success'"
              class="text-body-2"
            >
              {{ formatCurrency(item.debt) }}
            </span>
          </template>

          <template #item.status="{ item }">
            <VChip
              :color="getStatusColor(item.status)"
              variant="elevated"
              size="small"
            >
              {{ item.status }}
            </VChip>
          </template>

          <template #actions="{ item }">
            <VMenu>
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  icon="tabler-dots-vertical"
                  variant="text"
                  size="small"
                  color="medium-emphasis"
                />
              </template>

              <VList density="compact">
                <VListItem
                  value="detail"
                  :disabled="!getLocalId(item)"
                  @click="navigateToDetail(item)"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-eye"
                      size="20"
                      class="me-2"
                      color="primary"
                    />
                  </template>
                  <VListItemTitle>Detalle</VListItemTitle>
                </VListItem>

                <VListItem
                  value="sync"
                  @click="console.log('Sincronizar contrato:', item.contract_id)"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-refresh"
                      size="20"
                      class="me-2"
                      color="info"
                    />
                  </template>
                  <VListItemTitle>Sincronizar</VListItemTitle>
                </VListItem>

                <VListItem
                  value="edit"
                  @click="console.log('Editar contrato:', item.contract_id)"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-pencil"
                      size="20"
                      class="me-2"
                      color="warning"
                    />
                  </template>
                  <VListItemTitle>Editar</VListItemTitle>
                </VListItem>

                <VDivider class="my-1" />

                <VListItem
                  value="delete"
                  @click="contractsStore.deleteItem(item.id)"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-trash"
                      size="20"
                      class="me-2"
                      color="error"
                    />
                  </template>
                  <VListItemTitle class="text-error">
                    Eliminar
                  </VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </template>
        </BaseDataTable>
      </VCardText>
    </VCard>

    <ContractsFilterDrawer
      v-model="filterOpen"
      title="Filtros de contratos"
      @apply="applyFilters"
      @clear="clearFilters"
    >
      <AppSelect
        v-model="selectedTypeContract"
        :items="typeOptions"
        :loading="catalogsLoading"
        item-title="title"
        item-value="value"
        label="Tipo de contrato"
        clearable
      />
      <AppSelect
        v-model="selectedSystem"
        :items="systemOptions"
        :loading="catalogsLoading"
        item-title="title"
        item-value="value"
        label="Sistema"
        clearable
      />
      <AppSelect
        v-model="selectedSector"
        :items="sectorOptions"
        :loading="catalogsLoading"
        item-title="title"
        item-value="value"
        label="Sector"
        clearable
      />
      <AppSelect
        v-model="selectedStatus"
        :items="statusOptions"
        :loading="catalogsLoading"
        item-title="title"
        item-value="value"
        label="Estado"
        clearable
      />
      <AppSelect
        v-model="selectedRoute"
        :items="routeOptions"
        :loading="catalogsLoading"
        item-title="title"
        item-value="value"
        label="Ruta"
        clearable
      />
      <AppSelect
        v-model="selectedRate"
        :items="rateOptions"
        :loading="catalogsLoading"
        item-title="title"
        item-value="value"
        label="Tarifa"
        clearable
      />
      <AppSelect
        v-model="selectedPeriod"
        :items="periodOptions"
        :loading="catalogsLoading"
        item-title="title"
        item-value="value"
        label="Periodo"
        clearable
      />
    </ContractsFilterDrawer>
  </div>
</template>

<style scoped>
.address-text {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}

.contracts-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.contracts-toolbar__search {
  min-width: 240px;
  flex: 1 1 320px;
}

.contracts-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contracts-toolbar__select {
  width: 110px;
}

.contracts-toolbar__select--period {
  width: 160px;
}
</style>
