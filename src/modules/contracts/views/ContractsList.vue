<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ContractsApi } from '../services/contractsApi'
import { useContractsHelpers } from '../composables/useContractsHelpers'
import ContractsFilters from '../components/ContractsFilters.vue'
import ContractDetailModal from '../components/ContractDetailModal.vue'
import type { Contract } from '../types/Contract'

// Composables
const { formatCurrency, getStatusColor } = useContractsHelpers()

// State
const contracts = ref<Contract[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedStatus = ref<string | null>(null)
const selectedSector = ref<string | null>(null)
const selectedSystem = ref<string | null>(null)
const selectedTypeContract = ref<string | null>(null)

// Pagination
const page = ref(1)
const itemsPerPage = ref(15)
const totalContracts = ref(0)

// Modal state
const showDetailModal = ref(false)
const selectedContractId = ref<string | null>(null)

// Table headers
const headers = [
  { title: 'ID CONTRATO', key: 'contratid', sortable: false, width: '120px' },
  { title: 'CUENTA', key: 'account', sortable: false, width: '130px' },
  { title: 'CLIENTE', key: 'nameuser', sortable: false },
  { title: 'DIRECCIÓN', key: 'address', sortable: false },
  { title: 'SISTEMA / SECTOR', key: 'systems', sortable: false },
  { title: 'ADEUDO', key: 'debt', sortable: false, align: 'end' },
  { title: 'ESTADO', key: 'status', sortable: false, align: 'center', width: '120px' },
  { title: 'ACCIONES', key: 'actions', sortable: false, align: 'center', width: '100px' },
]

// Methods
const openDetailModal = (contratid: string) => {
  selectedContractId.value = contratid
  showDetailModal.value = true
}

// Methods
const fetchContracts = async () => {
  loading.value = true
  try {
    const filters = {
      page: page.value,
      per_page: itemsPerPage.value,
      search: searchQuery.value || undefined,
      status: selectedStatus.value || undefined,
      sector: selectedSector.value || undefined,
      systems: selectedSystem.value || undefined,
      type_contract: selectedTypeContract.value || undefined,
    }

    const response = await ContractsApi.getContracts(filters)

    contracts.value = response.data
    totalContracts.value = response.meta.total
  }
  catch (error) {
    console.error('Error loading contracts:', error)
  }
  finally {
    loading.value = false
  }
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
        :items="contracts"
        :loading="loading"
        :items-per-page="itemsPerPage"
        class="text-no-wrap contracts-table"
      >
        <!-- ID CONTRATO -->
        <template #item.contratid="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.contratid }}</span>
        </template>

        <!-- CUENTA -->
        <template #item.account="{ item }">
          <div class="d-flex flex-column">
            <span class="text-body-2 font-weight-medium">{{ item.account }}</span>
            <VChip
              size="x-small"
              color="info"
              variant="tonal"
              class="mt-1"
            >
              {{ item.type_contrat }}
            </VChip>
          </div>
        </template>

        <!-- CLIENTE -->
        <template #item.nameuser="{ item }">
          <span class="text-body-1 font-weight-medium">{{ item.nameuser }}</span>
        </template>

        <!-- DIRECCIÓN -->
        <template #item.address="{ item }">
          <VTooltip
            location="top"
            :disabled="item.address.length < 50"
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

        <!-- SISTEMA / SECTOR -->
        <template #item.systems="{ item }">
          <div class="d-flex flex-column">
            <span class="text-body-2 font-weight-medium text-primary">{{ item.systems }}</span>
            <span class="text-caption text-secondary">{{ item.sector }}</span>
          </div>
        </template>

        <!-- ADEUDO -->
        <template #item.debt="{ item }">
          <div class="d-flex flex-column align-end">
            <span class="text-body-1 font-weight-bold">
              {{ formatCurrency(item.debt) }}
            </span>
            <span class="text-caption text-medium-emphasis mt-1">
              <template v-if="parseInt(item.debt_months) > 0">
                {{ item.debt_months }} {{ parseInt(item.debt_months) === 1 ? 'mes' : 'meses' }} de adeudo
              </template>
              <template v-else>
                Sin adeudo
              </template>
            </span>
          </div>
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
          <VBtn
            icon="tabler-eye"
            size="small"
            variant="text"
            color="primary"
            @click="openDetailModal(item.contratid)"
          />
        </template>

        <!-- Bottom: Pagination -->
        <template #bottom>
          <VDivider />
          <div class="d-flex justify-space-between align-center flex-wrap gap-3 pa-5 pt-3">
            <p class="text-sm text-medium-emphasis mb-0">
              Mostrando {{ ((page - 1) * itemsPerPage) + 1 }} a {{ Math.min(page * itemsPerPage, totalContracts) }} de {{ totalContracts }} contratos
            </p>
            <VPagination
              v-model="page"
              :length="Math.ceil(totalContracts / itemsPerPage)"
              :total-visible="5"
            />
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Modal de Detalle del Contrato -->
    <ContractDetailModal
      v-model="showDetailModal"
      :contratid="selectedContractId"
    />
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
