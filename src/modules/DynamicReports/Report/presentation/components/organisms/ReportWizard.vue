<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// Componentes organisms
import { useDataSourceFields } from '../../composables/useDataSourceFields'
import { useReportStore } from '../../stores/reportStore'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import { useReportValidation } from '../../composables/useReportValidation'
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
  initialData?: any
}

const props = withDefaults(defineProps<Props>(), {
  reportId: undefined,
  initialData: undefined,
})

// Emits
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

// Composables
const { t } = useI18n()
const router = useRouter()
const reportStore = useReportStore()
const wizardStore = useReportWizardStore()
const { validateCompleteReport } = useReportValidation()

// Data
const dataSources = ref<any[]>([])
const availableFields = ref<any[]>([])
const loadingDataSources = ref(false)
const errorDataSources = ref<string | null>(null)
const isTransitioning = ref(false)

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
  console.log('🔍 navigateToStep called with:', stepIdx)
  console.log('🔍 currentStep.value:', currentStep.value)
  console.log('🔍 steps.length:', steps.length)
  console.log('🔍 isTransitioning.value:', isTransitioning.value)

  // Validaciones básicas
  if (typeof stepIdx !== 'number' || stepIdx < 0 || stepIdx >= steps.length || isTransitioning.value) {
    console.warn('❌ Invalid step navigation:', { stepIdx, currentStep: currentStep.value, isTransitioning: isTransitioning.value })

    return
  }

  // Prevenir navegación hacia atrás si estamos en transición
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
    await nextTick()
    currentStep.value = stepIdx
    console.log('✅ Navigation successful to step:', stepIdx)
    await nextTick()
  }
  catch (error) {
    console.error('❌ Navigation error:', error)
  }
  finally {
    isTransitioning.value = false
  }
}

const nextStep = async () => {
  console.log('🔍 nextStep called, currentStep:', currentStep.value)
  if (currentStep.value < steps.length - 1)
    await navigateToStep(currentStep.value + 1)
}

const previousStep = async () => {
  console.log('🔍 previousStep called, currentStep:', currentStep.value)
  if (currentStep.value > 0)
    await navigateToStep(currentStep.value - 1)
}

// Computed
const dataSourceIdRef = computed(() => wizardStore.wizardData.basicInfo.dataSourceId)

const { fields: dsFields } = useDataSourceFields(dataSourceIdRef)

// FIJO: Computed mejorado para sortingModel
const sortingModel = computed({
  get() {
    return wizardStore.wizardData.sorting || {
      primary: { field: '', direction: 'ASC' },
      secondary: undefined,
      tertiary: undefined,
      nullsHandling: 'LAST',
      caseSensitive: false,
    }
  },
  set(val) {
    wizardStore.wizardData.sorting = val
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

// FIJO: Watcher mejorado para campos
let fieldWatcher: any = null
onMounted(() => {
  fieldWatcher = watch(
    dsFields,
    newFields => {
      updateAvailableFields(newFields)
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
  console.log(`🔍 Step ${stepIndex + 1} validation:`, isValid)
  stepValidations.value[stepIndex] = isValid

  // Actualizar el estado del store si es necesario
  if (stepIndex === currentStep.value) {
    // Forzar reactividad
    stepValidations.value = { ...stepValidations.value }
  }
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

// FIJO: Watcher para validar pasos automáticamente
watch(
  () => wizardStore.wizardData,
  () => {
    for (let i = 0; i < steps.length; i++) {
      const isValid = validateStep(i)
      if (stepValidations.value[i] !== isValid)
        stepValidations.value[i] = isValid
    }
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

    const errors = await validateCompleteReport(wizardStore.wizardData)

    if (errors.length > 0) {
      showErrorMessage(t('validation.errors_found', { count: errors.length }))

      return
    }

    if (wizardStore.isEditing)
      await reportStore.updateItem(wizardStore.reportId!, wizardStore.wizardData)
    else
      await reportStore.createItem(wizardStore.wizardData)

    wizardStore.clearLocalStorage()
    emit('submit', wizardStore.wizardData)
    await router.push('/reports')
  }
  catch (error) {
    showErrorMessage(error instanceof Error ? error.message : t('DynamicReports.report.error.save'))
  }
}

const handleCancel = async () => {
  emit('cancel')
  await router.push('/reports')
}

// Lifecycle
onMounted(async () => {
  console.log('🔍 Component mounted')
  await loadDataSources()

  if (props.reportId) {
    wizardStore.initializeWizard(true, props.reportId)
    try {
      await reportStore.fetchById(props.reportId)

      // Map existing report data to wizard
    }
    catch (error) {
      showErrorMessage(t('DynamicReports.report.error.load'))
    }
  }
  else {
    wizardStore.initializeWizard(false)
  }
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

// FIJO: Debug watcher para monitorear cambios
watch(
  () => currentStep.value,
  (newStep, oldStep) => {
    console.log(`🔍 Step changed from ${oldStep} to ${newStep}`)
  },
)

watch(
  () => stepValidations.value,
  newValidations => {
    console.log('🔍 Step validations updated:', newValidations)
  },
  { deep: true },
)
</script>

<template>
  <VCard>
    <VRow>
      <VCol
        cols="12"
        md="4"
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
        md="8"
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
                  v-model="wizardStore.wizardData.filters"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(2, isValid)"
                />
              </VWindowItem>

              <!-- Paso 4: Ordenamiento -->
              <VWindowItem :value="3">
                <ReportSortingStep
                  v-model="sortingModel"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(3, isValid)"
                />
              </VWindowItem>

              <!-- Paso 5: Opciones de Exportación -->
              <VWindowItem :value="4">
                <ReportExportStep
                  v-model="wizardStore.wizardData.exportOptions"
                  @validate="(isValid: boolean) => handleStepValidation(4, isValid)"
                />
              </VWindowItem>

              <!-- Paso 6: Configuración Avanzada -->
              <VWindowItem :value="5">
                <ReportAdvancedStep
                  v-model="wizardStore.wizardData.advanced"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(5, isValid)"
                />
              </VWindowItem>

              <!-- Paso 7: Resumen -->
              <VWindowItem :value="6">
                <ReportSummaryStep
                  :basic-info="wizardStore.wizardData.basicInfo"
                  :selected-fields="wizardStore.wizardData.selectedFields"
                  :filters="wizardStore.wizardData.filters"
                  :sorting="wizardStore.wizardData.sorting"
                  :export-options="wizardStore.wizardData.exportOptions"
                  :advanced="wizardStore.wizardData.advanced"
                  :data-sources="dataSources"
                  @submit="handleSubmit"
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
