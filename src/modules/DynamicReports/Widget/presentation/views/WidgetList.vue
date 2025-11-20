<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWidget } from '../composables/useWidget'
import { WidgetTypeEnum } from '../../domain/types'

const router = useRouter()

const {
  items,
  loading,
  error,
  page,
  itemsPerPage,
  total,
  totalPages,
  fetchWidgets,
  deleteWidget,
  cloneWidget,
  setPage,
  setItemsPerPage,
  setFilters,
  clearFilters,
} = useWidget()

const search = ref('')
const selectedType = ref<WidgetTypeEnum | null>(null)
const viewMode = ref<'grid' | 'list'>('grid')

const widgetTypes = Object.values(WidgetTypeEnum).map(type => ({
  value: type,
  title: getWidgetTypeName(type),
}))

const filteredItems = computed(() => {
  let filtered = items.value

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.props.name.toLowerCase().includes(searchLower)
      || item.props.description?.toLowerCase().includes(searchLower),
    )
  }

  if (selectedType.value) {
    filtered = filtered.filter(item => item.props.type === selectedType.value)
  }

  return filtered
})

onMounted(async () => {
  await fetchWidgets()
})

function getWidgetTypeName(type: WidgetTypeEnum): string {
  const names: Record<WidgetTypeEnum, string> = {
    [WidgetTypeEnum.STAT]: 'Estadística',
    [WidgetTypeEnum.CHART_LINE]: 'Gráfico Lineal',
    [WidgetTypeEnum.CHART_BAR]: 'Gráfico de Barras',
    [WidgetTypeEnum.CHART_PIE]: 'Gráfico Circular',
    [WidgetTypeEnum.CHART_DONUT]: 'Gráfico Dona',
    [WidgetTypeEnum.CHART_AREA]: 'Gráfico de Área',
    [WidgetTypeEnum.CHART_SCATTER]: 'Dispersión',
    [WidgetTypeEnum.TABLE]: 'Tabla',
    [WidgetTypeEnum.MAP]: 'Mapa',
    [WidgetTypeEnum.GAUGE]: 'Medidor',
    [WidgetTypeEnum.PROGRESS]: 'Progreso',
    [WidgetTypeEnum.TIMELINE]: 'Línea de Tiempo',
    [WidgetTypeEnum.HEATMAP]: 'Mapa de Calor',
    [WidgetTypeEnum.FUNNEL]: 'Embudo',
    [WidgetTypeEnum.RADAR]: 'Radar',
    [WidgetTypeEnum.SANKEY]: 'Sankey',
    [WidgetTypeEnum.TREEMAP]: 'Treemap',
  }
  return names[type] || type
}

function getWidgetIcon(type: WidgetTypeEnum): string {
  const icons: Record<WidgetTypeEnum, string> = {
    [WidgetTypeEnum.STAT]: 'tabler-chart-bar',
    [WidgetTypeEnum.CHART_LINE]: 'tabler-chart-line',
    [WidgetTypeEnum.CHART_BAR]: 'tabler-chart-bar',
    [WidgetTypeEnum.CHART_PIE]: 'tabler-chart-pie',
    [WidgetTypeEnum.CHART_DONUT]: 'tabler-chart-donut',
    [WidgetTypeEnum.CHART_AREA]: 'tabler-chart-area',
    [WidgetTypeEnum.CHART_SCATTER]: 'tabler-chart-dots',
    [WidgetTypeEnum.TABLE]: 'tabler-table',
    [WidgetTypeEnum.MAP]: 'tabler-map',
    [WidgetTypeEnum.GAUGE]: 'tabler-gauge',
    [WidgetTypeEnum.PROGRESS]: 'tabler-progress',
    [WidgetTypeEnum.TIMELINE]: 'tabler-timeline',
    [WidgetTypeEnum.HEATMAP]: 'tabler-brand-google-analytics',
    [WidgetTypeEnum.FUNNEL]: 'tabler-filter',
    [WidgetTypeEnum.RADAR]: 'tabler-radar',
    [WidgetTypeEnum.SANKEY]: 'tabler-route',
    [WidgetTypeEnum.TREEMAP]: 'tabler-hierarchy',
  }
  return icons[type] || 'tabler-widget'
}

function handleCreate() {
  router.push('/widgets/create')
}

function handleEdit(id: string) {
  router.push(`/widgets/${id}/edit`)
}

async function handleDelete(id: string) {
  if (confirm('¿Estás seguro de eliminar este widget?')) {
    await deleteWidget(id)
    await fetchWidgets()
  }
}

async function handleClone(id: string) {
  const widget = items.value.find(w => w.id.toString() === id)
  if (!widget)
    return

  const newName = prompt('Nombre del nuevo widget:', `${widget.props.name} (Copia)`)
  if (!newName)
    return

  await cloneWidget(id, newName)
  await fetchWidgets()
}

function handlePageChange(newPage: number) {
  setPage(newPage)
  fetchWidgets()
}

function handleItemsPerPageChange(count: number) {
  setItemsPerPage(count)
  fetchWidgets()
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="widget-list">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          Widgets
        </h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Gestiona los widgets disponibles para tus dashboards
        </p>
      </div>

      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        @click="handleCreate"
      >
        Nuevo Widget
      </VBtn>
    </div>

    <!-- Filters & Search -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="search"
          placeholder="Buscar widgets..."
          prepend-inner-icon="tabler-search"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <VSelect
          v-model="selectedType"
          :items="widgetTypes"
          placeholder="Tipo de widget"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </VCol>

      <VCol
        cols="12"
        md="2"
      >
        <VBtnToggle
          v-model="viewMode"
          mandatory
          density="compact"
          class="w-100"
        >
          <VBtn
            value="grid"
            icon="tabler-layout-grid"
          />
          <VBtn
            value="list"
            icon="tabler-list"
          />
        </VBtnToggle>
      </VCol>
    </VRow>

    <!-- Error -->
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      {{ error }}
    </VAlert>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <!-- Grid View -->
    <VRow v-else-if="viewMode === 'grid'">
      <VCol
        v-for="item in filteredItems"
        :key="item.id.toString()"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <VCard class="h-100">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-3">
              <VAvatar
                :color="item.props.color || 'primary'"
                variant="tonal"
                size="48"
              >
                <VIcon
                  :icon="getWidgetIcon(item.props.type)"
                  size="24"
                />
              </VAvatar>

              <VChip
                size="small"
                variant="tonal"
              >
                {{ getWidgetTypeName(item.props.type) }}
              </VChip>
            </div>

            <h3 class="text-h6 mb-2">
              {{ item.props.name }}
            </h3>

            <p class="text-caption text-medium-emphasis mb-4 line-clamp-2">
              {{ item.props.description || 'Sin descripción' }}
            </p>

            <div class="d-flex align-center text-caption text-disabled mb-4">
              <VIcon
                icon="tabler-database"
                size="16"
                class="me-1"
              />
              DataSource
            </div>

            <div class="d-flex align-center text-caption text-disabled mb-4">
              <VIcon
                icon="tabler-clock"
                size="16"
                class="me-1"
              />
              {{ formatDate(item.props.updatedAt) }}
            </div>

            <div class="d-flex gap-2">
              <VBtn
                size="small"
                variant="tonal"
                color="primary"
                block
                @click="handleEdit(item.id.toString())"
              >
                Editar
              </VBtn>
              <VBtn
                size="small"
                variant="outlined"
                icon="tabler-copy"
                @click="handleClone(item.id.toString())"
              />
              <VBtn
                size="small"
                variant="outlined"
                icon="tabler-trash"
                color="error"
                @click="handleDelete(item.id.toString())"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Empty State -->
      <VCol
        v-if="filteredItems.length === 0"
        cols="12"
      >
        <VCard>
          <VCardText class="text-center py-12">
            <VIcon
              icon="tabler-widget"
              size="64"
              color="disabled"
            />
            <p class="text-h6 mt-4">
              No hay widgets
            </p>
            <p class="text-body-2 text-medium-emphasis">
              Crea tu primer widget para comenzar
            </p>
            <VBtn
              color="primary"
              class="mt-4"
              @click="handleCreate"
            >
              Crear Widget
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- List View -->
    <VCard v-else-if="viewMode === 'list'">
      <VDataTable
        :items="filteredItems"
        :loading="loading"
        :headers="[
          { title: 'Tipo', key: 'type' },
          { title: 'Nombre', key: 'props.name' },
          { title: 'Descripción', key: 'props.description' },
          { title: 'Actualizado', key: 'props.updatedAt' },
          { title: 'Acciones', key: 'actions', sortable: false },
        ]"
      >
        <template #item.type="{ item }">
          <div class="d-flex align-center gap-2">
            <VIcon :icon="getWidgetIcon(item.props.type)" />
            <span>{{ getWidgetTypeName(item.props.type) }}</span>
          </div>
        </template>

        <template #item.props.description="{ item }">
          <span class="text-caption">
            {{ item.props.description || '-' }}
          </span>
        </template>

        <template #item.props.updatedAt="{ item }">
          {{ formatDate(item.props.updatedAt) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon="tabler-edit"
              size="small"
              variant="text"
              @click="handleEdit(item.id.toString())"
            />
            <VBtn
              icon="tabler-copy"
              size="small"
              variant="text"
              @click="handleClone(item.id.toString())"
            />
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click="handleDelete(item.id.toString())"
            />
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="d-flex align-center justify-space-between mt-6"
    >
      <div class="d-flex align-center gap-2">
        <span class="text-caption text-disabled">Filas por página:</span>
        <VSelect
          :model-value="itemsPerPage"
          :items="[10, 25, 50, 100]"
          density="compact"
          variant="outlined"
          hide-details
          style="inline-size: 80px"
          @update:model-value="handleItemsPerPageChange"
        />
      </div>

      <div class="text-caption text-disabled">
        {{ (page - 1) * itemsPerPage + 1 }}-{{ Math.min(page * itemsPerPage, total) }} de {{ total }}
      </div>

      <VPagination
        :model-value="page"
        :length="totalPages"
        :total-visible="5"
        density="compact"
        @update:model-value="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.widget-list {
  padding: 24px;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
