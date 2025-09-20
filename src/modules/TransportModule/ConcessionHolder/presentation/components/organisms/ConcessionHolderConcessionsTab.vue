<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { ConcessionHolderEntity } from '../../../domain/entities/ConcessionHolderEntity'
import { useConcessionStore } from '../../../../Concession/presentation/stores/concessionStore'

interface Props {
  holder: ConcessionHolderEntity
}

const props = defineProps<Props>()
const { t } = useI18n()
const router = useRouter()
const concessionStore = useConcessionStore()

// Local state
const loading = computed(() => concessionStore.loading)
const concessions = computed(() => concessionStore.items as any[])
const error = computed(() => concessionStore.error)

// Filters
const statusFilter = ref('ACTIVE')
const modalityFilter = ref('')
const sortBy = ref('valid_to')
const sortOrder = ref('asc')

// Filter options
const statusOptions = [
  { title: 'Todos los estados', value: '' },
  { title: 'Activas', value: 'ACTIVE' },
  { title: 'Suspendidas', value: 'SUSPENDED' },
  { title: 'Vencidas', value: 'EXPIRED' },
  { title: 'Canceladas', value: 'CANCELLED' },
  { title: 'Pendientes', value: 'PENDING' },
]

const modalityOptions = [
  { title: 'Todas las modalidades', value: '' },
  { title: 'Urbana', value: 'URBAN' },
  { title: 'Suburbana', value: 'SUBURBAN' },
  { title: 'Rural', value: 'RURAL' },
  { title: 'Turística', value: 'TOURIST' },
  { title: 'Escolar', value: 'SCHOLAR' },
  { title: 'Obrera', value: 'WORKER' },
  { title: 'Taxi', value: 'TAXI' },
  { title: 'Interurbana', value: 'INTERCITY' },
  { title: 'Fletamento', value: 'CHARTER' },
  { title: 'Shuttle', value: 'SHUTTLE' },
]

// Table headers
const headers = [
  { title: 'Número', key: 'number', sortable: true },
  { title: 'Modalidad', key: 'modalityLabel', sortable: true },
  { title: 'Estado', key: 'statusLabel', sortable: true },
  { title: 'Municipio', key: 'municipality', sortable: true },
  { title: 'Ruta/Sitio', key: 'routeOrSite', sortable: false },
  { title: 'Válida desde', key: 'validFrom', sortable: true },
  { title: 'Válida hasta', key: 'validTo', sortable: true },
  { title: 'Días restantes', key: 'daysUntilExpiration', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Methods
async function loadConcessions() {
  if (!props.holder?.id) return

  const params = {
    per_page: 50,
    sort_by: sortBy.value,
    sort_order: sortOrder.value,
    ...(statusFilter.value && { status: statusFilter.value }),
    ...(modalityFilter.value && { modality: modalityFilter.value }),
  }

  try {
    await concessionStore.fetchByHolderId(props.holder.id, params)
  } catch (err) {
    console.error('Error loading concessions:', err)
  }
}

function onFilterChange() {
  loadConcessions()
}

function onSortChange({ sortBy: newSortBy, sortDesc }: any) {
  sortBy.value = newSortBy
  sortOrder.value = sortDesc ? 'desc' : 'asc'
  loadConcessions()
}

function getStatusColor(status: string) {
  const colors = {
    ACTIVE: 'success',
    SUSPENDED: 'warning',
    EXPIRED: 'error',
    CANCELLED: 'error',
    PENDING: 'info',
  }
  return colors[status as keyof typeof colors] || 'default'
}

function formatDate(dateString: string) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-MX')
}

function getDaysUntilExpirationColor(days: number) {
  if (days < 0) return 'error'
  if (days <= 30) return 'warning'
  return 'success'
}

function viewConcession(concession: any) {
  // Navigate to concession detail page
  router.push({ 
    name: 'concessionsView', 
    params: { id: concession.id } 
  })
}

function editConcession(concession: any) {
  // Navigate to concession edit page
  router.push({ 
    name: 'concessionsEdit', 
    params: { id: concession.id } 
  })
}

onMounted(() => {
  loadConcessions()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <span>
        <VIcon class="me-2">tabler-license</VIcon>
        Concesiones del Titular
      </span>
    </VCardTitle>
    <VCardText>
      <!-- Filters -->
      <VRow class="mb-4">
        <VCol cols="12" md="3">
          <VSelect
            v-model="statusFilter"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            label="Filtrar por estado"
            variant="outlined"
            density="compact"
            @update:model-value="onFilterChange"
          />
        </VCol>
        <VCol cols="12" md="3">
          <VSelect
            v-model="modalityFilter"
            :items="modalityOptions"
            item-title="title"
            item-value="value"
            label="Filtrar por modalidad"
            variant="outlined"
            density="compact"
            @update:model-value="onFilterChange"
          />
        </VCol>
        <VCol cols="12" md="6" class="d-flex align-center">
          <VSpacer />
          <VChip
            v-if="concessions.length > 0"
            color="primary"
            variant="tonal"
          >
            {{ concessions.length }} concesión(es) encontrada(s)
          </VChip>
        </VCol>
      </VRow>

      <!-- Error Alert -->
      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        <VIcon start>
          tabler-alert-circle
        </VIcon>
        {{ error }}
      </VAlert>

      <!-- Loading State -->
      <div
        v-if="loading"
        class="text-center py-8"
      >
        <VProgressCircular
          indeterminate
          color="primary"
          size="48"
        />
        <p class="mt-2 text-medium-emphasis">
          Cargando concesiones...
        </p>
      </div>

      <!-- Data Table -->
      <VDataTable
        v-else
        :headers="headers"
        :items="concessions"
        :loading="loading"
        no-data-text="No hay concesiones registradas para este titular"
        @update:sort-by="onSortChange"
      >
        <!-- Status Column -->
        <template #[`item.statusLabel`]="{ item }">
          <VChip
            :color="getStatusColor(item.status || '')"
            size="small"
            variant="tonal"
          >
            {{ item.statusLabel || item.status || '-' }}
          </VChip>
        </template>

        <!-- Valid From Column -->
        <template #[`item.validFrom`]="{ item }">
          {{ formatDate(item.validFrom) }}
        </template>

        <!-- Valid To Column -->
        <template #[`item.validTo`]="{ item }">
          {{ formatDate(item.validTo) }}
        </template>

        <!-- Days Until Expiration Column -->
        <template #[`item.daysUntilExpiration`]="{ item }">
          <VChip
            v-if="item.daysUntilExpiration !== undefined"
            :color="getDaysUntilExpirationColor(item.daysUntilExpiration)"
            size="small"
            variant="tonal"
          >
            {{ item.daysUntilExpiration }} días
          </VChip>
          <span v-else>-</span>
        </template>

        <!-- Actions Column -->
        <template #[`item.actions`]="{ item }">
          <VBtn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="viewConcession(item)"
          >
            <VIcon>tabler-eye</VIcon>
            <VTooltip activator="parent">
              Ver detalles
            </VTooltip>
          </VBtn>
          <VBtn
            icon
            variant="text"
            size="small"
            color="secondary"
            @click="editConcession(item)"
          >
            <VIcon>tabler-edit</VIcon>
            <VTooltip activator="parent">
              Editar
            </VTooltip>
          </VBtn>
        </template>
      </VDataTable>
    </VCardText>
  </VCard>
</template>
