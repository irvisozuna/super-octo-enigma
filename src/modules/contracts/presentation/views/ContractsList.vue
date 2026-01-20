<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContractsStore } from '../stores/contractsStore'
import { useContractsHelpers } from '../composables/useContractsHelpers'
import ContractsFilters from '../components/ContractsFilters.vue'

const router = useRouter()
const contractsStore = useContractsStore()

// Composables
const { formatCurrency, getStatusColor } = useContractsHelpers()

// Filters state (local to view)
const searchQuery = ref('')
const selectedStatus = ref<string | null>(null)
const selectedSector = ref<string | null>(null)
const selectedSystem = ref<string | null>(null)
const selectedTypeContract = ref<string | null>(null)

// Pagination
const page = ref(1)
const itemsPerPage = ref(15)

const navigateToDetail = (id: string) => {
  router.push({ name: 'contracts-detail', params: { id } })
}

// Table headers - Updated keys to match ContractEntity
const headers = [
  { title: 'ID CONTRATO', key: 'contract_id', sortable: false, width: '120px' },
  { title: 'CUENTA', key: 'contract_number', sortable: false, width: '110px' },
  { title: 'CLIENTE', key: 'user_name', sortable: false },
  { title: 'DIRECCIÓN', key: 'address', sortable: false },
  { title: 'TIPO', key: 'contract_type', sortable: false, width: '100px' },
  { title: 'RUTA', key: 'route', sortable: false, width: '100px' },
  { title: 'TARIFA', key: 'rate', sortable: false, width: '120px' },
  { title: 'PERIODO', key: 'period', sortable: false, width: '100px' },
  { title: 'ADEUDO', key: 'debt', sortable: false, align: 'end', width: '100px' },
  { title: 'ESTADO', key: 'status', sortable: false, align: 'center', width: '100px' },
  { title: 'ACCIONES', key: 'actions', sortable: false, align: 'center', width: '80px' },
]

// Methods
const fetchContracts = async () => {
  const params = {
    page: page.value,
    per_page: itemsPerPage.value,
    search: searchQuery.value || undefined,
    status: selectedStatus.value || undefined,
    sector: selectedSector.value || undefined,
    systems: selectedSystem.value || undefined,
    type_contract: selectedTypeContract.value || undefined,
  }

  await contractsStore.fetchList(params)
}

// Watchers for filters
watch([page, itemsPerPage], () => {
  fetchContracts()
})

watch([searchQuery, selectedStatus, selectedSector, selectedSystem, selectedTypeContract], () => {
  page.value = 1 // Reset to first page on filter change
  fetchContracts()
})

const clearFilters = () => {
  selectedStatus.value = null
  selectedSector.value = null
  selectedSystem.value = null
  selectedTypeContract.value = null
  searchQuery.value = ''
}

// Lifecycle
onMounted(() => {
  fetchContracts()
})
</script>

<template>
  <div>
    <VCard>
      <VCardText>
        <ContractsFilters
          v-model:search-query="searchQuery"
          v-model:selected-status="selectedStatus"
          v-model:selected-sector="selectedSector"
          v-model:selected-system="selectedSystem"
          v-model:selected-type-contract="selectedTypeContract"
          @clear="clearFilters"
        />
      </VCardText>

      <VDivider />

      <VDataTable
        :headers="headers"
        :items="contractsStore.items"
        :loading="contractsStore.loading"
        :items-per-page="itemsPerPage"
        class="text-no-wrap contracts-table"
      >
        <!-- ID CONTRATO -->
        <template #item.contract_id="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.contract_id }}</span>
        </template>

        <!-- CUENTA -->
        <template #item.contract_number="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.contract_number }}</span>
        </template>

        <!-- CLIENTE -->
        <template #item.user_name="{ item }">
          <span class="text-body-1 font-weight-medium">{{ item.user_name }}</span>
        </template>

        <!-- DIRECCIÓN -->
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

        <!-- TIPO, RUTA, TARIFA, PERIODO -->
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

        <!-- ADEUDO -->
        <template #item.debt="{ item }">
          <span
            :class="item.debt > 0 ? 'text-error font-weight-bold' : 'text-success'"
            class="text-body-2"
          >
            {{ formatCurrency(item.debt) }}
          </span>
        </template>

        <!-- ESTADO -->
        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            variant="elevated"
            size="small"
          >
            {{ item.status }}
          </VChip>
        </template>

        <!-- ACCIONES -->
        <template #item.actions="{ item }">
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
              <!-- Opción: Detalle -->
              <VListItem
                value="detail"
                @click="navigateToDetail(item.id)"
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

              <!-- Opción: Sincronizar -->
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

              <!-- Opción: Editar -->
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

              <!-- Opción: Eliminar -->
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

        <!-- Bottom: Pagination -->
        <template #bottom>
          <VDivider />
          <div class="d-flex justify-space-between align-center flex-wrap gap-3 pa-5 pt-3">
            <p class="text-sm text-medium-emphasis mb-0">
              Mostrando {{ ((page - 1) * itemsPerPage) + 1 }} a {{ Math.min(page * itemsPerPage, contractsStore.pagination.total) }} de {{ contractsStore.pagination.total }} contratos
            </p>
            <VPagination
              v-model="page"
              :length="contractsStore.pagination.last_page"
              :total-visible="5"
            />
          </div>
        </template>
      </VDataTable>
    </VCard>
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

.contracts-table :deep(.v-data-table__td) {
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}
</style>
