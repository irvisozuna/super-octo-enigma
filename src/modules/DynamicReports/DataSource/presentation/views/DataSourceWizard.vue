<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWizardPreviewStore } from '@/stores/wizardPreview.store'
import SqlPreviewDrawer from '@/components/SqlPreviewDrawer.vue'
import { useDataSourceStore } from '../stores/dataSourceStore'
import DataSourceConnectStep from '../components/organisms/DataSourceConnectStep.vue'
import DataSourceJoinsStep from '../components/organisms/DataSourceJoinsStep.vue'
import DataSourceFieldsStep from '../components/organisms/DataSourceFieldsStep.vue'
import DataSourceFiltersStep from '../components/organisms/DataSourceFiltersStep.vue'
import DataSourceAdvancedStep from '../components/organisms/DataSourceAdvancedStep.vue'
import DataSourceSummaryStep from '../components/organisms/DataSourceSummaryStep.vue'

const router = useRouter()
const route = useRoute()
const dataSourceStore = useDataSourceStore()
const wizardPreviewStore = useWizardPreviewStore()

const drawerOpen = ref(true)

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)

// Computed para acceder al wizardData del store
const wizardData = computed(() => wizardPreviewStore.wizardData)

// Steps dinámicos basados en el tipo
const steps = computed(() => {
  const baseSteps = [
    { id: 1, title: 'Conexión', icon: 'mdi-database', component: 'connect' },
  ]

  if (wizardData.value.type === 'table') {
    return [
      ...baseSteps,
      { id: 2, title: 'Joins', icon: 'mdi-link', component: 'joins' },
      { id: 3, title: 'Campos', icon: 'mdi-view-column', component: 'fields' },
      { id: 4, title: 'Filtros', icon: 'mdi-filter', component: 'filters' },
      { id: 5, title: 'Opciones', icon: 'mdi-cog', component: 'advanced' },
      { id: 6, title: 'Resumen', icon: 'mdi-check-circle', component: 'summary' },
    ]
  }

  // Para custom_sql y stored_procedure
  return [
    ...baseSteps,
    { id: 2, title: 'Opciones', icon: 'mdi-cog', component: 'advanced' },
    { id: 3, title: 'Resumen', icon: 'mdi-check-circle', component: 'summary' },
  ]
})

const currentStep = ref(1)
const currentStepData = computed(() => steps.value.find(s => s.id === currentStep.value))

// Helper function para determinar el color de cada step
function getStepColor(stepId: number) {
  if (stepId < currentStep.value)
    return 'primary' // Completado
  if (stepId === currentStep.value)
    return 'primary' // Actual

  return 'grey' // Pendiente
}

// Helper function para determinar el ícono de cada step
function getStepIcon(stepId: number, defaultIcon: string) {
  if (stepId < currentStep.value)
    return 'mdi-check'

  return defaultIcon
}

// Validaciones por paso
const canProceedToNext = computed(() => {
  const data = wizardData.value

  switch (currentStep.value) {
    case 1: // Conexión
      return data.connection_id && data.name && (
        (data.type === 'custom_sql' && data.custom_sql)
        || (data.type === 'table' && data.table)
        || (data.type === 'stored_procedure' && data.procedure)
      )

    case 2: // Joins (solo para table)
      return data.type === 'table' ? true : true // JOINs son opcionales

    case 3: // Campos (solo para table)
      return data.type === 'table' ? data.selectedFields.length > 0 : true

    case 4: // Filtros (solo para table)
      return data.type === 'table' ? true : true // Filtros son opcionales

    case 5: // Opciones Avanzadas
      return true // Siempre se puede avanzar

    case 6: // Resumen
      return true // Siempre se puede avanzar

    default:
      return false
  }
})

const canGoBack = computed(() => currentStep.value > 1)

// Navegación
function nextStep() {
  if (canProceedToNext.value && currentStep.value < steps.value.length) {
    currentStep.value++
  }
}

function previousStep() {
  if (canGoBack.value) {
    currentStep.value--
  }
}

function goToStep(step: number) {
  if (step >= 1 && step <= steps.value.length)
    currentStep.value = step
}

// Handlers para cada paso - solo navegan, no pasan datos
function handleStep1Next() {
  nextStep()
}

function handleStep2Next() {
  nextStep()
}

function handleStep3Next() {
  nextStep()
}

function handleStep4Next() {
  nextStep()
}

function handleStep5Next() {
  nextStep()
}

async function handleFinish() {
  loading.value = true

  try {
    const payload = { ...wizardData.value }

    if (isEdit.value)
      await dataSourceStore.updateItem(route.params.id, payload)
    else
      await dataSourceStore.createItem(payload)

    // Limpia el store del wizard
    wizardPreviewStore.resetWizardData()

    router.push('/data-sources')
  }
  catch (error) {
    console.error('Error saving data source:', error)
  }
  finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/data-sources')
}

// Cargar datos existentes al editar
onMounted(async () => {
  if (isEdit.value) {
    loading.value = true
    await dataSourceStore.fetchById(route.params.id)

    const item = dataSourceStore.currentItem
    if (item) {
      let wizardData = null

      // Si existe metadata.sqlBuilder, úsalo como base
      if (item.metadata && item.metadata.sqlBuilder) {
        wizardData = { ...item.metadata.sqlBuilder }
        wizardData.connection_id = item.connection_id
        wizardData.connection_name = item.connection_name
        wizardData.name = item.name
        wizardData.type = item.type
        wizardData.description = item.description || wizardData.description || ''

        // Solo sobrescribe si no existe en el metadata
        if (wizardData.isActive === undefined)
          wizardData.isActive = item.is_active !== undefined ? item.is_active : true

        if (!wizardData.pagination)
          wizardData.pagination = item.pagination || { enabled: false, pageSize: 50 }

        if (!wizardData.cacheConfig)
          wizardData.cacheConfig = item.cache_config || { enabled: false, ttl: 300 }

        wizardData.generatedSql = item.custom_sql || wizardData.sql_generated || ''
      }
      else {
        // Fallback: usa los campos sueltos
        wizardData = {
          connection_id: item.connection_id,
          connection_name: item.connection_name,
          name: item.name,
          type: item.type,
          custom_sql: item.custom_sql,
          table: item.table,
          tableColumns: item.tableColumns || [],
          procedure: item.procedure,
          procedureParams: item.procedure_params || {},
          procedureColumns: item.procedureColumns || [],
          joins: item.joins || [],
          joinColumns: item.joinColumns || {},
          selectedFields: item.selected_fields || [],
          fieldAliases: item.field_aliases || {},
          filters: item.filters || [],
          sorting: item.sorting || [],
          description: item.description || '',
          pagination: item.pagination || { enabled: false, pageSize: 50 },
          cacheConfig: item.cache_config || { enabled: false, ttl: 300 },
          isActive: item.is_active !== undefined ? item.is_active : true,
          generatedSql: item.custom_sql || '',
        }
      }
      wizardPreviewStore.updateWizardData(wizardData)
    }
    loading.value = false
  }
})
</script>

<template>
  <div>
    <VCard>
      <VCardTitle>
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h4 mb-1">
              {{ isEdit ? 'Editar' : 'Nuevo' }} Data Source
            </h2>
            <p class="text-body-2 text-medium-emphasis">
              Configura una nueva fuente de datos para tus reportes
            </p>
          </div>
          <VBtn
            icon="mdi-close"
            variant="text"
            @click="handleCancel"
          />
        </div>
      </VCardTitle>

      <VCardText>
        <!-- Stepper -->
        <VStepper
          v-model="currentStep"
          class="elevation-0 mb-6"
          alt-labels
        >
          <VStepperHeader>
            <template
              v-for="(step, index) in steps"
              :key="step.id"
            >
              <VStepperItem
                :value="step.id"
                :complete="currentStep > step.id"
                :color="getStepColor(step.id)"
                :icon="getStepIcon(step.id, step.icon)"
                :rules="[]"
              >
                {{ step.title }}
              </VStepperItem>
              <VDivider
                v-if="index < steps.length - 1"
                :color="currentStep > step.id ? 'primary' : 'grey-lighten-2'"
              />
            </template>
          </VStepperHeader>
        </VStepper>

        <!-- Loading Overlay -->
        <VOverlay
          v-model="loading"
          class="align-center justify-center"
        >
          <VProgressCircular
            indeterminate
            size="64"
          />
        </VOverlay>

        <!-- Contenido del paso actual -->
        <div v-if="currentStepData">
          <!-- Paso 1: Conexión -->
          <div v-if="currentStepData.component === 'connect'">
            <DataSourceConnectStep @next="handleStep1Next" />
          </div>

          <!-- Paso 2: Joins (solo para table) -->
          <div v-else-if="currentStepData.component === 'joins'">
            <DataSourceJoinsStep
              @next="handleStep2Next"
              @back="previousStep"
            />
          </div>

          <!-- Paso 3: Campos (solo para table) -->
          <div v-else-if="currentStepData.component === 'fields'">
            <DataSourceFieldsStep
              @next="handleStep3Next"
              @back="previousStep"
            />
          </div>

          <!-- Paso 4: Filtros (solo para table) -->
          <div v-else-if="currentStepData.component === 'filters'">
            <DataSourceFiltersStep
              @next="handleStep4Next"
              @back="previousStep"
            />
          </div>

          <!-- Paso 5: Opciones Avanzadas -->
          <div v-else-if="currentStepData.component === 'advanced'">
            <DataSourceAdvancedStep
              @next="handleStep5Next"
              @back="previousStep"
            />
          </div>

          <!-- Paso 6: Resumen y Prueba -->
          <div v-else-if="currentStepData.component === 'summary'">
            <DataSourceSummaryStep
              @finish="handleFinish"
              @back="previousStep"
            />
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- SQL Preview FAB/Modal -->
    <SqlPreviewDrawer />
  </div>
</template>
