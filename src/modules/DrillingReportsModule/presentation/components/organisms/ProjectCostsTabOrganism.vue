<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDate } from '../../../shared/utils/dateUtils'

export interface ProjectCostsTabProps {
  costs: any[]
  budget: number
  currency?: string
  loading?: boolean
}

const props = withDefaults(defineProps<ProjectCostsTabProps>(), {
  currency: 'USD',
  loading: false,
})

defineEmits<{
  'create': []
  'edit': [cost: any]
  'delete': [cost: any]
}>()

const filters = ref({
  search: '',
  category: null as string | null,
  dateFrom: '',
  dateTo: '',
})

const headers = [
  { title: 'Fecha', key: 'date', sortable: true },
  { title: 'Categoría', key: 'category', sortable: true },
  { title: 'Descripción', key: 'description', sortable: true },
  { title: 'Cantidad', key: 'quantity', sortable: true },
  { title: 'Monto', key: 'amount', sortable: true, align: 'end' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' },
]

const categoryOptions = [
  { title: 'Personal', value: 'labor' },
  { title: 'Materiales', value: 'materials' },
  { title: 'Equipo', value: 'equipment' },
  { title: 'Transporte', value: 'transport' },
  { title: 'Servicios', value: 'services' },
  { title: 'Otros', value: 'other' },
]

const totalCosts = computed(() => props.costs.length)

const totalSpent = computed(() => {
  return props.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0)
})

const remaining = computed(() => props.budget - totalSpent.value)

const utilizationPercentage = computed(() => {
  if (props.budget === 0)
    return 0

  return Math.min(Math.round((totalSpent.value / props.budget) * 100), 100)
})

const utilizationColor = computed(() => {
  const percentage = utilizationPercentage.value
  if (percentage >= 100)
    return 'error'
  if (percentage >= 90)
    return 'warning'
  if (percentage >= 75)
    return 'info'

  return 'success'
})

const remainingColor = computed(() => {
  if (remaining.value < 0)
    return 'error'
  if (utilizationPercentage.value >= 90)
    return 'warning'

  return 'success'
})

const filteredCosts = computed(() => {
  let result = [...props.costs]

  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()

    result = result.filter(c =>
      c.description?.toLowerCase().includes(searchLower)
      || c.category?.toLowerCase().includes(searchLower),
    )
  }

  if (filters.value.category)
    result = result.filter(c => c.category === filters.value.category)

  if (filters.value.dateFrom)
    result = result.filter(c => c.date >= filters.value.dateFrom)

  if (filters.value.dateTo)
    result = result.filter(c => c.date <= filters.value.dateTo)

  return result
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currency,
  }).format(amount)
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    labor: 'primary',
    materials: 'success',
    equipment: 'warning',
    transport: 'info',
    services: 'secondary',
    other: 'grey',
  }

  return colors[category] || 'grey'
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    labor: 'Personal',
    materials: 'Materiales',
    equipment: 'Equipo',
    transport: 'Transporte',
    services: 'Servicios',
    other: 'Otros',
  }

  return labels[category] || category
}
</script>

<template>
  <div class="project-costs-tab pa-6">
    <!-- Header with Actions -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h6 class="text-h6 mb-1">
          Gestión de Costos
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ totalCosts }} {{ totalCosts === 1 ? 'registro' : 'registros' }} de costos
        </p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        @click="$emit('create')"
      >
        Agregar Costo
      </VBtn>
    </div>

    <!-- Summary Cards -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Total Gastado
                </p>
                <h5 class="text-h5">
                  {{ formatCurrency(totalSpent) }}
                </h5>
              </div>
              <VAvatar
                color="error"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-currency-dollar"
                  size="24"
                />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Presupuesto Total
                </p>
                <h5 class="text-h5">
                  {{ formatCurrency(budget) }}
                </h5>
              </div>
              <VAvatar
                color="primary"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-wallet"
                  size="24"
                />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  Restante
                </p>
                <h5 class="text-h5">
                  {{ formatCurrency(remaining) }}
                </h5>
              </div>
              <VAvatar
                :color="remainingColor"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-pig-money"
                  size="24"
                />
              </VAvatar>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  % Utilizado
                </p>
                <h5 class="text-h5">
                  {{ utilizationPercentage }}%
                </h5>
              </div>
              <VAvatar
                :color="utilizationColor"
                variant="tonal"
                size="48"
              >
                <VIcon
                  icon="tabler-percentage"
                  size="24"
                />
              </VAvatar>
            </div>
            <VProgressLinear
              :model-value="utilizationPercentage"
              :color="utilizationColor"
              height="4"
              class="mt-2"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Filters -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="filters.search"
              label="Buscar"
              prepend-inner-icon="tabler-search"
              clearable
              density="compact"
              hide-details
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.category"
              label="Categoría"
              :items="categoryOptions"
              clearable
              density="compact"
              hide-details
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="filters.dateFrom"
              label="Desde"
              type="date"
              clearable
              density="compact"
              hide-details
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="filters.dateTo"
              label="Hasta"
              type="date"
              clearable
              density="compact"
              hide-details
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Costs Data Table -->
    <VDataTable
      :headers="headers"
      :items="filteredCosts"
      :loading="loading"
      :items-per-page="15"
      class="elevation-1"
    >
      <!-- Date -->
      <template #item.date="{ item }">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-calendar"
            size="18"
          />
          {{ formatDate(item.date) }}
        </div>
      </template>

      <!-- Category -->
      <template #item.category="{ item }">
        <VChip
          :color="getCategoryColor(item.category)"
          size="small"
          variant="tonal"
        >
          {{ getCategoryLabel(item.category) }}
        </VChip>
      </template>

      <!-- Amount -->
      <template #item.amount="{ item }">
        <span class="font-weight-medium">{{ formatCurrency(item.amount) }}</span>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex gap-1">
          <VTooltip text="Editar">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon="tabler-edit"
                variant="text"
                size="small"
                @click="$emit('edit', item)"
              />
            </template>
          </VTooltip>
          <VTooltip text="Eliminar">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon="tabler-trash"
                variant="text"
                size="small"
                color="error"
                @click="$emit('delete', item)"
              />
            </template>
          </VTooltip>
        </div>
      </template>

      <!-- Empty State -->
      <template #no-data>
        <div class="text-center pa-12">
          <VIcon
            icon="tabler-coin-off"
            size="64"
            class="text-medium-emphasis mb-4"
          />
          <h5 class="text-h5 mb-2">
            No hay costos registrados
          </h5>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Aún no se han registrado costos para este proyecto
          </p>
          <VBtn
            color="primary"
            prepend-icon="tabler-plus"
            @click="$emit('create')"
          >
            Agregar Primer Costo
          </VBtn>
        </div>
      </template>
    </VDataTable>
  </div>
</template>

<style scoped lang="scss">
.project-costs-tab {
  min-block-size: 400px;
}
</style>
