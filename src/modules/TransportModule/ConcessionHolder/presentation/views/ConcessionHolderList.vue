<script setup lang="ts">
import { onMounted, ref } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useConcessionHolderPagination } from '../composables/useConcessionHolderPagination'
import type { ConcessionHolderListDto } from '../../application/dtos/ConcessionHolderDtos'
import ConcessionHolderCreateDialogMolecule from '../components/molecules/ConcessionHolderCreateDialogMolecule.vue'
import ConcessionHolderEditDialogMolecule from '../components/molecules/ConcessionHolderEditDialogMolecule.vue'
import ConcessionHolderDeleteDialogMolecule from '../components/molecules/ConcessionHolderDeleteDialogMolecule.vue'
import { useAppManager } from '@/composables/useAppManager'

// Composables
const { navigateTo, openDialog } = useAppManager()
const { t } = useI18n()

// Usar el composable de paginación
const {
  data: concessionHolders,
  loading,
  total,
  currentPage,
  perPage,
  from,
  to,
  loadData,
  search,
  applyFilters,
} = useConcessionHolderPagination()

// Filtros locales
const searchQuery = ref('')

// Dialog states
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedItem = ref<ConcessionHolderListDto | null>(null)

// Headers para la tabla - usando las claves correctas del API
const headers = [
  { title: t('TransportModule.concession_holder.fields.holder_number'), key: 'local_id' },
  { title: t('TransportModule.concession_holder.fields.full_name'), key: 'full_name' },
  { title: t('TransportModule.concession_holder.fields.holder_type'), key: 'holder_type' },
  { title: t('TransportModule.concession_holder.fields.identification_number'), key: 'curp' },
  { title: t('TransportModule.concession_holder.fields.phone'), key: 'phone' },
  { title: t('TransportModule.concession_holder.fields.active_concessions'), key: 'current_concessions_count' },
  { title: t('TransportModule.common.status'), key: 'verification_status' },
  { title: t('TransportModule.common.actions'), key: 'actions', sortable: false },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: 'Export to Excel',
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: 'Export to PDF',
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
]

// Métodos
const debouncedSearch = debounce((query: string) => {
  search(query)
}, 500)

function handleSearch() {
  debouncedSearch(searchQuery.value)
}

function handleTableUpdate(options: any) {
  console.log('Table update options:', options)
  loadData(options)
}

// Dialog management
function openCreateDialog() {
  createDialogVisible.value = true
}

function openViewDialog(item: ConcessionHolderListDto) {
  navigateTo(`/concession-holders/${item.id}`)
}

function openEditDialog(item: ConcessionHolderListDto) {
  selectedItem.value = item
  editDialogVisible.value = true
}

function openDeleteDialog(item: ConcessionHolderListDto) {
  selectedItem.value = item
  deleteDialogVisible.value = true
}

function handleCreateSuccess() {
  createDialogVisible.value = false
  loadData() // Recargar la lista
}

function handleEditSuccess() {
  editDialogVisible.value = false
  selectedItem.value = null
  loadData() // Recargar la lista
}

function handleDeleteSuccess() {
  deleteDialogVisible.value = false
  selectedItem.value = null
  loadData() // Recargar la lista
}

function handleDialogCancel() {
  createDialogVisible.value = false
  editDialogVisible.value = false
  deleteDialogVisible.value = false
  selectedItem.value = null
}

function exportItems(type: string) {
  console.log('Export items:', type)

  // TODO: Implementar exportación
}

// Métodos auxiliares para los chips
function getHolderTypeColor(type: string) {
  const colors = {
    natural: 'blue',
    legal: 'green',
    NATURAL: 'purple',
    individual: 'blue',
    company: 'green',
    cooperative: 'purple',
  }

  return colors[type?.toLowerCase()] || 'grey'
}

function getStatusColor(status: string) {
  const colors = {
    verified: 'success',
    pending: 'warning',
    rejected: 'error',
    active: 'success',
    inactive: 'warning',
    suspended: 'error',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

function getStatusText(status: string) {
  const texts = {
    verified: 'Verificado',
    pending: 'Pendiente',
    rejected: 'Rechazado',
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
  }

  return texts[status?.toLowerCase()] || status
}

function getHolderTypeIcon(type: string) {
  const icons = {
    natural: 'tabler-user',
    legal: 'tabler-building',
    NATURAL: 'tabler-user',
    individual: 'tabler-user',
    company: 'tabler-building',
    cooperative: 'tabler-users',
  }

  return icons[type?.toLowerCase()] || 'tabler-user'
}

function formatActiveConcessions(count: number) {
  if (!count)
    return '0'

  return count.toString()
}

// onMounted
onMounted(() => {
  loadData()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ t('TransportModule.concession_holder.title') }}
      </h4>
      <p class="text-body-1 mb-4">
        {{ t('TransportModule.concession_holder.list_title') }}
      </p>
    </VCardTitle>

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField
          v-model="searchQuery"
          :label="t('TransportModule.concession_holder.search_placeholder')"
          variant="outlined"
          dense
          class="filter-field"
          @input="handleSearch"
        />

        <!-- Botón para exportar -->
        <GlobalMenu
          :menu-options="menuOptions"
          :loading="loading"
          :disabled="concessionHolders.length === 0"
        >
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="outlined"
              :loading="loading"
              :disabled="concessionHolders.length === 0"
            >
              <VIcon start>
                tabler-download
              </VIcon>
              Export
            </VBtn>
          </template>
        </GlobalMenu>

        <!-- Botón para agregar -->
        <VBtn
          color="primary"
          @click="openCreateDialog"
        >
          <VIcon start>
            tabler-plus
          </VIcon>
          {{ t('TransportModule.concession_holder.actions.add_holder') }}
        </VBtn>
      </div>

      <!-- Tabla de concesionarios -->
      <VDataTableServer
        v-model:items-per-page="perPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="concessionHolders"
        :items-length="total"
        :loading="loading"
        class="elevation-1"
        item-value="id"
        @update:options="handleTableUpdate"
      >
        <!-- Slot para número de titular -->
        <template #[`item.local_id`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-id-badge
            </VIcon>
            <span class="font-weight-medium">{{ item.local_id }}</span>
          </div>
        </template>

        <!-- Slot para nombre completo -->
        <template #[`item.full_name`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              :icon="getHolderTypeIcon(item.holder_type)"
              size="18"
              class="me-2"
            />
            <div>
              <div class="font-weight-medium">
                {{ item.full_name }}
              </div>
            </div>
          </div>
        </template>

        <!-- Slot para tipo de titular -->
        <template #[`item.holder_type`]="{ item }">
          <VChip
            :color="getHolderTypeColor(item.holder_type)"
            size="small"
            variant="tonal"
          >
            {{ item.holder_type_label }}
          </VChip>
        </template>

        <!-- Slot para número de identificación -->
        <template #[`item.curp`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="18"
              class="me-2"
            >
              tabler-card-boards
            </VIcon>
            <span>{{ item.curp || item.rfc || '-' }}</span>
          </div>
        </template>

        <!-- Slot para teléfono -->
        <template #[`item.phone`]="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="18"
              class="me-2"
            >
              tabler-phone
            </VIcon>
            <span>{{ item.phone || '-' }}</span>
          </div>
        </template>

        <!-- Slot para concesiones activas -->
        <template #[`item.current_concessions_count`]="{ item }">
          <VChip
            :color="item.current_concessions_count > 0 ? 'success' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ formatActiveConcessions(item.current_concessions_count) }}
          </VChip>
        </template>

        <!-- Slot para estatus -->
        <template #[`item.verification_status`]="{ item }">
          <VChip
            :color="getStatusColor(item.verification_status)"
            size="small"
            variant="tonal"
          >
            {{ item.verification_status_label }}
          </VChip>
        </template>

        <!-- Slot para acciones -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              icon
              variant="text"
              size="small"
              color="default"
              @click="openViewDialog(item)"
            >
              <VIcon size="22">
                tabler-eye
              </VIcon>
            </VBtn>

            <VBtn
              icon
              variant="text"
              size="small"
              color="info"
              @click="openEditDialog(item)"
            >
              <VIcon size="22">
                tabler-pencil
              </VIcon>
            </VBtn>

            <VBtn
              icon
              variant="text"
              size="small"
              color="error"
              @click="openDeleteDialog(item)"
            >
              <VIcon size="22">
                tabler-trash
              </VIcon>
            </VBtn>
          </div>
        </template>

        <!-- Slot para cuando no hay datos -->
        <template #no-data>
          <div class="text-center pa-5">
            <VIcon
              size="64"
              color="grey-400"
              class="mb-4"
            >
              tabler-users-off
            </VIcon>
            <h6 class="text-h6 mb-2">
              {{ t('TransportModule.concession_holder.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('TransportModule.concession_holder.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              @click="openCreateDialog"
            >
              {{ t('TransportModule.concession_holder.actions.add_holder') }}
            </VBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCardText>
  </VCard>

  <!-- Create Dialog -->
  <ConcessionHolderCreateDialogMolecule
    v-model="createDialogVisible"
    @success="handleCreateSuccess"
    @close="handleDialogCancel"
  />

  <!-- Edit Dialog -->
  <ConcessionHolderEditDialogMolecule
    :visible="editDialogVisible"
    :item="selectedItem"
    @success="handleEditSuccess"
    @close="handleDialogCancel"
  />

  <!-- Delete Dialog -->
  <ConcessionHolderDeleteDialogMolecule
    v-model="deleteDialogVisible"
    :holder="selectedItem"
    @success="handleDeleteSuccess"
    @cancel="handleDialogCancel"
  />
</template>

<style scoped>
.filter-field {
  min-inline-size: 250px;
}
</style>
