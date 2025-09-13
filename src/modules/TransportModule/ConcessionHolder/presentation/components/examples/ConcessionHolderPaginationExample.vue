<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useConcessionHolderPagination } from '../composables/useConcessionHolderPagination'
import type { ConcessionHolderListDto } from '../../application/dtos/ConcessionHolderDtos'

// Usar el composable de paginación
const {
  data,
  loading,
  error,
  currentPage,
  perPage,
  total,
  lastPage,
  from,
  to,
  paginationInfo,
  loadData,
  goToPage,
  changePerPage,
  applyFilters,
  search,
  sort,
} = useConcessionHolderPagination()

// Estado local para filtros
const searchQuery = ref('')
const selectedHolderType = ref('')
const selectedVerificationStatus = ref('')

// Opciones para filtros
const holderTypeOptions = [
  { title: 'Persona Física', value: 'NATURAL' },
  { title: 'Persona Moral', value: 'LEGAL' },
]

const verificationStatusOptions = [
  { title: 'Pendiente', value: 'PENDING' },
  { title: 'Verificado', value: 'VERIFIED' },
  { title: 'Rechazado', value: 'REJECTED' },
]

const perPageOptions = [
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
]

// Headers de la tabla
const headers = [
  { title: 'ID', key: 'local_id', sortable: true },
  { title: 'Nombre Completo', key: 'full_name', sortable: true },
  { title: 'Tipo', key: 'holder_type', sortable: true },
  { title: 'CURP', key: 'curp', sortable: true },
  { title: 'RFC', key: 'rfc', sortable: true },
  { title: 'Teléfono', key: 'phone', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Estado', key: 'verification_status', sortable: true },
  { title: 'Concesiones', key: 'current_concessions_count', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Métodos de manejo de eventos
const handleSearch = () => {
  search(searchQuery.value)
}

const handleFilterChange = () => {
  const filters: any = {}

  if (selectedHolderType.value)
    filters.holder_type = selectedHolderType.value

  if (selectedVerificationStatus.value)
    filters.verification_status = selectedVerificationStatus.value

  applyFilters(filters)
}

const handlePageChange = (page: number) => {
  goToPage(page)
}

const handlePerPageChange = (newPerPage: number) => {
  changePerPage(newPerPage)
}

const handleSort = (sortBy: string[]) => {
  if (sortBy.length > 0)
    sort(sortBy[0], 'asc') // Por simplicidad, siempre ascendente
}

// Métodos de utilidad
const getVerificationStatusColor = (status: string) => {
  switch (status) {
  case 'VERIFIED': return 'success'
  case 'PENDING': return 'warning'
  case 'REJECTED': return 'error'
  default: return 'default'
  }
}

const getHolderTypeColor = (type: string) => {
  switch (type) {
  case 'NATURAL': return 'primary'
  case 'INDIVIDUAL': return 'secondary'
  case 'LEGAL': return 'info'
  case 'COMPANY': return 'success'
  case 'PHYSICAL': return 'warning'
  default: return 'default'
  }
}

// Métodos de acciones
const viewDetails = (item: ConcessionHolderListDto) => {
  console.log('Ver detalles:', item)

  // Implementar navegación a vista de detalles
}

const editItem = (item: ConcessionHolderListDto) => {
  console.log('Editar:', item)

  // Implementar navegación a vista de edición
}

// Cargar datos al montar el componente
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="concession-holder-pagination-example">
    <!-- Filtros -->
    <div class="filters-section mb-4">
      <VRow>
        <VCol
          cols="12"
          md="4"
        >
          <VTextField
            v-model="searchQuery"
            label="Buscar"
            placeholder="Nombre, CURP, RFC..."
            prepend-inner-icon="tabler-search"
            clearable
            @keyup.enter="handleSearch"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <VSelect
            v-model="selectedHolderType"
            label="Tipo de titular"
            :items="holderTypeOptions"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <VSelect
            v-model="selectedVerificationStatus"
            label="Estado de verificación"
            :items="verificationStatusOptions"
            clearable
            @update:model-value="handleFilterChange"
          />
        </VCol>
        <VCol
          cols="12"
          md="2"
        >
          <VBtn
            color="primary"
            :loading="loading"
            @click="handleSearch"
          >
            Buscar
          </VBtn>
        </VCol>
      </VRow>
    </div>

    <!-- Tabla de datos -->
    <VCard>
      <VDataTable
        :headers="headers"
        :items="data"
        :loading="loading"
        :items-per-page="perPage"
        :page="currentPage"
        :server-items-length="total"
        @update:page="handlePageChange"
        @update:items-per-page="handlePerPageChange"
        @update:sort-by="handleSort"
      >
        <!-- Slot para acciones -->
        <template #item.actions="{ item }">
          <VBtn
            size="small"
            color="primary"
            variant="text"
            @click="viewDetails(item)"
          >
            Ver
          </VBtn>
          <VBtn
            size="small"
            color="secondary"
            variant="text"
            @click="editItem(item)"
          >
            Editar
          </VBtn>
        </template>

        <!-- Slot para estado de verificación -->
        <template #item.verification_status="{ item }">
          <VChip
            :color="getVerificationStatusColor(item.verification_status)"
            size="small"
          >
            {{ item.verification_status_label }}
          </VChip>
        </template>

        <!-- Slot para tipo de titular -->
        <template #item.holder_type="{ item }">
          <VChip
            :color="getHolderTypeColor(item.holder_type)"
            size="small"
          >
            {{ item.holder_type_label }}
          </VChip>
        </template>
      </VDataTable>
    </VCard>

    <!-- Información de paginación -->
    <div class="pagination-info mt-4">
      <VRow align="center">
        <VCol
          cols="12"
          md="6"
        >
          <p class="text-body-2 text-medium-emphasis">
            Mostrando {{ from }} a {{ to }} de {{ total }} registros
          </p>
        </VCol>
        <VCol
          cols="12"
          md="6"
          class="text-md-end"
        >
          <VSelect
            v-model="perPage"
            :items="perPageOptions"
            label="Por página"
            density="compact"
            style="max-inline-size: 120px;"
            @update:model-value="handlePerPageChange"
          />
        </VCol>
      </VRow>
    </div>

    <!-- Navegación de páginas -->
    <div class="pagination-navigation mt-4">
      <VPagination
        v-model="currentPage"
        :length="lastPage"
        :total-visible="7"
        @update:model-value="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.concession-holder-pagination-example {
  padding: 1rem;
}

.filters-section {
  padding: 1rem;
  border: 1px solid rgb(var(--v-border-color));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
}

.pagination-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pagination-navigation {
  display: flex;
  justify-content: center;
}
</style>
