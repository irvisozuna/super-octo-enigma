<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDrillingReportStore } from '../stores/drillingReportStore'
import { formatDate } from '@/modules/DrillingReportsModule/shared/utils/dateUtils'

// Props
interface Props {
  reportId: string
}

const props = defineProps<Props>()

// Composables
const router = useRouter()
const route = useRoute()
const drillingReportStore = useDrillingReportStore()

// State
const currentStep = ref(1)
const loading = ref(false)
const completing = ref(false)
const horometerFormRef = ref()
const horometerFormValid = ref(false)

const horometerData = ref({
  horometer_end_day: null,
  horometer_end_night: null,
})

const horometerErrors = ref({})
const signatureData = ref('')

// Computed
const report = computed(() => drillingReportStore.currentReport)

const canComplete = computed(() => {
  return report.value?.activities?.length > 0
         && (report.value?.personnel?.operator_day || report.value?.personnel?.operator_night)
})

const canProceed = computed(() => {
  switch (currentStep.value) {
  case 1:
    return canComplete.value
  case 2:
    return horometerFormValid.value
  case 3:
    return true
  case 4:
    return signatureData.value.length > 0
  default:
    return false
  }
})

const totalHours = computed(() => {
  let hours = 0
  if (horometerData.value.horometer_start_day && horometerData.value.horometer_end_day)
    hours += calculateHours(horometerData.value.horometer_start_day, horometerData.value.horometer_end_day)

  if (horometerData.value.horometer_start_night && horometerData.value.horometer_end_night)
    hours += calculateHours(horometerData.value.horometer_start_night, horometerData.value.horometer_end_night)

  return hours
})

const totalMeters = computed(() => {
  return report.value?.totals?.meters_drilled || 0
})

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
  horometer: (value: any) => {
    if (!value)
      return true
    const num = Number.parseFloat(value)

    return num >= 0 || 'El horómetro no puede ser negativo'
  },
}

// Methods
const goBack = () => {
  router.push(`/drilling/reports/${props.reportId}`)
}

const getOperatorName = () => {
  return report.value?.personnel?.operator_day?.name
         || report.value?.personnel?.operator_night?.name
}

const calculateHours = (start: number, end: number): number => {
  if (!start || !end)
    return 0

  return Math.max(0, end - start)
}

const nextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const clearSignature = () => {
  signatureData.value = ''
}

const completeReport = async () => {
  if (!canComplete.value)
    return

  completing.value = true
  try {
    // TODO: Implement complete report
    console.log('Completing report:', {
      reportId: props.reportId,
      horometerData: horometerData.value,
      signatureData: signatureData.value,
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Show success message
    // TODO: Show success notification

    // Navigate back to detail view
    router.push(`/drilling/reports/${props.reportId}`)
  }
  catch (error) {
    console.error('Error completing report:', error)

    // TODO: Show error notification
  }
  finally {
    completing.value = false
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await drillingReportStore.fetchReport(props.reportId)

    // Initialize horometer data
    if (report.value?.horometer) {
      horometerData.value = {
        horometer_end_day: report.value.horometer.day?.end || null,
        horometer_end_night: report.value.horometer.night?.end || null,
      }
    }
  }
  catch (error) {
    console.error('Error loading data:', error)
  }
  finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="drilling-report-complete">
    <!-- Header -->
    <div class="complete-header">
      <div class="header-left">
        <VBtn
          icon="tabler-arrow-left"
          variant="text"
          @click="goBack"
        />
        <div class="complete-info">
          <h1 class="complete-title">
            Completar Reporte
          </h1>
          <p class="complete-subtitle">
            {{ report.report_number }} - {{ formatDate(report.report_date) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Wizard Steps -->
    <VStepper
      v-model="currentStep"
      class="mb-4"
    >
      <VStepperHeader>
        <VStepperItem
          :complete="currentStep > 1"
          :value="1"
          title="Verificar Información"
        />
        <VDivider />
        <VStepperItem
          :complete="currentStep > 2"
          :value="2"
          title="Horómetro Final"
        />
        <VDivider />
        <VStepperItem
          :complete="currentStep > 3"
          :value="3"
          title="Resumen Final"
        />
        <VDivider />
        <VStepperItem
          :complete="currentStep > 4"
          :value="4"
          title="Firmar Reporte"
        />
      </VStepperHeader>

      <VStepperWindow>
        <!-- Step 1: Verify Information -->
        <VStepperWindowItem :value="1">
          <VCard>
            <VCardTitle>Verificar Información</VCardTitle>
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VCard
                    variant="outlined"
                    class="mb-4"
                  >
                    <VCardTitle class="text-h6">
                      Información General
                    </VCardTitle>
                    <VCardText>
                      <div class="verification-item">
                        <VIcon
                          :icon="report.project ? 'tabler-circle-check' : 'tabler-alert-circle'"
                          :color="report.project ? 'success' : 'warning'"
                          class="me-2"
                        />
                        <span>Proyecto: {{ report.project?.name || 'No asignado' }}</span>
                      </div>
                      <div class="verification-item">
                        <VIcon
                          :icon="report.well ? 'tabler-circle-check' : 'tabler-alert-circle'"
                          :color="report.well ? 'success' : 'warning'"
                          class="me-2"
                        />
                        <span>Pozo: {{ report.well?.name || 'No asignado' }}</span>
                      </div>
                      <div class="verification-item">
                        <VIcon
                          :icon="report.personnel?.operator_day || report.personnel?.operator_night ? 'tabler-circle-check' : 'tabler-alert-circle'"
                          :color="report.personnel?.operator_day || report.personnel?.operator_night ? 'success' : 'warning'"
                          class="me-2"
                        />
                        <span>Operador: {{ getOperatorName() || 'No asignado' }}</span>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VCard
                    variant="outlined"
                    class="mb-4"
                  >
                    <VCardTitle class="text-h6">
                      Actividades y Recursos
                    </VCardTitle>
                    <VCardText>
                      <div class="verification-item">
                        <VIcon
                          :icon="report.activities?.length ? 'tabler-circle-check' : 'tabler-alert-circle'"
                          :color="report.activities?.length ? 'success' : 'warning'"
                          class="me-2"
                        />
                        <span>Actividades: {{ report.activities?.length || 0 }}</span>
                      </div>
                      <div class="verification-item">
                        <VIcon
                          :icon="report.consumptions?.length ? 'tabler-circle-check' : 'tabler-info-circle'"
                          :color="report.consumptions?.length ? 'success' : 'info'"
                          class="me-2"
                        />
                        <span>Consumos: {{ report.consumptions?.length || 0 }}</span>
                      </div>
                      <div class="verification-item">
                        <VIcon
                          :icon="report.tool_assignments?.length ? 'tabler-circle-check' : 'tabler-info-circle'"
                          :color="report.tool_assignments?.length ? 'success' : 'info'"
                          class="me-2"
                        />
                        <span>Herramientas: {{ report.tool_assignments?.length || 0 }}</span>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>

              <VAlert
                v-if="!canComplete"
                type="warning"
                class="mb-4"
              >
                <VIcon
                  icon="tabler-alert-circle"
                  class="me-2"
                />
                El reporte no puede completarse. Verifica que tenga al menos una actividad y un operador asignado.
              </VAlert>
            </VCardText>
          </VCard>
        </VStepperWindowItem>

        <!-- Step 2: Final Horometer -->
        <VStepperWindowItem :value="2">
          <VCard>
            <VCardTitle>Horómetro Final</VCardTitle>
            <VCardText>
              <VForm
                ref="horometerFormRef"
                v-model="horometerFormValid"
              >
                <VRow>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="horometerData.horometer_end_day"
                      type="number"
                      step="0.1"
                      label="Horómetro Final Día"
                      :error-messages="horometerErrors.horometer_end_day"
                      :rules="[rules.required, rules.horometer]"
                    />
                    <div
                      v-if="horometerData.horometer_start_day"
                      class="horometer-info"
                    >
                      <p class="text-caption">
                        Inicial: {{ horometerData.horometer_start_day }}
                        <span v-if="horometerData.horometer_end_day">
                          | Final: {{ horometerData.horometer_end_day }}
                          | Horas: {{ calculateHours(horometerData.horometer_start_day, horometerData.horometer_end_day) }}h
                        </span>
                      </p>
                    </div>
                  </VCol>
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="horometerData.horometer_end_night"
                      type="number"
                      step="0.1"
                      label="Horómetro Final Noche"
                      :error-messages="horometerErrors.horometer_end_night"
                      :rules="[rules.horometer]"
                      :disabled="report.shift === 'day'"
                    />
                    <div
                      v-if="horometerData.horometer_start_night"
                      class="horometer-info"
                    >
                      <p class="text-caption">
                        Inicial: {{ horometerData.horometer_start_night }}
                        <span v-if="horometerData.horometer_end_night">
                          | Final: {{ horometerData.horometer_end_night }}
                          | Horas: {{ calculateHours(horometerData.horometer_start_night, horometerData.horometer_end_night) }}h
                        </span>
                      </p>
                    </div>
                  </VCol>
                </VRow>
              </VForm>
            </VCardText>
          </VCard>
        </VStepperWindowItem>

        <!-- Step 3: Final Summary -->
        <VStepperWindowItem :value="3">
          <VCard>
            <VCardTitle>Resumen Final</VCardTitle>
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VCard
                    variant="outlined"
                    class="mb-4"
                  >
                    <VCardTitle class="text-h6">
                      Totales
                    </VCardTitle>
                    <VCardText>
                      <div class="summary-item">
                        <VIcon
                          icon="tabler-clock"
                          class="me-2"
                        />
                        <span class="summary-label">Total Horas:</span>
                        <span class="summary-value">{{ totalHours }}h</span>
                      </div>
                      <div class="summary-item">
                        <VIcon
                          icon="tabler-ruler"
                          class="me-2"
                        />
                        <span class="summary-label">Metros Perforados:</span>
                        <span class="summary-value">{{ totalMeters }}m</span>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VCard
                    variant="outlined"
                    class="mb-4"
                  >
                    <VCardTitle class="text-h6">
                      Actividades
                    </VCardTitle>
                    <VCardText>
                      <div class="summary-item">
                        <VIcon
                          icon="tabler-settings"
                          class="me-2"
                        />
                        <span class="summary-label">Total Actividades:</span>
                        <span class="summary-value">{{ report.activities?.length || 0 }}</span>
                      </div>
                      <div class="summary-item">
                        <VIcon
                          icon="tabler-package"
                          class="me-2"
                        />
                        <span class="summary-label">Total Consumos:</span>
                        <span class="summary-value">{{ report.consumptions?.length || 0 }}</span>
                      </div>
                      <div class="summary-item">
                        <VIcon
                          icon="tabler-tools"
                          class="me-2"
                        />
                        <span class="summary-label">Total Herramientas:</span>
                        <span class="summary-value">{{ report.tool_assignments?.length || 0 }}</span>
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VStepperWindowItem>

        <!-- Step 4: Sign Report -->
        <VStepperWindowItem :value="4">
          <VCard>
            <VCardTitle>Firmar Reporte</VCardTitle>
            <VCardText>
              <VAlert
                type="info"
                class="mb-4"
              >
                <VIcon
                  icon="tabler-info-circle"
                  class="me-2"
                />
                Por favor, firma el reporte como operador para completarlo.
              </VAlert>

              <DrillingReportSignatureCanvas
                v-model="signatureData"
                :width="400"
                :height="200"
                class="mb-4"
              />

              <VBtn
                color="grey"
                variant="outlined"
                @click="clearSignature"
              >
                <VIcon
                  icon="tabler-eraser"
                  class="me-2"
                />
                Limpiar Firma
              </VBtn>
            </VCardText>
          </VCard>
        </VStepperWindowItem>
      </VStepperWindow>
    </VStepper>

    <!-- Navigation -->
    <div class="stepper-navigation">
      <VBtn
        v-if="currentStep > 1"
        color="grey"
        variant="outlined"
        @click="previousStep"
      >
        <VIcon
          icon="tabler-arrow-left"
          class="me-2"
        />
        Anterior
      </VBtn>

      <VSpacer />

      <VBtn
        v-if="currentStep < 4"
        color="primary"
        :disabled="!canProceed"
        @click="nextStep"
      >
        Siguiente
        <VIcon
          icon="tabler-arrow-right"
          class="ms-2"
        />
      </VBtn>

      <VBtn
        v-if="currentStep === 4"
        color="success"
        :disabled="!canComplete"
        :loading="completing"
        @click="completeReport"
      >
        <VIcon
          icon="tabler-check"
          class="me-2"
        />
        Completar y Firmar
      </VBtn>
    </div>

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
  </div>
</template>

<style scoped>
.drilling-report-complete {
  padding: 20px;
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: 1200px;
}

.complete-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-block-end: 1px solid #e0e0e0;
  margin-block-end: 24px;
  padding-block-end: 16px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.complete-title {
  font-size: 24px;
  font-weight: 600;
  margin-block: 0 4px;
  margin-inline: 0;
}

.complete-subtitle {
  margin: 0;
  color: #666;
}

.verification-item {
  display: flex;
  align-items: center;
  margin-block-end: 8px;
}

.horometer-info {
  padding: 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
  margin-block-start: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  margin-block-end: 8px;
}

.summary-label {
  margin-inline-end: 8px;
  min-inline-size: 120px;
}

.summary-value {
  color: #1976d2;
  font-weight: 500;
}

.stepper-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-block-start: 1px solid #e0e0e0;
  margin-block-start: 24px;
  padding-block-start: 16px;
}

@media (max-width: 768px) {
  .complete-header {
    flex-direction: column;
    gap: 16px;
  }

  .stepper-navigation {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
