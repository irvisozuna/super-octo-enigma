<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useClientStore } from '../../presentation/stores/clientStore'
import { useClientCacheV2 } from '../../infrastructure/cache/composables/useClientCacheV2'
import ClientCacheStatusIndicator from '../../infrastructure/cache/components/ClientCacheStatusIndicator.vue'
import type { ClientEntity } from '../../domain/entities/ClientEntity'
import DeleteConfirmationDialog from '@/components/shared/DeleteConfirmationDialog.vue'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const clientStore = useClientStore()

// Sistema de cache V2 (integrado en el store)
const {
  isCacheAvailable,
  forceSync,
  initializeClientCache,
} = useClientCacheV2()

// Estado local para filtros múltiples
const selectedStatuses = ref<string[]>([])
const selectedBusinessTypes = ref<string[]>([])

// Headers para la tabla
const headers = [
  { title: t('ClientModule.fields.client_code'), key: 'client_code' },
  { title: t('ClientModule.fields.company_name'), key: 'business_name' },
  { title: t('ClientModule.fields.trade_name'), key: 'trade_name' },
  { title: t('ClientModule.fields.business_type'), key: 'business_type' },
  { title: t('ClientModule.fields.status'), key: 'status' },
  { title: t('ClientModule.fields.primary_phone'), key: 'primary_phone' },
  { title: t('ClientModule.fields.city'), key: 'city' },
  { title: t('common.actions'), key: 'actions', sortable: false },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: t('ClientModule.common.export_excel'),
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: t('ClientModule.common.export_pdf'),
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
  {
    text: t('ClientModule.common.export_csv'),
    icon: 'tabler-file-text',
    action: () => exportItems('csv'),
  },
]

// Opciones para los selects
const statusOptions = [
  { value: 'active', title: t('ClientModule.status.active'), color: 'success' },
  { value: 'inactive', title: t('ClientModule.status.inactive'), color: 'error' },
  { value: 'pending', title: t('ClientModule.status.pending'), color: 'warning' },
]

const businessTypeOptions = [
  { value: 'corporation', title: t('ClientModule.business_types.corporation') },
  { value: 'llc', title: t('ClientModule.business_types.llc') },
  { value: 'partnership', title: t('ClientModule.business_types.partnership') },
  { value: 'sole_proprietorship', title: t('ClientModule.business_types.sole_proprietorship') },
]

// Computed para chips de filtros activos
const activeFilters = computed(() => {
  const filters: Array<{ label: string; value: string; type: string }> = []

  if (clientStore.filters.search) {
    filters.push({
      label: `Búsqueda: ${clientStore.filters.search}`,
      value: 'search',
      type: 'search',
    })
  }

  selectedStatuses.value.forEach(status => {
    const option = statusOptions.find(o => o.value === status)
    if (option) {
      filters.push({
        label: option.title,
        value: status,
        type: 'status',
      })
    }
  })

  selectedBusinessTypes.value.forEach(businessType => {
    const option = businessTypeOptions.find(o => o.value === businessType)
    if (option) {
      filters.push({
        label: option.title,
        value: businessType,
        type: 'business_type',
      })
    }
  })

  if (clientStore.filters.city) {
    filters.push({
      label: `Ciudad: ${clientStore.filters.city}`,
      value: 'city',
      type: 'city',
    })
  }

  return filters
})

const hasActiveFilters = computed(() => activeFilters.value.length > 0)

// Métodos
const debouncedFetchList = debounce(() => {
  applyFiltersToStore()
}, 500)

function applyFiltersToStore() {
  clientStore.updateFilters({
    status: selectedStatuses.value.length > 0 ? selectedStatuses.value.join(',') as any : undefined,
    business_type: selectedBusinessTypes.value.length > 0 ? selectedBusinessTypes.value.join(',') as any : undefined,
  })
  clientStore.fetchList()
}

function applyFilters() {
  debouncedFetchList()
}

function clearFilters() {
  selectedStatuses.value = []
  selectedBusinessTypes.value = []

  clientStore.updateFilters({
    search: '',
    status: undefined,
    business_type: undefined,
    city: '',
  })

  nextTick(() => {
    clientStore.fetchList()
  })
}

function removeFilter(filter: { type: string; value: string }) {
  if (filter.type === 'search')
    clientStore.filters.search = ''

  else if (filter.type === 'status')
    selectedStatuses.value = selectedStatuses.value.filter(s => s !== filter.value)

  else if (filter.type === 'business_type')
    selectedBusinessTypes.value = selectedBusinessTypes.value.filter(t => t !== filter.value)

  else if (filter.type === 'city')
    clientStore.filters.city = ''

  applyFiltersToStore()
}

function navigateToView(item: ClientEntity) {
  router.push({ name: 'clients-detail', params: { id: item.id } })
}

function navigateToEdit(item: ClientEntity) {
  router.push({ name: 'clients-edit', params: { id: item.id } })
}

async function deleteClient(item: ClientEntity) {
  selectedClient.value = item
  showDeleteDialog.value = true
}

async function handleClientDelete() {
  if (!selectedClient.value)
    return

  try {
    await clientStore.deleteItem(selectedClient.value.id)

    showDeleteDialog.value = false
    selectedClient.value = null
  }
  catch (error) {
    console.error('Error eliminando cliente:', error)
  }
}

async function exportItems(format: 'excel' | 'pdf' | 'csv') {
  try {
    await clientStore.exportData(format)
  }
  catch (error) {
    console.error('Error exporting:', error)
  }
}

// Métodos auxiliares para los chips
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'error',
    pending: 'warning',
  }

  return colors[status?.toLowerCase()] || 'grey'
}

function getBusinessTypeColor(businessType: string) {
  const colors: Record<string, string> = {
    corporation: 'primary',
    llc: 'secondary',
    partnership: 'info',
    sole_proprietorship: 'warning',
  }

  return colors[businessType?.toLowerCase()] || 'grey'
}

// Handle VDataTableServer options update (pagination, sorting)
function handleOptionsUpdate(options: any) {
  const { page, itemsPerPage, sortBy } = options

  const filters: any = {
    page,
    per_page: itemsPerPage,
  }

  // Handle sorting
  if (sortBy && sortBy.length > 0) {
    filters.sort_by = sortBy[0].key
    filters.sort_order = sortBy[0].order || 'asc'
  }

  clientStore.fetchList(filters)
}

// Diálogos
const showDeleteDialog = ref(false)
const selectedClient = ref<ClientEntity | null>(null)

// Inicializar cache al montar
nextTick(async () => {
  try {
    await clientStore.initializeCache()
  }
  catch (error) {
    console.error('Error inicializando cache:', error)
  }
})
</script>

<template>
  <VCard>
    <!-- Header mejorado con contador -->
    <VCardTitle class="d-flex align-center justify-space-between flex-wrap gap-4 pa-5">
      <div>
        <h4 class="text-h4 mb-1">
          {{ $t('ClientModule.title') }}
          <VChip
            v-if="clientStore.totalItems > 0"
            size="small"
            color="primary"
            variant="tonal"
            class="ml-2"
          >
            {{ clientStore.totalItems }}
          </VChip>
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ $t('ClientModule.list_description') }}
        </p>
      </div>

      <!-- Botones de acción principales -->
      <div class="d-flex gap-3">
        <!-- Cache Status Indicator -->
        <ClientCacheStatusIndicator
          :show-detailed-info="true"
          :show-actions="true"
          variant="chip"
        />

        <VMenu>
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              variant="outlined"
              color="secondary"
              :loading="clientStore.loading"
              :disabled="!clientStore.hasItems"
            >
              <VIcon start>
                tabler-download
              </VIcon>
              {{ $t('ClientModule.common.export') }}
            </VBtn>
          </template>

          <VList>
            <VListItem
              v-for="option in menuOptions"
              :key="option.text"
              @click="option.action"
            >
              <template #prepend>
                <VIcon :icon="option.icon" />
              </template>
              <VListItemTitle>{{ option.text }}</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VBtn
          color="primary"
          :to="{ name: 'clients-create' }"
        >
          <VIcon start>
            tabler-plus
          </VIcon>
          {{ $t('ClientModule.actions.add') }}
        </VBtn>
      </div>
    </VCardTitle>

    <VDivider />

    <VCardText>
      <!-- Sección de Filtros Mejorada -->
      <VRow class="mb-3">
        <!-- Búsqueda -->
        <VCol
          cols="12"
          md="4"
        >
          <VTextField
            v-model="clientStore.filters.search"
            :label="$t('ClientModule.search.placeholder')"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @input="applyFilters"
          />
        </VCol>

        <!-- Estado - Múltiple -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VSelect
            v-model="selectedStatuses"
            :label="$t('ClientModule.filters.status')"
            :items="statusOptions"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            hide-details
            @update:model-value="applyFilters"
          >
            <template #chip="{ item, index }">
              <VChip
                size="small"
                closable
                @click:close="selectedStatuses.splice(index, 1); applyFilters()"
              >
                {{ item.title }}
              </VChip>
            </template>
          </VSelect>
        </VCol>

        <!-- Tipo de Negocio - Múltiple -->
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <VSelect
            v-model="selectedBusinessTypes"
            :label="$t('ClientModule.filters.business_type')"
            :items="businessTypeOptions"
            variant="outlined"
            density="compact"
            multiple
            chips
            closable-chips
            hide-details
            @update:model-value="applyFilters"
          >
            <template #chip="{ item, index }">
              <VChip
                size="small"
                closable
                @click:close="selectedBusinessTypes.splice(index, 1); applyFilters()"
              >
                {{ item.title }}
              </VChip>
            </template>
          </VSelect>
        </VCol>

        <!-- Ciudad -->
        <VCol
          cols="12"
          sm="6"
          md="2"
        >
          <VTextField
            v-model="clientStore.filters.city"
            :label="$t('ClientModule.filters.city')"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @input="applyFilters"
          />
        </VCol>
      </VRow>

      <!-- Chips de filtros activos -->
      <VRow v-if="hasActiveFilters">
        <VCol cols="12">
          <VAlert
            color="primary"
            variant="tonal"
            density="compact"
            border="start"
            border-color="primary"
            class="mb-0"
          >
            <div class="d-flex align-center flex-wrap gap-2">
              <span class="text-body-2 font-weight-medium">
                <VIcon
                  size="18"
                  class="me-1"
                >
                  tabler-filter
                </VIcon>
                Filtros activos:
              </span>

              <VChip
                v-for="filter in activeFilters"
                :key="`${filter.type}-${filter.value}`"
                size="small"
                closable
                color="primary"
                @click:close="removeFilter(filter)"
              >
                {{ filter.label }}
              </VChip>

              <VSpacer />

              <VBtn
                size="small"
                variant="text"
                color="error"
                prepend-icon="tabler-x"
                @click="clearFilters"
              >
                Limpiar todo
              </VBtn>
            </div>
          </VAlert>
        </VCol>
      </VRow>

      <!-- Tabla de clientes -->
      <VDataTableServer
        v-model:items-per-page="clientStore.pagination.per_page"
        v-model:page="clientStore.pagination.current_page"
        :headers="headers"
        :items="clientStore.items"
        :items-length="clientStore.totalItems"
        :loading="clientStore.loading"
        class="elevation-1"
        item-value="id"
        @update:options="handleOptionsUpdate"
      >
        <!-- Slot para código de cliente -->
        <template #item.client_code="{ item }">
          <div class="d-flex align-center">
            <VIcon
              size="20"
              class="me-2"
            >
              tabler-id
            </VIcon>
            <span class="font-weight-medium">{{ item.client_code }}</span>
          </div>
        </template>

        <!-- Slot para nombre de empresa -->
        <template #item.business_name="{ item }">
          <div class="d-flex align-center">
            <VAvatar
              size="32"
              color="primary"
              class="me-2"
            >
              <span>{{ item.business_name?.charAt(0) }}</span>
            </VAvatar>
            <div>
              <div class="font-weight-medium">
                {{ item.business_name }}
              </div>
              <div
                v-if="item.trade_name"
                class="text-caption text-disabled"
              >
                {{ item.trade_name }}
              </div>
            </div>
          </div>
        </template>

        <!-- Slot para tipo de negocio -->
        <template #item.business_type="{ item }">
          <VChip
            :color="getBusinessTypeColor(item.business_type)"
            size="small"
            variant="tonal"
          >
            {{ $t(`ClientModule.business_types.${item.business_type}`) }}
          </VChip>
        </template>

        <!-- Slot para estado -->
        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ $t(`ClientModule.status.${item.status}`) }}
          </VChip>
        </template>

        <!-- Slot para acciones -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              icon
              variant="text"
              size="small"
              color="default"
              @click="navigateToView(item)"
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
              @click="navigateToEdit(item)"
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
              @click="deleteClient(item)"
            >
              <VIcon size="22">
                tabler-trash
              </VIcon>
            </VBtn>
          </div>
        </template>

        <!-- Slot para cuando no hay datos -->
        <template #no-data>
          <div class="text-center pa-8">
            <VIcon
              size="64"
              color="grey-lighten-1"
              class="mb-4"
            >
              tabler-users-off
            </VIcon>
            <h6 class="text-h6 mb-2">
              {{ $t('ClientModule.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ $t('ClientModule.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'clients-create' }"
            >
              <VIcon start>
                tabler-plus
              </VIcon>
              {{ $t('ClientModule.actions.add') }}
            </VBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCardText>

    <!-- Diálogo de confirmación de eliminación -->
    <DeleteConfirmationDialog
      :visible="showDeleteDialog"
      :title="$t('ClientModule.delete.title')"
      entity-name="cliente"
      :entity-id="selectedClient?.id"
      :warning-message="$t('ClientModule.delete.message')"
      @close="showDeleteDialog = false"
      @confirm="handleClientDelete"
    />
  </VCard>
</template>

<style scoped>
.filter-field {
  min-inline-size: 200px;
}
</style>
