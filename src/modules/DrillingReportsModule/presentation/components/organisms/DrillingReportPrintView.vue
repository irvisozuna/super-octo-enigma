<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDrillingReportStore } from '../../stores/drillingReportStore'
import { formatDate, formatDateTime } from '../../../shared/utils/dateUtils'
import { usePrintReport } from '../../composables/usePrintReport'
import { useTenantConfig } from '@/composables/useTenantConfig'

// Props
interface Props {
  reportId: string
  showActions?: boolean
  showWatermark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  showWatermark: false,
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// Composables
const { t } = useI18n()
const drillingReportStore = useDrillingReportStore()
const { menuLogo, appTitle } = useTenantConfig()
const { isExporting, exportProgress, generateQRCode, exportToPDF } = usePrintReport()

// Refs
const printViewRef = ref<HTMLElement | null>(null)
const qrCodeUrl = ref<string>('')

// Helper function to get tool type translation
const getToolTypeLabel = (type: string) => {
  const toolTypeMap: Record<string, string> = {
    drill_bit_pdc: t('DrillingReportsModule.tools.drill_bit_pdc'),
    drill_bit_tricone: t('DrillingReportsModule.tools.drill_bit_tricone'),
    drill_bit_diamond: t('DrillingReportsModule.tools.drill_bit_diamond'),
    casing: t('DrillingReportsModule.tools.casing'),
    drill_pipe: t('DrillingReportsModule.tools.drill_pipe'),
    stabilizer: t('DrillingReportsModule.tools.stabilizer'),
    reamer: t('DrillingReportsModule.tools.reamer'),
    jar: t('DrillingReportsModule.tools.jar'),
    motor: t('DrillingReportsModule.tools.motor'),
    sub: t('DrillingReportsModule.tools.sub'),
    mud: t('DrillingReportsModule.tools.mud'),
    pump: t('DrillingReportsModule.tools.pump'),
  }

  return toolTypeMap[type] || type
}

// Helper function to get activity type translation
const getActivityTypeLabel = (type: string) => {
  const activityTypeMap: Record<string, string> = {
    drilling_core: t('DrillingReportsModule.tools.activityTypes.drilling_core'),
    drilling: t('DrillingReportsModule.tools.activityTypes.drilling'),
    maintenance: t('DrillingReportsModule.tools.activityTypes.maintenance'),
    tool_change: t('DrillingReportsModule.tools.activityTypes.tool_change'),
    break: t('DrillingReportsModule.tools.activityTypes.break'),
    meal: t('DrillingReportsModule.tools.activityTypes.meal'),
    conditioning: t('DrillingReportsModule.tools.activityTypes.conditioning'),
    pulling_tools: t('DrillingReportsModule.tools.activityTypes.pulling_tools'),
    inserting_tools: t('DrillingReportsModule.tools.activityTypes.inserting_tools'),
  }

  return activityTypeMap[type] || type
}

// Helper function to get wear level translation
const getWearLevelLabel = (level: string) => {
  const wearLevelMap: Record<string, string> = {
    new: t('DrillingReportsModule.tools.wearLevels.new'),
    light: t('DrillingReportsModule.tools.wearLevels.light'),
    moderate: t('DrillingReportsModule.tools.wearLevels.moderate'),
    heavy: t('DrillingReportsModule.tools.wearLevels.heavy'),
    severe: t('DrillingReportsModule.tools.wearLevels.severe'),
  }

  return wearLevelMap[level] || level
}

// Helper function to get unit translation
const getUnitLabel = (unit: string) => {
  const unitMap: Record<string, string> = {
    kg: t('DrillingReportsModule.units.kg'),
    bags: t('DrillingReportsModule.units.bags'),
    liters: t('DrillingReportsModule.units.liters'),
    gallons: t('DrillingReportsModule.units.gallons'),
    units: t('DrillingReportsModule.units.units'),
    meters: t('DrillingReportsModule.units.meters'),
    feet: t('DrillingReportsModule.units.feet'),
    inches: t('DrillingReportsModule.units.inches'),
    tons: t('DrillingReportsModule.units.tons'),
    pounds: t('DrillingReportsModule.units.pounds'),
    barrels: t('DrillingReportsModule.units.barrels'),
    cubic_meters: t('DrillingReportsModule.units.cubic_meters'),
    cubic_feet: t('DrillingReportsModule.units.cubic_feet'),
  }

  return unitMap[unit] || unit
}

// State
const loading = ref(false)

// Computed
const report = computed(() => drillingReportStore.currentReport?.data || drillingReportStore.currentReport)

// Computed properties for formatted data
const reportDate = computed(() => {
  if (!report.value?.report_date)
    return ''

  return formatDate(report.value.report_date)
})

const shiftLabel = computed(() => {
  if (!report.value?.shift)
    return ''

  return report.value.shift === 'day' ? 'Día' : 'Noche'
})

const totalHours = computed(() => {
  return report.value?.totals?.hours_worked || 0
})

const totalMeters = computed(() => {
  return report.value?.totals?.meters_drilled || 0
})

const projectInfo = computed(() => ({
  name: report.value?.project?.name || '',
  client: report.value?.project?.client?.name || '',
  location: report.value?.project?.location || '',
  costCenter: report.value?.project?.cost_center || '',
}))

const wellInfo = computed(() => ({
  code: report.value?.well?.code || '',
  name: report.value?.well?.name || '',
  sector: report.value?.well?.sector || '',
  diameter: report.value?.well?.diameter || '',
  inclination: report.value?.well?.inclination || '',
  initialDepth: report.value?.well?.initial_depth || 0,
  finalDepth: report.value?.well?.final_depth || 0,
  targetDepth: report.value?.well?.target_depth || 0,
}))

const equipmentInfo = computed(() => ({
  code: report.value?.equipment?.code || '',
  name: report.value?.equipment?.name || '',
  brand: report.value?.equipment?.brand || '',
  model: report.value?.equipment?.model || '',
  serialNumber: report.value?.equipment?.serial_number || '',
}))

const personnelInfo = computed(() => ({
  dayOperator: report.value?.personnel?.day?.operator?.full_name || '',
  dayHelpers: report.value?.personnel?.day?.helpers?.map(h => h.full_name) || [],
  nightOperator: report.value?.personnel?.night?.operator?.full_name || '',
  nightHelpers: report.value?.personnel?.night?.helpers?.map(h => h.full_name) || [],
}))

const parametersInfo = computed(() => ({
  pullDown: report.value?.parameters?.pull_down || 0,
  rpmPullDown: report.value?.parameters?.rpm_pull_down || 0,
  rpmRotation: report.value?.parameters?.rpm_rotation || 0,
}))

const horometerInfo = computed(() => ({
  dayStart: report.value?.horometer?.day?.start || 0,
  dayEnd: report.value?.horometer?.day?.end || 0,
  dayHours: report.value?.horometer?.day?.hours_worked || 0,
  nightStart: report.value?.horometer?.night?.start || 0,
  nightEnd: report.value?.horometer?.night?.end || 0,
  nightHours: report.value?.horometer?.night?.hours_worked || 0,
}))

// Methods
const loadReport = async () => {
  loading.value = true
  try {
    console.log('Loading report with ID:', props.reportId)

    const result = await drillingReportStore.fetchReportById(props.reportId)

    console.log('Report loaded:', result)
    console.log('Current report in store:', drillingReportStore.currentReport)
  }
  catch (error) {
    console.error('Error loading report:', error)
  }
  finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('close')
}

const handlePrint = () => {
  window.print()
}

const handleExportPDF = async () => {
  if (!printViewRef.value || !report.value) {
    console.error('Print view ref or report not available')

    return
  }

  try {
    const filename = `Reporte_${report.value.report_number}_${formatDate(report.value.report_date)}.pdf`

    await exportToPDF(printViewRef.value, {
      filename,
      reportNumber: report.value.report_number,
      reportDate: formatDate(report.value.report_date),
      projectName: projectInfo.value.name,
      wellCode: wellInfo.value.code,
      reportUrl: window.location.href,
    })
  }
  catch (error) {
    console.error('Error exporting PDF:', error)
    alert('Error al exportar el PDF. Por favor, intente nuevamente.')
  }
}

// Generar QR code para el reporte
const generateReportQR = async () => {
  const reportUrl = `${window.location.origin}/drilling-reports/${props.reportId}`

  qrCodeUrl.value = await generateQRCode(reportUrl)
}

// Lifecycle
onMounted(() => {
  loadReport()
  generateReportQR()
})

// Watch for report changes
watch(() => report.value, newReport => {
  console.log('Report changed:', newReport)
  if (newReport) {
    console.log('Report data structure:', {
      id: newReport.id,
      report_number: newReport.report_number,
      project: newReport.project,
      well: newReport.well,
      equipment: newReport.equipment,
      personnel: newReport.personnel,
      parameters: newReport.parameters,
      horometer: newReport.horometer,
      drilling_details: newReport.drilling_details,
      activities: newReport.activities,
      consumptions: newReport.consumptions,
      tool_assignments: newReport.tool_assignments,
      totals: newReport.totals,
      signatures: newReport.signatures,
    })
  }
}, { immediate: true })
</script>

<template>
  <div class="drilling-report-print-view">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="loading-container"
    >
      <VProgressCircular indeterminate />
      <p>Cargando reporte...</p>
    </div>

    <!-- PDF Export Progress -->
    <div
      v-if="isExporting"
      class="export-overlay"
    >
      <div class="export-card">
        <VProgressCircular
          :model-value="exportProgress"
          :size="80"
          :width="8"
          color="success"
        >
          {{ exportProgress }}%
        </VProgressCircular>
        <p class="export-text">
          Generando PDF profesional...
        </p>
        <p class="export-subtext">
          Por favor espere
        </p>
      </div>
    </div>

    <!-- Report Content -->
    <div
      v-else-if="report"
      class="report-content"
    >
      <div
        v-if="showActions"
        class="actions-bar no-print"
      >
        <VBtn
          color="primary"
          variant="outlined"
          :disabled="isExporting"
          @click="handlePrint"
        >
          <VIcon
            icon="tabler-printer"
            class="me-2"
          />
          Imprimir
        </VBtn>
        <VBtn
          color="success"
          variant="outlined"
          :loading="isExporting"
          :disabled="isExporting"
          @click="handleExportPDF"
        >
          <VIcon
            icon="tabler-file-pdf"
            class="me-2"
          />
          Exportar PDF
        </VBtn>
        <VBtn
          color="grey"
          variant="outlined"
          :disabled="isExporting"
          @click="handleClose"
        >
          <VIcon
            icon="tabler-x"
            class="me-2"
          />
          Cerrar
        </VBtn>
      </div>

      <!-- Printable Document -->
      <div
        ref="printViewRef"
        class="print-document"
      >
        <!-- Watermark (opcional) -->
        <div
          v-if="showWatermark"
          class="watermark no-print"
        >
          CONFIDENCIAL
        </div>

        <!-- Report Header -->
        <div class="report-header page-header">
          <div class="company-logo">
            <img
              v-if="menuLogo"
              :src="menuLogo"
              alt="Logo"
              class="logo-image"
            >
            <div
              v-else
              class="logo-text"
            >
              <div class="logo-main">
                {{ appTitle }}
              </div>
              <div class="logo-sub">
                -DRILLING-
              </div>
            </div>
          </div>
          <div class="report-title">
            <h1>REPORTE DE PERFORACIÓN DIAMANTINA</h1>
          </div>
          <div class="report-info">
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">{{ reportDate }}</span>
            </div>
            <div class="info-row">
              <span class="label">Turno:</span>
              <span class="value">{{ shiftLabel }}</span>
            </div>
            <div class="info-row">
              <span class="label">Hrs. Trabajadas:</span>
              <span class="value">{{ totalHours }}</span>
            </div>
            <div class="info-row">
              <span class="label">No.:</span>
              <span class="value">{{ report.report_number }}</span>
            </div>
          </div>
        </div>

        <!-- ROW 1: Secciones Compactas (3 columnas) -->
        <div class="compact-row">
          <!-- Antecedentes de Faena -->
          <div class="section compact-section">
            <h3>ANTECEDENTES DE FAENA</h3>
            <div class="info-table">
              <div class="info-row">
                <span class="label">Faena / C. Costo:</span>
                <span class="value">{{ projectInfo.name }} / {{ projectInfo.costCenter }}</span>
              </div>
              <div class="info-row">
                <span class="label">Lugar:</span>
                <span class="value">{{ projectInfo.location }}</span>
              </div>
              <div class="info-row">
                <span class="label">Equipo:</span>
                <span class="value">{{ equipmentInfo.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">Operador:</span>
                <span class="value">{{ personnelInfo.dayOperator }}</span>
              </div>
              <div class="info-row">
                <span class="label">Ayudante:</span>
                <span class="value">{{ personnelInfo.dayHelpers[0] || '' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Ayudante:</span>
                <span class="value">{{ personnelInfo.dayHelpers[1] || '' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Otro:</span>
                <span class="value">{{ personnelInfo.dayHelpers[2] || '' }}</span>
              </div>
            </div>
          </div>

          <!-- Antecedentes del Pozo -->
          <div class="section compact-section">
            <h3>ANTECEDENTES DEL POZO</h3>
            <div class="info-table">
              <div class="info-row">
                <span class="label">Pozo No.:</span>
                <span class="value">{{ wellInfo.code }}</span>
              </div>
              <div class="info-row">
                <span class="label">Sector:</span>
                <span class="value">{{ wellInfo.sector }}</span>
              </div>
              <div class="info-row">
                <span class="label">Diámetro:</span>
                <span class="value">{{ wellInfo.diameter }}</span>
              </div>
              <div class="info-row">
                <span class="label">Inclinación:</span>
                <span class="value">{{ wellInfo.inclination }}</span>
              </div>
              <div class="info-row">
                <span class="label">Prof. Inicial:</span>
                <span class="value">{{ wellInfo.initialDepth }}</span>
              </div>
              <div class="info-row">
                <span class="label">Prof. Final:</span>
                <span class="value">{{ wellInfo.finalDepth }}</span>
              </div>
              <div class="info-row">
                <span class="label">Mts. Perforados:</span>
                <span class="value">{{ totalMeters }}</span>
              </div>
            </div>
          </div>

          <!-- Parámetros -->
          <div class="section compact-section">
            <h3>PARAMETROS</h3>
            <div class="info-table">
              <div class="info-row">
                <span class="label">Pull Down:</span>
                <span class="value">{{ parametersInfo.pullDown }}</span>
              </div>
              <div class="info-row">
                <span class="label">RPM:</span>
                <span class="value">{{ parametersInfo.rpmPullDown }}</span>
              </div>
              <div class="info-row">
                <span class="label">HOROMETRO:</span>
                <span class="value" />
              </div>
              <div class="info-row">
                <span class="label">Inicial:</span>
                <span class="value">{{ horometerInfo.dayStart }}</span>
              </div>
              <div class="info-row">
                <span class="label">Final:</span>
                <span class="value">{{ horometerInfo.dayEnd }}</span>
              </div>
              <div class="info-row">
                <span class="label">Total Hrs.:</span>
                <span class="value">{{ totalHours }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ROW 2: Perforación + Herramientas (2 columnas) -->
        <div class="main-row">
          <!-- Tabla de Perforación -->
          <div class="section wide-section">
            <h3>PERFORACION</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Mts. Perf.</th>
                    <th>Recuper.</th>
                    <th>Tipo Roca</th>
                    <th>Dureza</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="detail in report.drilling_details"
                    :key="detail.depth_from"
                  >
                    <td>{{ detail.depth_from }}</td>
                    <td>{{ detail.depth_to }}</td>
                    <td>{{ detail.meters_drilled }}</td>
                    <td>{{ detail.recovery || '' }}</td>
                    <td>{{ detail.rock_type || '' }}</td>
                    <td>{{ detail.hardness || '' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Herramientas Utilizadas -->
          <div class="section wide-section">
            <h3>HERRAMIENTAS UTILIZADAS</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>No. Serie</th>
                    <th>Marca</th>
                    <th>Core Size</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Mts. Perf.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="detail in report.drilling_details"
                    :key="detail.depth_from"
                  >
                    <td>{{ getToolTypeLabel(detail.tool?.type || '') }}</td>
                    <td>{{ detail.tool?.serial_number || '' }}</td>
                    <td>{{ detail.tool?.brand || '' }}</td>
                    <td>{{ detail.tool?.core_size || '' }}</td>
                    <td>{{ detail.depth_from }}</td>
                    <td>{{ detail.depth_to }}</td>
                    <td>{{ detail.meters_drilled }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ROW 3: Rebaje + Consumos (2 columnas) -->
        <div class="secondary-row">
          <!-- Rebaje de Herramientas -->
          <div class="section medium-section">
            <h3>REBAJE DE HERRAMIENTAS DE PERFORACIÓN</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Acero</th>
                    <th>No. Serie</th>
                    <th>Patrón de Desgaste</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="detail in report.drilling_details"
                    :key="detail.depth_from"
                  >
                    <td>{{ getToolTypeLabel(detail.tool?.type || '') }}</td>
                    <td>{{ detail.tool?.serial_number || '' }}</td>
                    <td>{{ getWearLevelLabel(detail.wear_level_after || '') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Consumos -->
          <div class="section medium-section">
            <h3>CONSUMOS</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unid.</th>
                    <th>Envase</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="consumption in report.consumptions"
                    :key="consumption.id"
                  >
                    <td>{{ consumption.type_label || consumption.type }}</td>
                    <td>{{ consumption.quantity }}</td>
                    <td>{{ getUnitLabel(consumption.unit) }}</td>
                  </tr>
                  <!-- Mostrar filas vacías si no hay consumos suficientes -->
                  <tr
                    v-for="n in Math.max(0, 4 - (report.consumptions?.length || 0))"
                    :key="`empty-${n}`"
                  >
                    <td />
                    <td />
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ROW 4: Período en Horas (Full width) -->
        <div class="full-row">
          <div class="section full-section">
            <h3>PERIODO EN HORAS</h3>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>DESCRIPCIÓN DE ACTIVIDADES REALIZADAS</th>
                    <th colspan="2">
                      HRS. CARGO
                    </th>
                  </tr>
                  <tr>
                    <th />
                    <th />
                    <th />
                    <th>CDK</th>
                    <th>CLIENTE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="activity in report.activities"
                    :key="activity.id"
                  >
                    <td>{{ activity.start_time || '' }}</td>
                    <td>{{ activity.end_time || '' }}</td>
                    <td>{{ getActivityTypeLabel(activity.type) }} {{ activity.description ? `- ${activity.description}` : '' }}</td>
                    <td>{{ activity.hours || '' }}</td>
                    <td />
                  </tr>
                  <tr class="total-row">
                    <td colspan="3">
                      <strong>TOTAL:</strong>
                    </td>
                    <td><strong>{{ totalHours }}</strong></td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Nota -->
        <div class="note-section">
          <p><strong>NOTA:</strong> Anotar siempre los tiempos ocupados en cada maniobra o actividad distinta realizada. Ejemplo: Movimiento de Herramientas, desarme de sonda, perforación, colación, etc.</p>
        </div>

        <!-- Signatures Section -->
        <div class="signatures-section">
          <div class="signature-box">
            <div class="signature-label">
              Firma Operador
            </div>
            <div class="signature-space">
              <div
                v-if="report.signatures?.find(s => s.signature_type === 'operator')"
                class="signature-content"
              >
                <img
                  :src="report.signatures.find(s => s.signature_type === 'operator')?.signature_data"
                  alt="Firma Operador"
                >
              </div>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-label">
              Vo. Bo. SUPERVISION CDK
            </div>
            <div class="signature-space">
              <div
                v-if="report.signatures?.find(s => s.signature_type === 'supervisor')"
                class="signature-content"
              >
                <img
                  :src="report.signatures.find(s => s.signature_type === 'supervisor')?.signature_data"
                  alt="Firma Supervisor"
                >
              </div>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-label">
              CLIENTE
            </div>
            <div class="signature-space">
              <div
                v-if="report.signatures?.find(s => s.signature_type === 'client')"
                class="signature-content"
              >
                <img
                  :src="report.signatures.find(s => s.signature_type === 'client')?.signature_data"
                  alt="Firma Cliente"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Observations -->
        <div
          v-if="report.observations"
          class="observations-section"
        >
          <h3>OBSERVACIONES</h3>
          <p>{{ report.observations }}</p>
        </div>

        <!-- Footer Enterprise -->
        <div class="enterprise-footer no-page-break">
          <div class="footer-content">
            <div class="footer-left">
              <p class="footer-title">
                <strong>{{ appTitle }}</strong>
              </p>
              <p class="footer-disclaimer">
                Este documento es confidencial y está destinado exclusivamente para uso interno.
                La reproducción total o parcial requiere autorización previa por escrito.
              </p>
              <p class="footer-meta">
                <strong>Reporte No.:</strong> {{ report.report_number }} |
                <strong>Versión:</strong> 1.0 |
                <strong>Fecha Reporte:</strong> {{ reportDate }}
              </p>
            </div>
            <div
              v-if="qrCodeUrl"
              class="footer-right"
            >
              <div class="qr-section">
                <img
                  :src="qrCodeUrl"
                  alt="QR Code"
                  class="qr-code"
                >
                <p class="qr-label">
                  Escanea para ver online
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else
      class="error-container"
    >
      <VIcon
        icon="tabler-alert-circle"
        size="48"
        color="error"
      />
      <p>Error al cargar el reporte</p>
      <VBtn @click="loadReport">
        Reintentar
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   DRILLING REPORT PRINT VIEW - ENTERPRISE GRADE
   Optimizado para impresión en papel carta (8.5" x 11")
   Tipografía profesional en puntos (pt)
   WCAG AAA compliance para B/W printing
   ============================================ */

/* === BASE STYLES === */
.drilling-report-print-view {
  overflow: auto;
  background: #f5f5f5;
  block-size: 100%;
  color: #000;
  font-family: 'Roboto', 'Arial', 'Helvetica', sans-serif;
  line-height: 1.6;
}

/* === LOADING & ERROR STATES === */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
}

/* === EXPORT OVERLAY === */
.export-overlay {
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 100%;
  block-size: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.export-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.export-text {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.export-subtext {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* === ACTIONS BAR === */
.actions-bar {
  display: flex;
  padding: 16px;
  border-block-end: 1px solid #e0e0e0;
  gap: 12px;
  margin-block-end: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* === REPORT CONTENT CONTAINER === */
.report-content {
  padding: 20px;
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: 1200px;
}

/* === PRINT DOCUMENT - LETTER SIZE (8.5" x 11") === */
.print-document {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-block: 0;
  margin-inline: auto;
  padding: 30px; /* Padding más pequeño para más espacio */
  position: relative;

  /* Letter size: 8.5" x 11" = 816px x 1056px at 96dpi */
  /* Aumentamos ancho para pantalla, se ajustará en print */
  inline-size: 100%;
  max-inline-size: 1100px;
  min-block-size: auto;
}

/* === WATERMARK === */
.watermark {
  position: fixed;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 120px;
  font-weight: 900;
  color: rgba(220, 53, 69, 0.08);
  letter-spacing: 20px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1;
  user-select: none;
}

/* === HEADER STYLES - LIMPIO Y PROFESIONAL === */
.report-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-block-end: 2px solid #333; /* Más sutil */
  margin-block-end: 18px;
  padding-block-end: 14px;
  position: relative;
  z-index: 2;
}

.company-logo {
  flex: 0 0 150px;
}

.logo-image {
  max-block-size: 50px;
  max-inline-size: 130px;
  object-fit: contain;
  filter: contrast(1.1);
}

.logo-text {
  text-align: center;
}

.logo-main {
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  color: #000;
}

.logo-sub {
  font-size: 10px;
  font-weight: 700;
  margin-block-start: 3px;
  letter-spacing: 1.5px;
  color: #333;
}

.report-title {
  flex: 1;
  text-align: center;
}

.report-title h1 {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  color: #000;
  letter-spacing: 0.8px;
  line-height: 1.2;
}

.report-info {
  flex: 0 0 150px;
  text-align: end;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-block-end: 4px;
  font-size: 9px;
  line-height: 1.3;
}

.info-row .label {
  font-weight: 700;
  margin-inline-end: 6px;
  color: #000;
}

.info-row .value {
  color: #333;
  font-weight: 400;
}

/* === NUEVO SISTEMA DE LAYOUT POR FILAS === */

/* ROW 1: 3 Secciones Compactas */
.compact-row {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr 1fr;
  margin-block-end: 14px;
}

.compact-section {
  /* Secciones compactas de información */
}

/* ROW 2: 2 Tablas Principales */
.main-row {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  margin-block-end: 14px;
}

.wide-section {
  /* Secciones anchas para tablas importantes */
}

/* ROW 3: 2 Tablas Secundarias */
.secondary-row {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  margin-block-end: 14px;
}

.medium-section {
  /* Secciones medianas */
}

/* ROW 4: Full Width */
.full-row {
  margin-block-end: 14px;
}

.full-section {
  /* Sección de ancho completo */
}

/* === SECTION STYLES - LIMPIO Y PROFESIONAL === */
.section {
  padding: 12px;
  border: 1px solid #333; /* Bordes más sutiles */
  background: white;
  break-inside: avoid;
  page-break-inside: avoid;
}

.section h3 {
  border-block-end: 1.5px solid #333; /* Más sutil */
  font-size: 12px; /* MÁS GRANDE */
  font-weight: 900;
  margin-block: 0 10px;
  margin-inline: 0;
  padding-block-end: 8px;
  text-align: center;
  text-transform: uppercase;
  color: #000;
  letter-spacing: 0.5px;
}

.sub-section {
  margin-block-end: 12pt;
}

.sub-section h4 {
  font-size: 10pt;
  font-weight: 700;
  margin-block: 0 6pt;
  margin-inline: 0;
  text-transform: uppercase;
  color: #000;
}

/* === INFO TABLE STYLES - LETRA GRANDE === */
.info-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-table .info-row {
  display: flex;
  justify-content: space-between;
  padding-block: 4px;
  padding-inline: 0;
  font-size: 11px; /* MUCHO MÁS GRANDE */
  line-height: 1.5;
}

.info-table .label {
  font-weight: 700;
  min-inline-size: 100px;
  color: #000;
  font-size: 10px; /* MÁS GRANDE */
}

.info-table .value {
  flex: 1;
  text-align: end;
  color: #1a1a1a;
  font-weight: 400;
  font-size: 10px; /* MÁS GRANDE */
}

/* === DATA TABLE STYLES - LETRA GRANDE Y LIMPIA === */
.table-container {
  overflow-x: auto;
  break-inside: avoid;
  page-break-inside: avoid;
}

.data-table {
  border-collapse: collapse;
  font-size: 10px; /* MUCHO MÁS GRANDE */
  inline-size: 100%;
  table-layout: auto;
}

.data-table th,
.data-table td {
  border: 0.5px solid #666; /* Bordes sutiles */
  padding-block: 6px; /* MÁS padding */
  padding-inline: 8px;
  text-align: center;
  vertical-align: middle;
}

.data-table th {
  background-color: #f5f5f5; /* Sutil */
  font-size: 10px; /* MÁS GRANDE */
  font-weight: 900;
  text-transform: uppercase;
  color: #000;
  letter-spacing: 0.3px;
  break-after: avoid;
  page-break-after: avoid;
  line-height: 1.4;
}

.data-table td {
  font-size: 10px; /* MÁS GRANDE */
  color: #1a1a1a;
  line-height: 1.5;
}

/* ZEBRA STRIPING - MÁS SUTIL */
.data-table tbody tr:nth-child(odd) {
  background-color: #ffffff;
}

.data-table tbody tr:nth-child(even) {
  background-color: #fafafa; /* Más sutil que #f5f5f5 */
}

.data-table .total-row {
  background-color: #e8e8e8 !important; /* Más claro */
  font-weight: 900;
  border-block-start: 1.5px solid #333 !important; /* Más sutil */
}

/* === NOTE SECTION === */
.note-section {
  padding: 10pt;
  border: 1.5px solid #666;
  background-color: #fafafa;
  margin-block-start: 12pt;
  break-inside: avoid;
  page-break-inside: avoid;
}

.note-section p {
  margin: 0;
  font-size: 8pt;
  font-style: italic;
  color: #333;
  line-height: 1.5;
}

.note {
  font-size: 8pt;
  font-weight: 700;
  margin-block-start: 6pt;
  text-align: center;
  color: #000;
}

/* === SIGNATURES SECTION === */
.signatures-section {
  display: grid;
  border-block-start: 1.5px solid #333; /* Más sutil */
  gap: 16px;
  grid-template-columns: 1fr 1fr 1fr;
  margin-block-start: 20px;
  padding-block-start: 16px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.signature-box {
  text-align: center;
}

.signature-label {
  font-size: 9px;
  font-weight: 900;
  margin-block-end: 8px;
  text-transform: uppercase;
  color: #000;
  letter-spacing: 0.5px;
}

.signature-space {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #666; /* Más sutil */
  block-size: 80px;
  background: white;
}

.signature-content img {
  max-block-size: 100%;
  max-inline-size: 100%;
  object-fit: contain;
}

/* === OBSERVATIONS SECTION === */
.observations-section {
  padding: 12px;
  border: 1px solid #333; /* Más sutil */
  margin-block-start: 16px;
  background: white;
  break-inside: avoid;
  page-break-inside: avoid;
}

.observations-section h3 {
  font-size: 11px;
  font-weight: 900;
  margin-block: 0 8px;
  margin-inline: 0;
  text-transform: uppercase;
  color: #000;
  letter-spacing: 0.5px;
}

.observations-section p {
  margin: 0;
  font-size: 9px;
  color: #1a1a1a;
  line-height: 1.6;
}

/* === ENTERPRISE FOOTER === */
.enterprise-footer {
  margin-block-start: 20px;
  padding-block-start: 16px;
  border-block-start: 1.5px solid #333; /* Más sutil */
  break-inside: avoid;
  page-break-inside: avoid;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16pt;
}

.footer-left {
  flex: 1;
}

.footer-title {
  margin: 0 0 6pt 0;
  font-size: 11pt;
  font-weight: 900;
  color: #000;
}

.footer-disclaimer {
  margin: 0 0 8pt 0;
  font-size: 7pt;
  color: #555;
  line-height: 1.5;
  font-style: italic;
}

.footer-meta {
  margin: 0;
  font-size: 7pt;
  color: #333;
  line-height: 1.4;
}

.footer-right {
  flex: 0 0 auto;
}

.qr-section {
  text-align: center;
}

.qr-code {
  inline-size: 80px;
  block-size: 80px;
  border: 2px solid #000;
  padding: 4pt;
  background: white;
}

.qr-label {
  margin: 4pt 0 0 0;
  font-size: 7pt;
  color: #666;
  font-weight: 600;
}

/* ============================================
   PRINT STYLES - ENTERPRISE GRADE
   @page rules + Letter size optimization
   ============================================ */

/* NO PRINT ELEMENTS */
.no-print {
  display: block;
}

.no-page-break {
  break-inside: avoid;
  page-break-inside: avoid;
}

@media print {
  /* === @PAGE CONFIGURATION - LETTER SIZE === */
  @page {
    size: letter portrait; /* 8.5" x 11" */
    margin: 0.3in; /* Márgenes uniformes */
  }

  /* === HIDE SCREEN-ONLY ELEMENTS === */
  .no-print,
  .actions-bar,
  .export-overlay,
  .watermark {
    display: none !important;
  }

  /* === BASE ADJUSTMENTS === */
  .drilling-report-print-view {
    background: white;
    overflow: visible;
  }

  .report-content {
    padding: 0;
    margin: 0;
    max-inline-size: none;
  }

  .print-document {
    box-shadow: none;
    inline-size: 100%;
    padding: 0.2in;
    margin: 0;
    max-inline-size: none;
  }

  /* === NUEVO LAYOUT PRINT === */
  .compact-row {
    gap: 10px;
    grid-template-columns: 1fr 1fr 1fr;
  }

  .main-row,
  .secondary-row {
    gap: 10px;
    grid-template-columns: 1fr 1fr;
  }

  /* === TYPOGRAPHY OPTIMIZATION === */
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* === LOGO ADJUSTMENTS === */
  .logo-image {
    max-block-size: 50px;
    max-inline-size: 130px;
  }

  .logo-main {
    font-size: 28pt;
  }

  .logo-sub {
    font-size: 10pt;
  }

  /* === SECTIONS === */
  .section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* === TABLES - ENSURE HEADERS REPEAT === */
  .table-container {
    break-inside: auto;
  }

  .data-table {
    break-inside: auto;
  }

  .data-table thead {
    display: table-header-group;
  }

  .data-table tbody {
    display: table-row-group;
  }

  .data-table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* === SIGNATURES & FOOTER === */
  .signatures-section,
  .observations-section,
  .enterprise-footer {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* === COLOR PRESERVATION - MÁS SUTIL === */
  .data-table tbody tr:nth-child(even) {
    background-color: #fafafa !important; /* Más sutil */
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .data-table th {
    background-color: #f0f0f0 !important; /* Más claro */
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .data-table .total-row {
    background-color: #e8e8e8 !important; /* Más claro */
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* === BORDES MÁS SUTILES EN PRINT === */
  .section {
    border-color: #666 !important;
  }

  .data-table th,
  .data-table td {
    border-color: #999 !important;
  }

  /* === PAGE BREAKS === */
  .page-break-before {
    break-before: page;
    page-break-before: always;
  }

  .page-break-after {
    break-after: page;
    page-break-after: always;
  }

  /* === ORPHANS & WIDOWS === */
  p, h1, h2, h3, h4, h5, h6 {
    orphans: 3;
    widows: 3;
  }

  /* === QR CODE & FOOTER ADJUSTMENTS === */
  .qr-code {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}

/* ============================================
   RESPONSIVE DESIGN - MOBILE & TABLET
   ============================================ */

@media (max-width: 1024px) {
  .print-document {
    inline-size: 100%;
    padding: 20px;
  }

  .report-grid {
    gap: 12pt;
    grid-template-columns: 1fr;
  }

  .report-header {
    flex-direction: column;
    gap: 12pt;
    text-align: center;
  }

  .company-logo,
  .report-info {
    flex: none;
  }

  .report-info {
    text-align: center;
  }

  .signatures-section {
    gap: 12pt;
    grid-template-columns: 1fr;
  }

  .footer-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .report-content {
    padding: 10px;
  }

  .print-document {
    padding: 16px;
  }

  .logo-main {
    font-size: 24pt;
  }

  .report-title h1 {
    font-size: 14pt;
  }

  .data-table {
    font-size: 8pt;
  }

  .data-table th,
  .data-table td {
    padding-block: 4pt;
    padding-inline: 6pt;
  }

  .actions-bar {
    flex-wrap: wrap;
    gap: 8px;
  }

  .section {
    padding: 8pt;
  }
}

@media (max-width: 480px) {
  .print-document {
    padding: 12px;
  }

  .logo-main {
    font-size: 20pt;
  }

  .report-title h1 {
    font-size: 12pt;
  }

  .data-table {
    font-size: 7pt;
  }

  .info-row {
    font-size: 8pt;
  }
}
</style>
