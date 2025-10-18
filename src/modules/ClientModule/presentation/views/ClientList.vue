<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useClientStore } from '../stores/clientStore'
import type { ClientEntity } from '../../domain/entities/ClientEntity'
import { ClientDomain } from '../../domain/entities/ClientEntity'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const clientStore = useClientStore()

// Estado local para filtros múltiples
const selectedStatuses = ref<string[]>([])
const selectedBusinessTypes = ref<string[]>([])
const selectedPaymentTerms = ref<string[]>([])

// Headers para la tabla
const headers = [
  { title: t('ClientModule.client.fields.client_code'), key: 'client_code' },
  { title: t('ClientModule.client.fields.business_type'), key: 'business_type' },
  { title: t('ClientModule.client.fields.name'), key: 'name' },
  { title: t('ClientModule.client.fields.email'), key: 'email' },
  { title: t('ClientModule.client.fields.phone'), key: 'phone' },
  { title: t('ClientModule.client.fields.city'), key: 'city' },
  { title: t('ClientModule.common.status'), key: 'status' },
  { title: t('ClientModule.common.actions'), key: 'actions', sortable: false },
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
  { value: 'active', title: t('ClientModule.client.status.active'), color: 'success' },
  { value: 'inactive', title: t('ClientModule.client.status.inactive'), color: 'secondary' },
  { value: 'suspended', title: t('ClientModule.client.status.suspended'), color: 'warning' },
  { value: 'blacklisted', title: t('ClientModule.client.status.blacklisted'), color: 'error' },
]

const businessTypeOptions = [
  { value: 'company', title: t('ClientModule.client.business_types.company') },
  { value: 'individual', title: t('ClientModule.client.business_types.individual') },
]

const paymentTermsOptions = [
  { value: 'immediate', title: t('ClientModule.client.payment_terms.immediate') },
  { value: 'net_15', title: t('ClientModule.client.payment_terms.net_15') },
  { value: 'net_30', title: t('ClientModule.client.payment_terms.net_30') },
  { value: 'net_60', title: t('ClientModule.client.payment_terms.net_60') },
  { value: 'net_90', title: t('ClientModule.client.payment_terms.net_90') },
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

  selectedPaymentTerms.value.forEach(terms => {
    const option = paymentTermsOptions.find(o => o.value === terms)
    if (option) {
      filters.push({
        label: option.title,
        value: terms,
        type: 'payment_terms',
      })
    }
  })

  return filters
})

const hasActiveFilters = computed(() => activeFilters.value.length > 0)

// Métodos
const debouncedFetchList = debounce(() => {
  applyFiltersToStore()
}, 500)

function applyFiltersToStore() {
  clientStore.updateFilters({
    status: selectedStatuses.value.length > 0 ? selectedStatuses.value.join(',') : undefined,
    business_type: selectedBusinessTypes.value.length > 0 ? selectedBusinessTypes.value[0] as any : undefined,
    payment_terms: selectedPaymentTerms.value.length > 0 ? selectedPaymentTerms.value[0] as any : undefined,
  })
  clientStore.fetchList()
}

function applyFilters() {
  debouncedFetchList()
}

function clearFilters() {
  selectedStatuses.value = []
  selectedBusinessTypes.value = []
  selectedPaymentTerms.value = []

  clientStore.updateFilters({
    search: '',
    status: undefined,
    business_type: undefined,
    city: undefined,
    payment_terms: undefined,
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
    selectedBusinessTypes.value = selectedBusinessTypes.value.filter(b => b !== filter.value)

  else if (filter.type === 'payment_terms')
    selectedPaymentTerms.value = selectedPaymentTerms.value.filter(t => t !== filter.value)

  applyFiltersToStore()
}

function navigateToView(item: ClientEntity) {
  console.log('navigateToView', item)
  router.push({ name: 'clients-detail', params: { id: item.id } })
}

function navigateToEdit(item: ClientEntity) {
  router.push({ name: 'clients-edit', params: { id: item.id } })
}

async function deleteClient(item: ClientEntity) {
  const displayName = ClientDomain.getDisplayName(item)
  if (confirm(t('ClientModule.client.confirm_delete', { name: displayName }))) {
    try {
      await clientStore.deleteItem(item.id)
    }
    catch (error) {
      console.error('Error deleting client:', error)
    }
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
  return ClientDomain.getStatusColor(status as any)
}

function getBusinessTypeLabel(type: string) {
  return t(`ClientModule.client.business_types.${type}`)
}

function getPaymentTermsLabel(terms: string) {
  return t(`ClientModule.client.payment_terms.${terms}`)
}

function getClientDisplayName(item: ClientEntity) {
  return ClientDomain.getDisplayName(item)
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

// No need for onMounted fetchList - VDataTableServer handles initial load via @update:options
</script>

<template>
  <VCard>
    <!-- Header mejorado con contador -->
    <VCardTitle class="d-flex align-center justify-space-between flex-wrap gap-4 pa-5">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('ClientModule.client.title') }}
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
          {{ t('ClientModule.client.list_description') }}
        </p>
      </div>

      <!-- Botones de acción principales -->
      <div class="d-flex gap-3">
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
              {{ t('ClientModule.common.export') }}
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
          {{ t('ClientModule.client.actions.add') }}
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
            :label="t('ClientModule.client.search_placeholder')"
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
          md="2"
        >
          <VSelect
            v-model="selectedStatuses"
            :label="t('ClientModule.common.status')"
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
          md="2"
        >
          <VSelect
            v-model="selectedBusinessTypes"
            :label="t('ClientModule.client.fields.business_type')"
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

        <!-- Términos de Pago - Múltiple -->
        <VCol
          cols="12"
          sm="6"
          md="2"
        >
          <VSelect
            v-model="selectedPaymentTerms"
            :label="t('ClientModule.client.fields.payment_terms')"
            :items="paymentTermsOptions"
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
                @click:close="selectedPaymentTerms.splice(index, 1); applyFilters()"
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
            :label="t('ClientModule.client.fields.city')"
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

        <!-- Slot para tipo de negocio -->
        <template #item.business_type="{ item }">
          <VChip
            size="small"
            variant="tonal"
            :color="item.business_type === 'company' ? 'info' : 'secondary'"
          >
            {{ getBusinessTypeLabel(item.business_type) }}
          </VChip>
        </template>

        <!-- Slot para nombre -->
        <template #item.name="{ item }">
          <div class="d-flex align-center">
            <VAvatar
              size="32"
              color="primary"
              class="me-2"
            >
              <span>{{ getClientDisplayName(item).charAt(0) }}</span>
            </VAvatar>
            <div>
              <div class="font-weight-medium">
                {{ getClientDisplayName(item) }}
              </div>
              <div
                v-if="item.business_type === 'company' && item.trade_name"
                class="text-caption text-disabled"
              >
                {{ item.trade_name }}
              </div>
            </div>
          </div>
        </template>

        <!-- Slot para email -->
        <template #item.email="{ item }">
          {{ item.primary_email || '-' }}
        </template>

        <!-- Slot para teléfono -->
        <template #item.phone="{ item }">
          {{ item.primary_phone || item.secondary_phone || '-' }}
        </template>

        <!-- Slot para ciudad -->
        <template #item.city="{ item }">
          {{ item.city || '-' }}
        </template>

        <!-- Slot para estatus -->
        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ t(`ClientModule.client.status.${item.status}`) }}
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
              {{ t('ClientModule.client.no_data') }}
            </h6>
            <p class="text-body-2 mb-4">
              {{ t('ClientModule.client.no_data_description') }}
            </p>
            <VBtn
              color="primary"
              :to="{ name: 'clients-create' }"
            >
              <VIcon start>
                tabler-plus
              </VIcon>
              {{ t('ClientModule.client.actions.add') }}
            </VBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCardText>
  </VCard>
</template>

<style scoped>
.filter-field {
  min-inline-size: 200px;
}
</style>
