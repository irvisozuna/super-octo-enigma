<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

// Componentes organisms
import { useDataSourceFields } from '../../composables/useDataSourceFields'
import { useReportStore } from '../../stores/reportStore'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import { useReportValidation } from '../../composables/useReportValidation'
import type { ReportBackendResponse, ReportWizardData } from '../../../domain/types/ReportWizardTypes'
import ReportBasicInfoStep from './ReportBasicInfoStep.vue'
import ReportFieldsStep from './ReportFieldsStep.vue'
import ReportFiltersStep from './ReportFiltersStep.vue'
import ReportSortingStep from './ReportSortingStep.vue'
import ReportExportStep from './ReportExportStep.vue'
import ReportAdvancedStep from './ReportAdvancedStep.vue'
import ReportSummaryStep from './ReportSummaryStep.vue'
import { DataSourceApiService } from '@/modules/DynamicReports/DataSource/infrastructure/api/services/DataSourceApiService'

// Props
interface Props {
  reportId?: string
  initialData?: ReportWizardData
}

const props = withDefaults(defineProps<Props>(), {
  reportId: undefined,
  initialData: undefined,
})

// Emits
const emit = defineEmits<{
  submit: [data: ReportWizardData]
  cancel: []
}>()

// Composables
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const reportStore = useReportStore()
const wizardStore = useReportWizardStore()
const { validateCompleteReport } = useReportValidation()

// Data
const dataSources = ref<any[]>([])
const availableFields = ref<any[]>([])
const loadingDataSources = ref(false)
const errorDataSources = ref<string | null>(null)
const isTransitioning = ref(false)
const loading = ref(false)

// FIJO: Detectar modo edición usando route params
const isEdit = computed(() => !!route.params.id)

// Steps configuration
const steps = [
  {
    title: t('DynamicReports.report.wizard.step1.title'),
    subtitle: t('DynamicReports.report.wizard.step1.description'),
  },
  {
    title: t('DynamicReports.report.wizard.step2.title'),
    subtitle: t('DynamicReports.report.wizard.step2.description'),
  },
  {
    title: t('DynamicReports.report.wizard.step3.title'),
    subtitle: t('DynamicReports.report.wizard.step3.description'),
  },
  {
    title: t('DynamicReports.report.wizard.step4.title'),
    subtitle: t('DynamicReports.report.wizard.step4.description'),
  },
  {
    title: t('DynamicReports.report.wizard.step5.title'),
    subtitle: t('DynamicReports.report.wizard.step5.description'),
  },
  {
    title: t('DynamicReports.report.wizard.step6.title'),
    subtitle: t('DynamicReports.report.wizard.step6.description'),
  },
  {
    title: t('DynamicReports.report.wizard.step7.title'),
    subtitle: t('DynamicReports.report.wizard.step7.description'),
  },
]

// FIJO: Usar un ref independiente para el step actual
const currentStep = ref(0)

const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === steps.length - 1)

// FIJO: Validación de estado de cada paso
const stepValidations = ref<Record<number, boolean>>({
  0: false,
  1: false,
  2: true, // Los filtros son opcionales
  3: true, // El ordenamiento es opcional
  4: true, // Las opciones de exportación son opcionales
  5: true, // La configuración avanzada es opcional
  6: true, // El resumen solo muestra información
})

// FIJO: Función mejorada para navegar entre pasos
const navigateToStep = async (stepIdx: number) => {
  // Validaciones básicas
  if (typeof stepIdx !== 'number' || stepIdx < 0 || stepIdx >= steps.length) {
    console.warn('❌ Invalid step navigation:', { stepIdx, currentStep: currentStep.value })

    return
  }

  // Prevenir navegación si estamos en transición
  if (isTransitioning.value) {
    console.warn('❌ Navigation blocked: transition in progress')

    return
  }

  // Validar que podemos navegar al paso solicitado
  if (stepIdx > currentStep.value) {
    // Navegación hacia adelante: validar pasos anteriores
    for (let i = 0; i < stepIdx; i++) {
      if (!stepValidations.value[i]) {
        console.warn(`❌ Cannot navigate to step ${stepIdx}: step ${i} is not valid`)

        return
      }
    }
  }

  isTransitioning.value = true
  try {
    currentStep.value = stepIdx
    console.log('✅ Navigation successful to step:', stepIdx)
  }
  catch (error) {
    console.error('❌ Navigation error:', error)
  }
  finally {
    // Usar nextTick para liberar la transición en el siguiente ciclo
    await nextTick()
    isTransitioning.value = false
  }
}

const nextStep = () => {
  console.log('🔍 nextStep called, currentStep:', currentStep.value)
  if (currentStep.value < steps.length - 1)
    navigateToStep(currentStep.value + 1)
}

const previousStep = () => {
  console.log('🔍 previousStep called, currentStep:', currentStep.value)
  if (currentStep.value > 0)
    navigateToStep(currentStep.value - 1)
}

// Computed
const dataSourceIdRef = computed(() => wizardStore.wizardData.basicInfo.dataSourceId)

const { fields: dsFields } = useDataSourceFields(dataSourceIdRef)

// Helper functions for sorting transformation
const transformSortingObjectToArray = (sortingObj: any) => {
  if (!sortingObj || !sortingObj.primary?.field)
    return []

  const rules = []

  // Convert nullsHandling to the format expected by ReportSortingStep
  const normalizeNullsHandling = (value: any) => {
    if (value === 'IGNORE')
      return 'DEFAULT'
    if (value === 'FIRST' || value === 'LAST')
      return value

    return 'DEFAULT'
  }

  // Primary sorting
  rules.push({
    id: `sort_primary_${Date.now()}`,
    field: sortingObj.primary.field,
    alias: getFieldAlias(sortingObj.primary.field),
    direction: sortingObj.primary.direction || 'ASC',
    nullsHandling: normalizeNullsHandling(sortingObj.nullsHandling),
    caseSensitive: sortingObj.caseSensitive || false,
    priority: 1,
  })

  // Secondary sorting
  if (sortingObj.secondary?.field) {
    rules.push({
      id: `sort_secondary_${Date.now()}`,
      field: sortingObj.secondary.field,
      alias: getFieldAlias(sortingObj.secondary.field),
      direction: sortingObj.secondary.direction || 'ASC',
      nullsHandling: normalizeNullsHandling(sortingObj.nullsHandling),
      caseSensitive: sortingObj.caseSensitive || false,
      priority: 2,
    })
  }

  // Tertiary sorting
  if (sortingObj.tertiary?.field) {
    rules.push({
      id: `sort_tertiary_${Date.now()}`,
      field: sortingObj.tertiary.field,
      alias: getFieldAlias(sortingObj.tertiary.field),
      direction: sortingObj.tertiary.direction || 'ASC',
      nullsHandling: normalizeNullsHandling(sortingObj.nullsHandling),
      caseSensitive: sortingObj.caseSensitive || false,
      priority: 3,
    })
  }

  return rules
}

const transformSortingArrayToObject = (sortingArray: any[]) => {
  if (!Array.isArray(sortingArray) || sortingArray.length === 0) {
    return {
      primary: { field: '', direction: 'ASC' },
      secondary: undefined,
      tertiary: undefined,
      nullsHandling: 'LAST',
      caseSensitive: false,
    }
  }

  // Sort by priority
  const sortedRules = [...sortingArray].sort((a, b) => (a.priority || 0) - (b.priority || 0))

  // Convert nullsHandling to the format expected by validation schema
  const normalizeNullsHandlingForValidation = (value: any) => {
    if (value === 'DEFAULT')
      return 'LAST'
    if (value === 'FIRST' || value === 'LAST')
      return value

    return 'LAST'
  }

  const result = {
    primary: { field: '', direction: 'ASC' as 'ASC' | 'DESC' },
    secondary: undefined as { field: string; direction: 'ASC' | 'DESC' } | undefined,
    tertiary: undefined as { field: string; direction: 'ASC' | 'DESC' } | undefined,
    nullsHandling: normalizeNullsHandlingForValidation(sortedRules[0]?.nullsHandling) as 'FIRST' | 'LAST',
    caseSensitive: sortedRules[0]?.caseSensitive || false,
  }

  // Primary (first rule)
  if (sortedRules[0]) {
    result.primary = {
      field: sortedRules[0].field,
      direction: sortedRules[0].direction || 'ASC',
    }
  }

  // Secondary (second rule)
  if (sortedRules[1]) {
    result.secondary = {
      field: sortedRules[1].field,
      direction: sortedRules[1].direction || 'ASC',
    }
  }

  // Tertiary (third rule)
  if (sortedRules[2]) {
    result.tertiary = {
      field: sortedRules[2].field,
      direction: sortedRules[2].direction || 'ASC',
    }
  }

  return result
}

const getFieldAlias = (fieldName: string) => {
  const field = wizardStore.wizardData.selectedFields.find(f => f.field === fieldName)

  return field?.alias || fieldName
}

// FIJO: Computed para manejar la transformación de sorting entre array y objeto
const sortingModel = computed({
  get() {
    // Transformar del objeto (store) al array (ReportSortingStep)
    const result = transformSortingObjectToArray(wizardStore.wizardData.sorting)

    console.log('🔄 sortingModel GET - from store:', wizardStore.wizardData.sorting, 'to array:', result)

    return result
  },
  set(val) {
    // Transformar del array (ReportSortingStep) al objeto (store)
    console.log('🔄 sortingModel SET - from array:', val)

    const transformedSorting = transformSortingArrayToObject(val)

    console.log('🔄 sortingModel SET - to object:', transformedSorting)

    wizardStore.updateSorting(transformedSorting)
  },
})

// FIJO: Computed para validar si se puede proceder
const canProceedToNextStep = computed(() => {
  return stepValidations.value[currentStep.value] === true
})

// FIJO: Función para actualizar campos disponibles sin causar loops
const updateAvailableFields = (newFields: any[]) => {
  const newFieldsStr = JSON.stringify(newFields || [])
  const currentFieldsStr = JSON.stringify(availableFields.value)

  if (newFieldsStr !== currentFieldsStr) {
    availableFields.value = newFields || []
    console.log('🔍 Available fields updated:', availableFields.value.length)
  }
}

// FIJO: Watcher mejorado para campos con throttle
let fieldWatcher: any = null
let fieldUpdateTimeout: any = null

onMounted(() => {
  fieldWatcher = watch(
    dsFields,
    newFields => {
      // Debounce para evitar múltiples actualizaciones consecutivas
      if (fieldUpdateTimeout)
        clearTimeout(fieldUpdateTimeout)

      fieldUpdateTimeout = setTimeout(() => {
        updateAvailableFields(newFields)
      }, 100)
    },
    {
      immediate: true,
      deep: false,
    },
  )
})

onUnmounted(() => {
  if (fieldWatcher) {
    fieldWatcher()
    fieldWatcher = null
  }

  if (fieldUpdateTimeout) {
    clearTimeout(fieldUpdateTimeout)
    fieldUpdateTimeout = null
  }
})

// Methods
const loadDataSources = async () => {
  loadingDataSources.value = true
  errorDataSources.value = null
  try {
    const api = new DataSourceApiService()
    const res = await api.getList({})

    dataSources.value = res.data || []
    console.log('✅ Data sources loaded:', dataSources.value.length)
  }
  catch (e: any) {
    errorDataSources.value = e.message
    console.error('❌ Error loading data sources:', e)
  }
  finally {
    loadingDataSources.value = false
  }
}

// FIJO: Función mejorada para manejar validación de pasos
const handleStepValidation = (stepIndex: number, isValid: boolean) => {
  if (stepValidations.value[stepIndex] !== isValid)
    stepValidations.value[stepIndex] = isValid
}

// FIJO: Validaciones específicas para cada paso
const validateStep = (stepIndex: number): boolean => {
  switch (stepIndex) {
  case 0: // Información básica
    return !!(wizardStore.wizardData.basicInfo.name?.trim() && wizardStore.wizardData.basicInfo.dataSourceId)
  case 1: // Campos seleccionados
    return Array.isArray(wizardStore.wizardData.selectedFields) && wizardStore.wizardData.selectedFields.length > 0
  case 2: // Filtros (opcional)
    return true
  case 3: // Ordenamiento (opcional)
    return true
  case 4: // Exportación (opcional)
    return true
  case 5: // Avanzado (opcional)
    return true
  case 6: // Resumen
    return true
  default:
    return false
  }
}

// Flag para prevenir recursión infinita
const isValidating = ref(false)

// FIJO: Watcher para validar pasos automáticamente con protección contra bucles
watch(
  () => wizardStore.wizardData,
  () => {
    // Prevenir recursión infinita
    if (isValidating.value)
      return

    isValidating.value = true

    // Usar nextTick para procesar en el siguiente ciclo de reactividad
    nextTick(() => {
      try {
        for (let i = 0; i < steps.length; i++) {
          const isValid = validateStep(i)
          if (stepValidations.value[i] !== isValid)
            stepValidations.value[i] = isValid
        }
      }
      finally {
        isValidating.value = false
      }
    })
  },
  { deep: true, immediate: true },
)

const showErrorMessage = (message: string) => {
  console.error('❌ Error:', message)

  // Add toast notification here if available
}

const handleSubmit = async () => {
  try {
    if (isTransitioning.value) {
      console.warn('❌ Submit blocked: transition in progress')

      return
    }

    // Ya NO filtrar filtros incompletos, se deben guardar todos los filtros configurados
    // wizardStore.wizardData.filters = wizardStore.wizardData.filters.filter(
    //   f => f.field && f.type && f.operator,
    // )

    console.log('🚀 handleSubmit - wizardStore.wizardData:', JSON.stringify(wizardStore.wizardData, null, 2))
    console.log('🚀 handleSubmit - sorting data type:', typeof wizardStore.wizardData.sorting)
    console.log('🚀 handleSubmit - sorting data:', wizardStore.wizardData.sorting)

    const errors = await validateCompleteReport(wizardStore.wizardData)

    if (errors.length > 0) {
      console.error('❌ Validation errors:', errors)
      showErrorMessage(t('validation.errors_found', { count: errors.length }))

      return
    }

    if (isEdit.value)
      await reportStore.updateItem(route.params.id as string, wizardStore.wizardData)
    else
      await reportStore.createItem(wizardStore.wizardData)

    wizardStore.clearLocalStorage()
    emit('submit', wizardStore.wizardData)
    await router.push('/reports')
  }
  catch (error) {
    console.error('❌ Submit error:', error)
    showErrorMessage(error instanceof Error ? error.message : t('DynamicReports.report.error.save'))
  }
}

const handleCancel = async () => {
  emit('cancel')
  await router.push('/reports')
}

// Add loading state to prevent rendering until store is ready
const isStoreReady = ref(false)

// Initialize wizard with proper error handling
const initializeWizard = async () => {
  try {
    if (props.reportId)
      wizardStore.initializeWizard(true, props.reportId)

    else
      wizardStore.initializeWizard(false)

    // Force proper initialization by ensuring all advanced properties exist
    if (!wizardStore.wizardData.advanced.templates)
      wizardStore.wizardData.advanced.templates = { selected: 'default', custom: [] }

    if (!wizardStore.wizardData.advanced.calculatedFields)
      wizardStore.wizardData.advanced.calculatedFields = []

    if (!wizardStore.wizardData.advanced.conditionalFormats)
      wizardStore.wizardData.advanced.conditionalFormats = []

    if (!wizardStore.wizardData.advanced.interactive) {
      wizardStore.wizardData.advanced.interactive = {
        filters: { enabled: true, showFilterBar: true, quickFilters: [], allowCustomFilters: true },
        actions: { enabled: true, allowExport: true, allowPrint: true, allowShare: true, customActions: [] },
        drillDown: { enabled: false, levels: [] },
      }
    }
    if (!wizardStore.wizardData.advanced.performance) {
      wizardStore.wizardData.advanced.performance = {
        enableCache: true,
        cacheTimeout: 300,
        enableLazyLoading: true,
        enableVirtualScrolling: false,
        maxRowsToRender: 1000,
      }
    }
    if (!wizardStore.wizardData.advanced.security) {
      wizardStore.wizardData.advanced.security = {
        enableFieldLevelSecurity: false,
        hiddenFields: [],
        restrictedFields: [],
        enableRowLevelSecurity: false,
        securityFilters: [],
      }
    }

    return true
  }
  catch (error) {
    console.error('Error initializing wizard:', error)

    return false
  }
}

// Initialize immediately
initializeWizard()

// Lifecycle
onMounted(async () => {
  await loadDataSources()

  // FIJO: Cargar datos existentes al editar (patrón de DataSourceWizard)
  if (isEdit.value) {
    loading.value = true
    try {
      await reportStore.fetchById(route.params.id as string)

      const item = reportStore.currentItem
      if (item) {
        // El backend devuelve datos con la misma estructura que el wizard
        console.log('🔍 item:', item)

        const wizardData = item as ReportBackendResponse

        // Actualizar el store con los datos cargados
        wizardStore.setWizardData(wizardData)
        console.log('✅ Report data loaded for editing:', wizardData)
      }
    }
    catch (error) {
      console.error('❌ Error loading report for editing:', error)
      showErrorMessage(t('DynamicReports.report.error.load'))
    }
    finally {
      loading.value = false
    }
  }

  // Ensure wizard is fully initialized
  await initializeWizard()

  // Wait for next tick to ensure store is fully initialized
  await nextTick()
  isStoreReady.value = true
})

onUnmounted(() => {
  isTransitioning.value = false
  if (fieldWatcher) {
    fieldWatcher()
    fieldWatcher = null
  }
})

// FIJO: Computed mejorado para estados de pasos
const stepStates = computed(() => {
  return steps.map((_, idx) => {
    if (idx < currentStep.value)
      return stepValidations.value[idx] ? 'completed' : 'incomplete'
    else if (idx === currentStep.value)
      return 'active'
    else
      return 'pending'
  })
})
</script>

<template>
  <VCard>
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

    <VRow>
      <VCol
        cols="12"
        md="3"
        :class="$vuetify.display.smAndDown ? 'border-b' : 'border-e'"
      >
        <VCardText>
          <!-- 👉 Stepper -->
          <AppStepper
            :current-step="currentStep"
            :step-states="stepStates"
            direction="vertical"
            :items="steps"
            @update:current-step="navigateToStep"
          />

          <!-- Auto-save indicator -->
          <div
            v-if="wizardStore.lastSaved"
            class="mt-4 text-caption text-medium-emphasis"
          >
            <VIcon
              icon="tabler-device-floppy"
              size="16"
              class="me-1"
            />
            {{ $t('DynamicReports.report.wizard.last_saved') }}:
            {{ new Date(wizardStore.lastSaved).toLocaleTimeString() }}
          </div>
        </VCardText>
      </VCol>

      <!-- 👉 stepper content -->
      <VCol
        cols="12"
        md="9"
      >
        <VCardText>
          <VForm>
            <VWindow
              :model-value="currentStep"
              class="disable-tab-transition"
            >
              <!-- Paso 1: Información Básica -->
              <VWindowItem :value="0">
                <ReportBasicInfoStep
                  v-if="isStoreReady"
                  v-model="wizardStore.wizardData.basicInfo"
                  :data-sources="dataSources"
                  :loading="loadingDataSources"
                  :error="errorDataSources"
                  @validate="(isValid: boolean) => handleStepValidation(0, isValid)"
                />
              </VWindowItem>

              <!-- Paso 2: Selección de Campos -->
              <VWindowItem :value="1">
                <ReportFieldsStep
                  v-if="isStoreReady"
                  v-model="wizardStore.wizardData.selectedFields"
                  :available-fields="availableFields"
                  :data-source-id="wizardStore.wizardData.basicInfo.dataSourceId"
                  :loading="loadingDataSources"
                  :error="errorDataSources"
                  @validate="(isValid: boolean) => handleStepValidation(1, isValid)"
                />
              </VWindowItem>

              <!-- Paso 3: Configuración de Filtros -->
              <VWindowItem :value="2">
                <ReportFiltersStep
                  v-if="isStoreReady"
                  v-model="wizardStore.wizardData.filters"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(2, isValid)"
                />
              </VWindowItem>

              <!-- Paso 4: Ordenamiento -->
              <VWindowItem :value="3">
                <ReportSortingStep
                  v-if="isStoreReady"
                  v-model="sortingModel"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(3, isValid)"
                />
              </VWindowItem>

              <!-- Paso 5: Opciones de Exportación -->
              <VWindowItem :value="4">
                <ReportExportStep
                  v-if="isStoreReady"
                  v-model="wizardStore.wizardData.exportOptions"
                  @validate="(isValid: boolean) => handleStepValidation(4, isValid)"
                />
              </VWindowItem>

              <!-- Paso 6: Configuración Avanzada -->
              <VWindowItem :value="5">
                <ReportAdvancedStep
                  v-if="isStoreReady"
                  v-model="wizardStore.wizardData.advanced"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(5, isValid)"
                />
              </VWindowItem>

              <!-- Paso 7: Resumen -->
              <VWindowItem :value="6">
                <ReportSummaryStep
                  v-if="isStoreReady"
                  :basic-info="wizardStore.wizardData.basicInfo"
                  :selected-fields="wizardStore.wizardData.selectedFields"
                  :filters="wizardStore.wizardData.filters"
                  :sorting="wizardStore.wizardData.sorting"
                  :export-options="wizardStore.wizardData.exportOptions"
                  :data-sources="dataSources"
                  @submit="handleSubmit"
                  @cancel="handleCancel"
                />
              </VWindowItem>
            </VWindow>

            <div class="d-flex flex-wrap gap-4 justify-sm-space-between justify-center mt-8">
              <VBtn
                color="secondary"
                variant="tonal"
                :disabled="isFirstStep || isTransitioning"
                @click="previousStep"
              >
                <VIcon
                  icon="tabler-arrow-left"
                  start
                  class="flip-in-rtl"
                />
                {{ $t('common.previous') }}
              </VBtn>

              <VBtn
                v-if="isLastStep"
                color="success"
                :disabled="isTransitioning"
                @click="handleSubmit"
              >
                <VIcon
                  icon="tabler-check"
                  end
                />
                {{ $t('common.submit') }}
              </VBtn>

              <VBtn
                v-else
                color="primary"
                :disabled="!canProceedToNextStep || isTransitioning"
                @click="nextStep"
              >
                {{ $t('common.next') }}
                <VIcon
                  icon="tabler-arrow-right"
                  end
                  class="flip-in-rtl"
                />
              </VBtn>

              <!-- Contextual help message for step validation -->
            </div>
          </VForm>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<style scoped>
.disable-tab-transition {
  overflow: hidden;
}

.disable-tab-transition .v-window__container {
  transition: none !important;
}

.disable-tab-transition .v-window-item {
  transition: none !important;
}
</style>
