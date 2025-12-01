<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboard } from '../composables/useDashboard'
import { useDashboardLayout } from '../composables/useDashboardLayout'
import { useDashboardTheme } from '../composables/useDashboardTheme'
import { useWidget } from '../../../Widget/presentation/composables/useWidget'
import { WidgetTypeEnum } from '../../../Widget/domain/enums/WidgetTypeEnum'
import type { WidgetInstanceConfig } from '../../../Widget/domain/types/WidgetTypes'

const route = useRoute()
const router = useRouter()

const {
  currentItem: dashboard,
  loading,
  error,
  fetchDashboard,
  createDashboard,
  updateDashboard,
  addWidget: addWidgetToDashboard,
  removeWidget: removeWidgetFromDashboard,
  updateWidgetsLayout,
} = useDashboard()

const {
  items: availableWidgets,
  fetchAllWidgets,
} = useWidget()

const {
  gridItems,
  selectedWidget,
  hasChanges,
  addWidget,
  removeWidget,
  updateWidgetPosition,
  selectWidget,
  getLayout,
  resetChanges,
  columns,
  rowHeight,
  margin,
} = useDashboardLayout([], {
  columns: 12,
  rowHeight: 60,
  margin: 10,
  isDraggable: true,
  isResizable: true,
})

const {
  theme,
  isDark,
  toggleMode,
  setPrimaryColor,
  applyTheme,
} = useDashboardTheme()

// UI State
const showWidgetDialog = ref(false)
const showSettingsDialog = ref(false)
const showThemeDialog = ref(false)
const isSaving = ref(false)

// Form
const dashboardName = ref('')
const dashboardDescription = ref('')
const dashboardSlug = ref('')
const isPublic = ref(false)

// Widget selection
const selectedWidgetType = ref<WidgetTypeEnum | null>(null)
const selectedWidgetId = ref<string | null>(null)

const isEditMode = computed(() => !!route.params.id && route.params.id !== 'new')

const widgetTypes = computed(() => {
  return Object.values(WidgetTypeEnum).map((type) => {
    const metadata = getWidgetTypeMetadata(type)
    return {
      value: type,
      title: metadata.name,
      icon: metadata.icon,
      category: metadata.category,
    }
  })
})

onMounted(async () => {
  await fetchAllWidgets()

  if (isEditMode.value) {
    await fetchDashboard(route.params.id as string)

    if (dashboard.value) {
      dashboardName.value = dashboard.value.props.name
      dashboardDescription.value = dashboard.value.props.description || ''
      dashboardSlug.value = dashboard.value.props.slug
      isPublic.value = dashboard.value.props.isPublic

      // Inicializar widgets
      if (dashboard.value.props.widgets) {
        gridItems.value = dashboard.value.props.widgets.map(w => ({
          id: w.id,
          widgetId: w.widget_id,
          position: w.position,
          config: w,
        }))
      }

      // Aplicar tema
      if (dashboard.value.props.theme) {
        theme.value = dashboard.value.props.theme
        applyTheme()
      }
    }
  }
})

function getWidgetTypeMetadata(type: WidgetTypeEnum) {
  const metadata = {
    [WidgetTypeEnum.STAT]: { name: 'Estadística', icon: 'tabler-chart-bar', category: 'Básicos' },
    [WidgetTypeEnum.CHART_LINE]: { name: 'Gráfico Lineal', icon: 'tabler-chart-line', category: 'Gráficos' },
    [WidgetTypeEnum.CHART_BAR]: { name: 'Gráfico de Barras', icon: 'tabler-chart-bar', category: 'Gráficos' },
    [WidgetTypeEnum.CHART_PIE]: { name: 'Gráfico Circular', icon: 'tabler-chart-pie', category: 'Gráficos' },
    [WidgetTypeEnum.CHART_DONUT]: { name: 'Gráfico Dona', icon: 'tabler-chart-donut', category: 'Gráficos' },
    [WidgetTypeEnum.CHART_AREA]: { name: 'Gráfico de Área', icon: 'tabler-chart-area', category: 'Gráficos' },
    [WidgetTypeEnum.TABLE]: { name: 'Tabla', icon: 'tabler-table', category: 'Datos' },
    [WidgetTypeEnum.MAP]: { name: 'Mapa', icon: 'tabler-map', category: 'Visualización' },
    [WidgetTypeEnum.GAUGE]: { name: 'Medidor', icon: 'tabler-gauge', category: 'Básicos' },
    [WidgetTypeEnum.PROGRESS]: { name: 'Progreso', icon: 'tabler-progress', category: 'Básicos' },
    [WidgetTypeEnum.TIMELINE]: { name: 'Línea de Tiempo', icon: 'tabler-timeline', category: 'Visualización' },
    [WidgetTypeEnum.HEATMAP]: { name: 'Mapa de Calor', icon: 'tabler-brand-google-analytics', category: 'Gráficos' },
    [WidgetTypeEnum.FUNNEL]: { name: 'Embudo', icon: 'tabler-filter', category: 'Gráficos' },
    [WidgetTypeEnum.RADAR]: { name: 'Radar', icon: 'tabler-radar', category: 'Gráficos' },
    [WidgetTypeEnum.SANKEY]: { name: 'Sankey', icon: 'tabler-route', category: 'Gráficos' },
    [WidgetTypeEnum.TREEMAP]: { name: 'Treemap', icon: 'tabler-hierarchy', category: 'Gráficos' },
  }

  return metadata[type] || { name: type, icon: 'tabler-widget', category: 'Otros' }
}

function handleAddWidgetFromLibrary() {
  showWidgetDialog.value = true
}

async function handleAddWidget() {
  if (!selectedWidgetId.value)
    return

  const widget = availableWidgets.value.find(w => w.id.toString() === selectedWidgetId.value)
  if (!widget)
    return

  const widgetConfig: WidgetInstanceConfig = {
    id: `widget-${Date.now()}`,
    widget_id: widget.id.toString(),
    dashboard_id: dashboard.value?.id.toString() || '',
    title: widget.props.name,
    description: widget.props.description,
    position: {
      x: 0,
      y: 0,
      w: 4,
      h: 3,
    },
    config: {},
    order: gridItems.value.length,
    widget,
  }

  addWidget(widgetConfig)
  showWidgetDialog.value = false
  selectedWidgetId.value = null
}

function handleRemoveWidget(widgetInstanceId: string) {
  if (confirm('¿Estás seguro de eliminar este widget?')) {
    removeWidget(widgetInstanceId)
  }
}

function handleWidgetClick(widgetInstanceId: string) {
  selectWidget(widgetInstanceId)
}

async function handleSave() {
  isSaving.value = true

  try {
    const layoutData = getLayout()

    if (isEditMode.value && dashboard.value) {
      // Update existing dashboard
      await updateDashboard(dashboard.value.id.toString(), {
        name: dashboardName.value,
        description: dashboardDescription.value,
        slug: dashboardSlug.value,
        isPublic: isPublic.value,
        theme: theme.value,
      })

      // Update widgets layout
      await updateWidgetsLayout(
        dashboard.value.id.toString(),
        layoutData,
      )
    }
    else {
      // Create new dashboard
      const result = await createDashboard({
        name: dashboardName.value,
        description: dashboardDescription.value,
        slug: dashboardSlug.value,
        isPublic: isPublic.value,
        theme: theme.value,
        layout: {
          columns: 12,
          rowHeight: 60,
          margin: 10,
        },
      })

      if (result) {
        router.push(`/dashboards/builder/${result.id}`)
      }
    }

    resetChanges()
  }
  catch (err) {
    console.error('Error saving dashboard:', err)
  }
  finally {
    isSaving.value = false
  }
}

function handleCancel() {
  if (hasChanges.value) {
    if (!confirm('Hay cambios sin guardar. ¿Estás seguro de salir?'))
      return
  }

  router.push('/dashboards')
}

function handlePreview() {
  if (dashboard.value) {
    const url = router.resolve(`/dashboards/${dashboard.value.id.toString()}`).href
    window.open(url, '_blank')
  }
}
</script>

<template>
  <div class="dashboard-builder">
    <!-- Toolbar -->
    <VAppBar
      color="surface"
      elevation="1"
    >
      <VBtn
        icon="tabler-arrow-left"
        variant="text"
        @click="handleCancel"
      />

      <VToolbarTitle>
        {{ isEditMode ? 'Editar Dashboard' : 'Nuevo Dashboard' }}
      </VToolbarTitle>

      <VSpacer />

      <VBtn
        v-if="isEditMode"
        variant="text"
        prepend-icon="tabler-eye"
        @click="handlePreview"
      >
        Vista previa
      </VBtn>

      <VBtn
        variant="text"
        prepend-icon="tabler-settings"
        @click="showSettingsDialog = true"
      >
        Configuración
      </VBtn>

      <VBtn
        variant="text"
        prepend-icon="tabler-palette"
        @click="showThemeDialog = true"
      >
        Tema
      </VBtn>

      <VBtn
        color="primary"
        prepend-icon="tabler-device-floppy"
        :loading="isSaving"
        :disabled="!hasChanges && !dashboardName"
        @click="handleSave"
      >
        Guardar
      </VBtn>
    </VAppBar>

    <!-- Main Content -->
    <div class="builder-content">
      <!-- Sidebar -->
      <div class="builder-sidebar">
        <VCard>
          <VCardText>
            <h3 class="text-h6 mb-4">
              Widgets
            </h3>

            <VBtn
              block
              color="primary"
              prepend-icon="tabler-plus"
              class="mb-4"
              @click="handleAddWidgetFromLibrary"
            >
              Agregar Widget
            </VBtn>

            <VDivider class="my-4" />

            <h4 class="text-subtitle-2 mb-2">
              Widgets en Dashboard
            </h4>

            <VList
              density="compact"
              class="widget-list"
            >
              <VListItem
                v-for="item in gridItems"
                :key="item.id"
                :active="selectedWidget === item.id"
                @click="handleWidgetClick(item.id)"
              >
                <template #prepend>
                  <VIcon :icon="item.config.widget?.props.icon || 'tabler-widget'" />
                </template>

                <VListItemTitle>{{ item.config.title }}</VListItemTitle>

                <template #append>
                  <VBtn
                    icon="tabler-trash"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click.stop="handleRemoveWidget(item.id)"
                  />
                </template>
              </VListItem>

              <VListItem v-if="gridItems.length === 0">
                <VListItemTitle class="text-center text-disabled">
                  No hay widgets
                </VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </div>

      <!-- Canvas -->
      <div class="builder-canvas">
        <div
          class="dashboard-grid"
          :style="{
            'grid-template-columns': `repeat(${columns}, 1fr)`,
            'gap': `${margin}px`,
          }"
        >
          <div
            v-for="item in gridItems"
            :key="item.id"
            class="grid-item"
            :class="{ 'grid-item--selected': selectedWidget === item.id }"
            :style="{
              'grid-column': `${item.position.x + 1} / span ${item.position.w}`,
              'grid-row': `${item.position.y + 1} / span ${item.position.h}`,
            }"
            @click="handleWidgetClick(item.id)"
          >
            <VCard class="h-100">
              <VCardText>
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center">
                    <VIcon
                      :icon="item.config.widget?.props.icon || 'tabler-widget'"
                      class="me-2"
                    />
                    <span class="text-sm font-weight-medium">
                      {{ item.config.title }}
                    </span>
                  </div>

                  <VBtn
                    icon="tabler-trash"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click.stop="handleRemoveWidget(item.id)"
                  />
                </div>

                <p class="text-caption text-disabled">
                  {{ item.config.description || 'Sin descripción' }}
                </p>

                <div class="text-caption text-disabled mt-2">
                  Posición: {{ item.position.x }},{{ item.position.y }} | Tamaño: {{ item.position.w }}x{{ item.position.h }}
                </div>
              </VCardText>
            </VCard>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="gridItems.length === 0"
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
            Agrega widgets para comenzar a construir tu dashboard
          </p>
          <VBtn
            color="primary"
            class="mt-4"
            @click="handleAddWidgetFromLibrary"
          >
            Agregar Widget
          </VBtn>
        </div>
      </div>
    </div>

    <!-- Widget Dialog -->
    <VDialog
      v-model="showWidgetDialog"
      max-width="600"
    >
      <VCard>
        <VCardTitle>Agregar Widget</VCardTitle>

        <VCardText>
          <VSelect
            v-model="selectedWidgetId"
            :items="availableWidgets.map(w => ({ value: w.id.toString(), title: w.props.name }))"
            label="Selecciona un widget"
            variant="outlined"
            prepend-inner-icon="tabler-widget"
          />
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showWidgetDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            :disabled="!selectedWidgetId"
            @click="handleAddWidget"
          >
            Agregar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Settings Dialog -->
    <VDialog
      v-model="showSettingsDialog"
      max-width="600"
    >
      <VCard>
        <VCardTitle>Configuración del Dashboard</VCardTitle>

        <VCardText>
          <VTextField
            v-model="dashboardName"
            label="Nombre"
            variant="outlined"
            class="mb-4"
          />

          <VTextarea
            v-model="dashboardDescription"
            label="Descripción"
            variant="outlined"
            rows="3"
            class="mb-4"
          />

          <VTextField
            v-model="dashboardSlug"
            label="Slug"
            variant="outlined"
            class="mb-4"
          />

          <VSwitch
            v-model="isPublic"
            label="Dashboard público"
            color="primary"
          />
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showSettingsDialog = false"
          >
            Cerrar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Theme Dialog -->
    <VDialog
      v-model="showThemeDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle>Tema del Dashboard</VCardTitle>

        <VCardText>
          <div class="d-flex align-center justify-space-between mb-4">
            <span>Modo oscuro</span>
            <VSwitch
              :model-value="isDark"
              color="primary"
              hide-details
              @update:model-value="toggleMode"
            />
          </div>

          <VColorPicker
            v-model="theme.primaryColor"
            label="Color primario"
            mode="hexa"
            class="mb-4"
            @update:model-value="setPrimaryColor"
          />
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showThemeDialog = false"
          >
            Cerrar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
.dashboard-builder {
  display: flex;
  flex-direction: column;
  block-size: 100vh;
  overflow: hidden;
}

.builder-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.builder-sidebar {
  inline-size: 300px;
  border-inline-end: 1px solid rgb(var(--v-theme-border));
  overflow-y: auto;
  padding: 16px;
}

.builder-canvas {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background-color: rgb(var(--v-theme-background));
}

.dashboard-grid {
  display: grid;
  grid-auto-rows: 60px;
  min-block-size: calc(100vh - 120px);
}

.grid-item {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &--selected {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-block-size: 400px;
  text-align: center;
}

.widget-list {
  max-block-size: calc(100vh - 300px);
  overflow-y: auto;
}
</style>
