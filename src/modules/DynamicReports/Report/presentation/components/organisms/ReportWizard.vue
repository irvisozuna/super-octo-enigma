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
    id: 'basic',
    title: t('DynamicReports.report.wizard.step1.title'),
    subtitle: t('DynamicReports.report.wizard.step1.description'),
  },
  {
    id: 'fields',
    title: t('DynamicReports.report.wizard.step2.title'),
    subtitle: t('DynamicReports.report.wizard.step2.description'),
  },
  {
    id: 'filters',
    title: t('DynamicReports.report.wizard.step3.title'),
    subtitle: t('DynamicReports.report.wizard.step3.description'),
  },
  {
    id: 'sorting',
    title: t('DynamicReports.report.wizard.step4.title'),
    subtitle: t('DynamicReports.report.wizard.step4.description'),
  },
  {
    id: 'export',
    title: t('DynamicReports.report.wizard.step5.title'),
    subtitle: t('DynamicReports.report.wizard.step5.description'),
  },
  {
    id: 'advanced',
    title: t('DynamicReports.report.wizard.step6.title'),
    subtitle: t('DynamicReports.report.wizard.step6.description'),
  },
  {
    id: 'summary',
    title: t('DynamicReports.report.wizard.step7.title'),
    subtitle: t('DynamicReports.report.wizard.step7.description'),
  },
]

const stepIds = steps.map(s => s.id)

// Use a single source of truth for current step - FIXED to prevent infinite loops
const currentStep = computed({
  get: () => {
    const step = wizardStore.currentStep || stepIds[0]

    console.log('🔍 currentStep getter:', step)

    return step
  },
  set: (val: string) => {
    console.log('🔍 currentStep setter called with:', val, 'current:', wizardStore.currentStep)

    // Only check for valid step and not redundant
    if (stepIds.includes(val) && wizardStore.currentStep !== val) {
      console.log('🔍 Setting current step to:', val)
      wizardStore.setCurrentStep(val)
    }
    else {
      console.log('🔍 Skipping setCurrentStep - conditions not met')
    }
  },
})

const currentStepIndex = computed(() => stepIds.indexOf(currentStep.value))
const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(() => currentStepIndex.value === stepIds.length - 1)

// Navigation methods with transition handling
const navigateToStep = async (stepId: string | number) => {
  const targetStep = typeof stepId === 'string' ? stepId : stepIds[stepId]

  console.log('🔍 navigateToStep called with:', stepId, 'targetStep:', targetStep)
  console.log('🔍 isTransitioning:', isTransitioning.value, 'currentStep:', currentStep.value)

  if (!stepIds.includes(targetStep) || isTransitioning.value) {
    console.log('🔍 Navigation blocked - invalid step or transitioning')

    return
  }

  console.log('🔍 Starting navigation to:', targetStep)
  isTransitioning.value = true
  try {
    // Wait for current render cycle to complete
    await nextTick()
    currentStep.value = targetStep
    await nextTick()
    console.log('🔍 Navigation completed to:', targetStep)
  }
  finally {
    isTransitioning.value = false
    console.log('🔍 Transition flag reset')
  }
}

const nextStep = async () => {
  console.log('🔍 nextStep called')
  console.log('🔍 currentStepIndex:', currentStepIndex.value, 'total steps:', stepIds.length)

  if (currentStepIndex.value < stepIds.length - 1) {
    const nextStepId = stepIds[currentStepIndex.value + 1]

    console.log('🔍 Navigating to next step:', nextStepId)
    await navigateToStep(nextStepId)
  }
  else {
    console.log('🔍 Already at last step')
  }
}

const previousStep = async () => {
  console.log('🔍 previousStep called')
  console.log('🔍 currentStepIndex:', currentStepIndex.value)

  if (currentStepIndex.value > 0) {
    const prevStepId = stepIds[currentStepIndex.value - 1]

    console.log('🔍 Navigating to previous step:', prevStepId)
    await navigateToStep(prevStepId)
  }
  else {
    console.log('🔍 Already at first step')
  }
}

// Computed
const dataSourceIdRef = computed(() => wizardStore.wizardData.basicInfo.dataSourceId)

const { fields: dsFields } = useDataSourceFields(dataSourceIdRef)

// Add a computed for sortingModel to safely use as v-model
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

// Update available fields when data source fields change - FIXED to prevent loops
const updateAvailableFields = (newFields: any[]) => {
  // Only update if the array actually changed to prevent unnecessary re-renders
  if (JSON.stringify(availableFields.value) !== JSON.stringify(newFields || []))
    availableFields.value = newFields || []
}

// Watch for field changes with proper cleanup - FIXED to prevent infinite loops
let fieldWatcher: any = null
onMounted(() => {
  fieldWatcher = watch(dsFields, updateAvailableFields, {
    immediate: true,
    deep: false, // Don't watch deeply to prevent loops
  })
})

onUnmounted(() => {
  if (fieldWatcher)
    fieldWatcher()
})

// Methods
const loadDataSources = async () => {
  loadingDataSources.value = true
  errorDataSources.value = null
  try {
    const api = new DataSourceApiService()
    const res = await api.getList({})

    dataSources.value = res.data || []
  }
  catch (e: any) {
    errorDataSources.value = e.message
  }
  finally {
    loadingDataSources.value = false
  }
}

const handleStepValidation = (stepIndex: number, isValid: boolean) => {
  console.log(`Step ${stepIndex + 1} validation:`, isValid)
}

const showErrorMessage = (message: string) => {
  console.error(message)

  // Add toast notification here if available
}

const handleSubmit = async () => {
  try {
    // Prevent submission during transition
    if (isTransitioning.value)
      return

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

// Cleanup on unmount
onUnmounted(() => {
  isTransitioning.value = false
})
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
              @update:model-value="navigateToStep"
            >
              <!-- Paso 1: Información Básica -->
              <VWindowItem
                :key="`step-basic-${wizardStore.wizardData.basicInfo.dataSourceId}`"
                value="basic"
              >
                <ReportBasicInfoStep
                  v-model="wizardStore.wizardData.basicInfo"
                  :data-sources="dataSources"
                  :loading="loadingDataSources"
                  :error="errorDataSources"
                  @validate="(isValid: boolean) => handleStepValidation(0, isValid)"
                />
              </VWindowItem>

              <!-- Paso 2: Selección de Campos -->
              <VWindowItem
                :key="`step-fields-${wizardStore.wizardData.basicInfo.dataSourceId}`"
                value="fields"
              >
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
              <VWindowItem
                :key="`step-filters-${currentStep}`"
                value="filters"
              >
                <ReportFiltersStep
                  v-model="wizardStore.wizardData.filters"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(2, isValid)"
                />
              </VWindowItem>

              <!-- Paso 4: Ordenamiento -->
              <VWindowItem
                :key="`step-sorting-${currentStep}`"
                value="sorting"
              >
                <ReportSortingStep
                  v-model="sortingModel"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(3, isValid)"
                />
              </VWindowItem>

              <!-- Paso 5: Opciones de Exportación -->
              <VWindowItem
                :key="`step-export-${currentStep}`"
                value="export"
              >
                <ReportExportStep
                  v-model="wizardStore.wizardData.exportOptions"
                  @validate="(isValid: boolean) => handleStepValidation(4, isValid)"
                />
              </VWindowItem>

              <!-- Paso 6: Configuración Avanzada -->
              <VWindowItem
                :key="`step-advanced-${currentStep}`"
                value="advanced"
              >
                <ReportAdvancedStep
                  v-model="wizardStore.wizardData.advanced"
                  :available-fields="wizardStore.wizardData.selectedFields"
                  @validate="(isValid: boolean) => handleStepValidation(5, isValid)"
                />
              </VWindowItem>

              <!-- Paso 7: Resumen -->
              <VWindowItem
                :key="`step-summary-${currentStep}`"
                value="summary"
              >
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
                {{ $t('common.prev') }}
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
                :disabled="!wizardStore.canProceed || isTransitioning"
                @click="() => {
                  console.log('🔍 Next button clicked')
                  console.log('🔍 canProceed:', wizardStore.canProceed)
                  console.log('🔍 isTransitioning:', isTransitioning.value)
                  nextStep()
                }"
              >
                {{ $t('common.next') }}
                <VIcon
                  icon="tabler-arrow-right"
                  end
                  class="flip-in-rtl"
                />
              </VBtn>

              <!-- Debug info -->
              <div
                v-if="!wizardStore.canProceed"
                class="text-caption text-error mt-2"
              >
                {{ $t('DynamicReports.report.wizard.cannot_proceed') }}
              </div>
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

/* Prevent flickering during transitions */
.disable-tab-transition .v-window__container {
  transition: none !important;
}

.disable-tab-transition .v-window-item {
  transition: none !important;
}
</style>
