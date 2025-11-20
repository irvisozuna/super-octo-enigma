<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboard } from '../composables/useDashboard'
import { useDashboardTheme } from '../composables/useDashboardTheme'
import { StatWidget, ChartWidget, TableWidget, MapWidget } from '../../Widget/presentation/components'
import { WidgetTypeEnum } from '../../Widget/domain/types/WidgetTypeEnum'

const route = useRoute()
const router = useRouter()

const {
  currentItem: dashboard,
  loading,
  error,
  fetchDashboard,
  fetchDashboardBySlug,
  toggleFavorite,
  refreshAllWidgets,
  exportDashboard,
} = useDashboard()

const {
  theme,
  applyTheme,
  removeTheme,
} = useDashboardTheme()

const isRefreshing = ref(false)
const showExportDialog = ref(false)
const exportFormat = ref<'pdf' | 'png' | 'jpg' | 'json'>('pdf')
const isFullscreen = ref(false)

const widgetComponents = {
  [WidgetTypeEnum.STAT]: StatWidget,
  [WidgetTypeEnum.CHART_LINE]: ChartWidget,
  [WidgetTypeEnum.CHART_BAR]: ChartWidget,
  [WidgetTypeEnum.CHART_PIE]: ChartWidget,
  [WidgetTypeEnum.CHART_DONUT]: ChartWidget,
  [WidgetTypeEnum.CHART_AREA]: ChartWidget,
  [WidgetTypeEnum.CHART_SCATTER]: ChartWidget,
  [WidgetTypeEnum.TABLE]: TableWidget,
  [WidgetTypeEnum.MAP]: MapWidget,
}

const gridColumns = computed(() => dashboard.value?.props.layout?.columns || 12)
const rowHeight = computed(() => dashboard.value?.props.layout?.rowHeight || 60)
const margin = computed(() => dashboard.value?.props.layout?.margin || 10)

const sortedWidgets = computed(() => {
  if (!dashboard.value?.props.widgets)
    return []

  return [...dashboard.value.props.widgets].sort((a, b) => a.order - b.order)
})

onMounted(async () => {
  const id = route.params.id as string

  if (id.includes('-')) {
    // It's a UUID
    await fetchDashboard(id)
  }
  else {
    // It's a slug
    await fetchDashboardBySlug(id)
  }

  if (dashboard.value?.props.theme) {
    theme.value = dashboard.value.props.theme
    applyTheme()
  }
})

onUnmounted(() => {
  removeTheme()
})

function getWidgetComponent(type: WidgetTypeEnum) {
  return widgetComponents[type] || null
}

async function handleRefreshAll() {
  if (!dashboard.value)
    return

  isRefreshing.value = true
  try {
    await refreshAllWidgets(dashboard.value.id.toString())
  }
  finally {
    isRefreshing.value = false
  }
}

async function handleToggleFavorite() {
  if (!dashboard.value)
    return

  await toggleFavorite(dashboard.value.id.toString())
}

function handleEdit() {
  if (!dashboard.value)
    return

  router.push(`/dashboards/builder/${dashboard.value.id.toString()}`)
}

async function handleExport() {
  if (!dashboard.value)
    return

  try {
    await exportDashboard(dashboard.value.id.toString(), exportFormat.value)
    showExportDialog.value = false
  }
  catch (err) {
    console.error('Error exporting dashboard:', err)
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  }
  else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }
}

// Listen for fullscreen changes
onMounted(() => {
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})
</script>

<template>
  <div class="dashboard-viewer">
    <!-- Header -->
    <VAppBar
      v-if="!isFullscreen"
      color="surface"
      elevation="1"
    >
      <VBtn
        icon="tabler-arrow-left"
        variant="text"
        @click="router.push('/dashboards')"
      />

      <VToolbarTitle v-if="dashboard">
        <div>
          <div class="text-h6">
            {{ dashboard.props.name }}
          </div>
          <div
            v-if="dashboard.props.description"
            class="text-caption text-disabled"
          >
            {{ dashboard.props.description }}
          </div>
        </div>
      </VToolbarTitle>

      <VSpacer />

      <VBtn
        v-if="dashboard"
        :icon="dashboard.props.isFavorite ? 'tabler-star-filled' : 'tabler-star'"
        :color="dashboard.props.isFavorite ? 'warning' : 'default'"
        variant="text"
        @click="handleToggleFavorite"
      >
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ dashboard.props.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos' }}
        </VTooltip>
      </VBtn>

      <VBtn
        icon="tabler-refresh"
        variant="text"
        :loading="isRefreshing"
        @click="handleRefreshAll"
      >
        <VTooltip
          activator="parent"
          location="bottom"
        >
          Refrescar todos los widgets
        </VTooltip>
      </VBtn>

      <VBtn
        icon="tabler-edit"
        variant="text"
        @click="handleEdit"
      >
        <VTooltip
          activator="parent"
          location="bottom"
        >
          Editar dashboard
        </VTooltip>
      </VBtn>

      <VBtn
        icon="tabler-download"
        variant="text"
        @click="showExportDialog = true"
      >
        <VTooltip
          activator="parent"
          location="bottom"
        >
          Exportar dashboard
        </VTooltip>
      </VBtn>

      <VBtn
        :icon="isFullscreen ? 'tabler-minimize' : 'tabler-maximize'"
        variant="text"
        @click="toggleFullscreen"
      >
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa' }}
        </VTooltip>
      </VBtn>
    </VAppBar>

    <!-- Loading -->
    <div
      v-if="loading"
      class="d-flex align-center justify-center"
      style="min-height: 400px"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
    </div>

    <!-- Error -->
    <VAlert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="ma-4"
    >
      {{ error }}
    </VAlert>

    <!-- Dashboard Content -->
    <div
      v-else-if="dashboard"
      class="dashboard-content"
      :class="{ 'dashboard-content--fullscreen': isFullscreen }"
    >
      <div
        class="dashboard-grid"
        :style="{
          'grid-template-columns': `repeat(${gridColumns}, 1fr)`,
          'grid-auto-rows': `${rowHeight}px`,
          'gap': `${margin}px`,
          'padding': `${margin * 2}px`,
        }"
      >
        <div
          v-for="widget in sortedWidgets"
          :key="widget.id"
          class="widget-wrapper"
          :style="{
            'grid-column': `${widget.position.x + 1} / span ${widget.position.w}`,
            'grid-row': `${widget.position.y + 1} / span ${widget.position.h}`,
          }"
        >
          <component
            :is="getWidgetComponent(widget.widget?.props.type)"
            v-if="getWidgetComponent(widget.widget?.props.type)"
            :widget="widget"
            :auto-refresh="true"
            :refresh-interval="60"
          />

          <VCard
            v-else
            class="h-100"
          >
            <VCardText class="d-flex align-center justify-center h-100">
              <div class="text-center">
                <VIcon
                  icon="tabler-widget"
                  size="48"
                  color="disabled"
                />
                <p class="text-body-2 text-disabled mt-4">
                  Widget no soportado: {{ widget.widget?.props.type }}
                </p>
              </div>
            </VCardText>
          </VCard>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="sortedWidgets.length === 0"
        class="empty-state"
      >
        <VIcon
          icon="tabler-layout-dashboard"
          size="64"
          color="disabled"
        />
        <p class="text-h6 mt-4">
          Dashboard vacío
        </p>
        <p class="text-body-2 text-disabled">
          Este dashboard no tiene widgets configurados
        </p>
        <VBtn
          color="primary"
          class="mt-4"
          @click="handleEdit"
        >
          Editar Dashboard
        </VBtn>
      </div>
    </div>

    <!-- Export Dialog -->
    <VDialog
      v-model="showExportDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle>Exportar Dashboard</VCardTitle>

        <VCardText>
          <VSelect
            v-model="exportFormat"
            :items="[
              { value: 'pdf', title: 'PDF' },
              { value: 'png', title: 'PNG' },
              { value: 'jpg', title: 'JPG' },
              { value: 'json', title: 'JSON' },
            ]"
            label="Formato"
            variant="outlined"
          />
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showExportDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            @click="handleExport"
          >
            Exportar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
.dashboard-viewer {
  min-block-size: 100vh;
  background-color: rgb(var(--v-theme-background));
}

.dashboard-content {
  min-block-size: calc(100vh - 64px);

  &--fullscreen {
    min-block-size: 100vh;
  }
}

.dashboard-grid {
  display: grid;
  inline-size: 100%;
}

.widget-wrapper {
  min-block-size: 0;
  min-inline-size: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-block-size: 400px;
  text-align: center;
}
</style>
