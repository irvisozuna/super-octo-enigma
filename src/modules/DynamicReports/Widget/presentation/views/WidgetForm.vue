<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWidget } from '../composables/useWidget'
import { WidgetTypeEnum } from '../../domain/types'
import type { WidgetCreateDto } from '../../application/dtos/WidgetDtos'

const route = useRoute()
const router = useRouter()

const {
  currentItem,
  loading,
  error,
  fetchWidget,
  createWidget,
  createWidgetFromType,
  updateWidget,
} = useWidget()

// Form state
const form = ref({
  name: '',
  description: '',
  type: WidgetTypeEnum.STAT as WidgetTypeEnum,
  dataSourceId: '',
  icon: '',
  color: '',
  cache: {
    enabled: false,
    ttl: 3600,
  },
  queryConfig: {
    limit: 100,
    offset: 0,
  },
  displayConfig: {} as any,
})

const isSaving = ref(false)
const currentStep = ref(1)

const isEditMode = computed(() => !!route.params.id)

const widgetTypes = [
  { value: WidgetTypeEnum.STAT, title: 'Estadística', icon: 'tabler-chart-bar', category: 'Básicos' },
  { value: WidgetTypeEnum.CHART_LINE, title: 'Gráfico Lineal', icon: 'tabler-chart-line', category: 'Gráficos' },
  { value: WidgetTypeEnum.CHART_BAR, title: 'Gráfico de Barras', icon: 'tabler-chart-bar', category: 'Gráficos' },
  { value: WidgetTypeEnum.CHART_PIE, title: 'Gráfico Circular', icon: 'tabler-chart-pie', category: 'Gráficos' },
  { value: WidgetTypeEnum.CHART_DONUT, title: 'Gráfico Dona', icon: 'tabler-chart-donut', category: 'Gráficos' },
  { value: WidgetTypeEnum.CHART_AREA, title: 'Gráfico de Área', icon: 'tabler-chart-area', category: 'Gráficos' },
  { value: WidgetTypeEnum.TABLE, title: 'Tabla', icon: 'tabler-table', category: 'Datos' },
  { value: WidgetTypeEnum.MAP, title: 'Mapa', icon: 'tabler-map', category: 'Visualización' },
  { value: WidgetTypeEnum.GAUGE, title: 'Medidor', icon: 'tabler-gauge', category: 'Básicos' },
  { value: WidgetTypeEnum.PROGRESS, title: 'Progreso', icon: 'tabler-progress', category: 'Básicos' },
]

const groupedWidgetTypes = computed(() => {
  const groups: Record<string, typeof widgetTypes> = {}
  widgetTypes.forEach((type) => {
    if (!groups[type.category]) {
      groups[type.category] = []
    }
    groups[type.category].push(type)
  })
  return groups
})

const steps = [
  { title: 'Información básica', icon: 'tabler-info-circle' },
  { title: 'Tipo y DataSource', icon: 'tabler-database' },
  { title: 'Configuración', icon: 'tabler-settings' },
  { title: 'Visualización', icon: 'tabler-eye' },
]

onMounted(async () => {
  if (isEditMode.value) {
    await fetchWidget(route.params.id as string)

    if (currentItem.value) {
      form.value = {
        name: currentItem.value.props.name,
        description: currentItem.value.props.description || '',
        type: currentItem.value.props.type,
        dataSourceId: currentItem.value.props.dataSourceId,
        icon: currentItem.value.props.icon || '',
        color: currentItem.value.props.color || '',
        cache: currentItem.value.props.cache || { enabled: false, ttl: 3600 },
        queryConfig: currentItem.value.props.queryConfig || { limit: 100, offset: 0 },
        displayConfig: currentItem.value.props.displayConfig || {},
      }
    }
  }
})

// Watch type changes to set default display config
watch(() => form.value.type, (newType) => {
  form.value.displayConfig = getDefaultDisplayConfig(newType)
})

function getDefaultDisplayConfig(type: WidgetTypeEnum) {
  switch (type) {
    case WidgetTypeEnum.STAT:
      return {
        valueField: '',
        format: 'number',
        decimals: 0,
        prefix: '',
        suffix: '',
      }

    case WidgetTypeEnum.CHART_LINE:
    case WidgetTypeEnum.CHART_BAR:
    case WidgetTypeEnum.CHART_AREA:
      return {
        xAxisField: '',
        yAxisField: '',
        xAxisLabel: '',
        yAxisLabel: '',
        showLegend: true,
        showGrid: true,
        showDataLabels: false,
        curve: 'smooth',
        colors: [],
      }

    case WidgetTypeEnum.CHART_PIE:
    case WidgetTypeEnum.CHART_DONUT:
      return {
        labelField: '',
        valueField: '',
        showLegend: true,
        showDataLabels: true,
        colors: [],
      }

    case WidgetTypeEnum.TABLE:
      return {
        visibleColumns: [],
        columnLabels: {},
        columnFormats: {},
        sortable: true,
        enablePagination: true,
        pageSize: 10,
      }

    case WidgetTypeEnum.MAP:
      return {
        latitudeField: 'latitude',
        longitudeField: 'longitude',
        labelField: '',
        markerColor: '#3FB1CE',
        zoom: 10,
        center: [0, 0],
        showControls: true,
        fitBounds: true,
      }

    default:
      return {}
  }
}

function nextStep() {
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

async function handleSave() {
  isSaving.value = true

  try {
    const data: WidgetCreateDto = {
      name: form.value.name,
      description: form.value.description,
      type: form.value.type,
      dataSourceId: form.value.dataSourceId,
      icon: form.value.icon,
      color: form.value.color,
      cache: form.value.cache,
      queryConfig: form.value.queryConfig,
      displayConfig: form.value.displayConfig,
      transformations: [],
      filters: [],
    }

    if (isEditMode.value && currentItem.value) {
      await updateWidget(currentItem.value.id.toString(), data)
    }
    else {
      await createWidget(data)
    }

    router.push('/widgets')
  }
  catch (err) {
    console.error('Error saving widget:', err)
  }
  finally {
    isSaving.value = false
  }
}

function handleCancel() {
  router.push('/widgets')
}
</script>

<template>
  <div class="widget-form">
    <!-- Header -->
    <VCard class="mb-6">
      <VCardText>
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h5 font-weight-bold">
              {{ isEditMode ? 'Editar Widget' : 'Nuevo Widget' }}
            </h1>
            <p class="text-body-2 text-medium-emphasis mt-1">
              {{ isEditMode ? 'Modifica la configuración del widget' : 'Crea un nuevo widget personalizado' }}
            </p>
          </div>

          <VBtn
            icon="tabler-x"
            variant="text"
            @click="handleCancel"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Stepper -->
    <VCard class="mb-6">
      <VCardText>
        <VStepper
          v-model="currentStep"
          :items="steps"
          hide-actions
        />
      </VCardText>
    </VCard>

    <!-- Error -->
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      {{ error }}
    </VAlert>

    <!-- Form -->
    <VCard>
      <VCardText>
        <!-- Step 1: Basic Info -->
        <div v-show="currentStep === 1">
          <h3 class="text-h6 mb-4">
            Información Básica
          </h3>

          <VTextField
            v-model="form.name"
            label="Nombre del widget *"
            variant="outlined"
            placeholder="Ej: Ventas totales"
            class="mb-4"
            :rules="[v => !!v || 'El nombre es requerido']"
          />

          <VTextarea
            v-model="form.description"
            label="Descripción"
            variant="outlined"
            placeholder="Describe brevemente el propósito del widget"
            rows="3"
            class="mb-4"
          />

          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.icon"
                label="Icono (tabler-*)"
                variant="outlined"
                placeholder="tabler-chart-bar"
                prepend-inner-icon="tabler-icons"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="form.color"
                label="Color"
                variant="outlined"
                placeholder="#1976D2"
                type="color"
              />
            </VCol>
          </VRow>
        </div>

        <!-- Step 2: Type & DataSource -->
        <div v-show="currentStep === 2">
          <h3 class="text-h6 mb-4">
            Tipo y Fuente de Datos
          </h3>

          <div class="mb-6">
            <p class="text-subtitle-2 mb-3">
              Selecciona el tipo de widget *
            </p>

            <div
              v-for="(types, category) in groupedWidgetTypes"
              :key="category"
              class="mb-4"
            >
              <p class="text-caption text-medium-emphasis mb-2">
                {{ category }}
              </p>

              <VRow>
                <VCol
                  v-for="type in types"
                  :key="type.value"
                  cols="6"
                  sm="4"
                  md="3"
                >
                  <VCard
                    :class="{ 'widget-type-card--selected': form.type === type.value }"
                    class="widget-type-card"
                    @click="form.type = type.value"
                  >
                    <VCardText class="text-center pa-4">
                      <VIcon
                        :icon="type.icon"
                        size="32"
                        :color="form.type === type.value ? 'primary' : 'default'"
                        class="mb-2"
                      />
                      <p class="text-caption">
                        {{ type.title }}
                      </p>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>
          </div>

          <VSelect
            v-model="form.dataSourceId"
            label="DataSource *"
            variant="outlined"
            placeholder="Selecciona un DataSource"
            :items="[]"
            prepend-inner-icon="tabler-database"
            :rules="[v => !!v || 'El DataSource es requerido']"
          />
        </div>

        <!-- Step 3: Configuration -->
        <div v-show="currentStep === 3">
          <h3 class="text-h6 mb-4">
            Configuración
          </h3>

          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="form.queryConfig.limit"
                label="Límite de registros"
                variant="outlined"
                type="number"
                min="1"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="form.queryConfig.offset"
                label="Offset"
                variant="outlined"
                type="number"
                min="0"
              />
            </VCol>
          </VRow>

          <VDivider class="my-6" />

          <h4 class="text-subtitle-1 mb-4">
            Cache
          </h4>

          <VSwitch
            v-model="form.cache.enabled"
            label="Habilitar cache"
            color="primary"
            class="mb-4"
          />

          <VTextField
            v-if="form.cache.enabled"
            v-model.number="form.cache.ttl"
            label="TTL (segundos)"
            variant="outlined"
            type="number"
            min="0"
            hint="Tiempo de vida del cache en segundos"
          />
        </div>

        <!-- Step 4: Display Config -->
        <div v-show="currentStep === 4">
          <h3 class="text-h6 mb-4">
            Configuración de Visualización
          </h3>

          <!-- Stat Config -->
          <div v-if="form.type === WidgetTypeEnum.STAT">
            <VTextField
              v-model="form.displayConfig.valueField"
              label="Campo de valor *"
              variant="outlined"
              class="mb-4"
            />

            <VSelect
              v-model="form.displayConfig.format"
              label="Formato"
              variant="outlined"
              :items="[
                { value: 'number', title: 'Número' },
                { value: 'currency', title: 'Moneda' },
                { value: 'percent', title: 'Porcentaje' },
                { value: 'compact', title: 'Compacto' },
              ]"
              class="mb-4"
            />

            <VRow>
              <VCol cols="4">
                <VTextField
                  v-model.number="form.displayConfig.decimals"
                  label="Decimales"
                  variant="outlined"
                  type="number"
                  min="0"
                />
              </VCol>

              <VCol cols="4">
                <VTextField
                  v-model="form.displayConfig.prefix"
                  label="Prefijo"
                  variant="outlined"
                />
              </VCol>

              <VCol cols="4">
                <VTextField
                  v-model="form.displayConfig.suffix"
                  label="Sufijo"
                  variant="outlined"
                />
              </VCol>
            </VRow>
          </div>

          <!-- Chart Config -->
          <div v-else-if="[WidgetTypeEnum.CHART_LINE, WidgetTypeEnum.CHART_BAR, WidgetTypeEnum.CHART_AREA].includes(form.type)">
            <VRow>
              <VCol cols="6">
                <VTextField
                  v-model="form.displayConfig.xAxisField"
                  label="Campo eje X *"
                  variant="outlined"
                />
              </VCol>

              <VCol cols="6">
                <VTextField
                  v-model="form.displayConfig.yAxisField"
                  label="Campo eje Y *"
                  variant="outlined"
                />
              </VCol>
            </VRow>

            <VRow>
              <VCol cols="6">
                <VTextField
                  v-model="form.displayConfig.xAxisLabel"
                  label="Etiqueta eje X"
                  variant="outlined"
                />
              </VCol>

              <VCol cols="6">
                <VTextField
                  v-model="form.displayConfig.yAxisLabel"
                  label="Etiqueta eje Y"
                  variant="outlined"
                />
              </VCol>
            </VRow>

            <VRow>
              <VCol cols="4">
                <VSwitch
                  v-model="form.displayConfig.showLegend"
                  label="Mostrar leyenda"
                  color="primary"
                />
              </VCol>

              <VCol cols="4">
                <VSwitch
                  v-model="form.displayConfig.showGrid"
                  label="Mostrar cuadrícula"
                  color="primary"
                />
              </VCol>

              <VCol cols="4">
                <VSwitch
                  v-model="form.displayConfig.showDataLabels"
                  label="Mostrar etiquetas"
                  color="primary"
                />
              </VCol>
            </VRow>
          </div>

          <!-- Table Config -->
          <div v-else-if="form.type === WidgetTypeEnum.TABLE">
            <VSwitch
              v-model="form.displayConfig.sortable"
              label="Habilitar ordenamiento"
              color="primary"
              class="mb-4"
            />

            <VSwitch
              v-model="form.displayConfig.enablePagination"
              label="Habilitar paginación"
              color="primary"
              class="mb-4"
            />

            <VTextField
              v-if="form.displayConfig.enablePagination"
              v-model.number="form.displayConfig.pageSize"
              label="Tamaño de página"
              variant="outlined"
              type="number"
              min="5"
            />
          </div>

          <!-- Map Config -->
          <div v-else-if="form.type === WidgetTypeEnum.MAP">
            <VRow>
              <VCol cols="6">
                <VTextField
                  v-model="form.displayConfig.latitudeField"
                  label="Campo latitud *"
                  variant="outlined"
                />
              </VCol>

              <VCol cols="6">
                <VTextField
                  v-model="form.displayConfig.longitudeField"
                  label="Campo longitud *"
                  variant="outlined"
                />
              </VCol>
            </VRow>

            <VTextField
              v-model="form.displayConfig.labelField"
              label="Campo etiqueta"
              variant="outlined"
              class="mb-4"
            />

            <VTextField
              v-model="form.displayConfig.markerColor"
              label="Color de marcadores"
              variant="outlined"
              type="color"
              class="mb-4"
            />

            <VSwitch
              v-model="form.displayConfig.showControls"
              label="Mostrar controles"
              color="primary"
              class="mb-4"
            />

            <VSwitch
              v-model="form.displayConfig.fitBounds"
              label="Ajustar vista automáticamente"
              color="primary"
            />
          </div>
        </div>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VBtn
          v-if="currentStep > 1"
          variant="outlined"
          prepend-icon="tabler-arrow-left"
          @click="prevStep"
        >
          Anterior
        </VBtn>

        <VSpacer />

        <VBtn
          variant="text"
          @click="handleCancel"
        >
          Cancelar
        </VBtn>

        <VBtn
          v-if="currentStep < steps.length"
          color="primary"
          append-icon="tabler-arrow-right"
          @click="nextStep"
        >
          Siguiente
        </VBtn>

        <VBtn
          v-else
          color="primary"
          prepend-icon="tabler-device-floppy"
          :loading="isSaving"
          @click="handleSave"
        >
          {{ isEditMode ? 'Actualizar' : 'Crear' }} Widget
        </VBtn>
      </VCardActions>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.widget-form {
  padding: 24px;
}

.widget-type-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    border-color: rgb(var(--v-theme-primary));
  }

  &--selected {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
}
</style>
