<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDrillingReportStore } from '../../stores/drillingReportStore'
import { ACTIVITY_TYPES } from '../../../shared/constants/ProjectConstants'
import { formatDate } from '../../../shared/utils/dateUtils'
import { formatWellDiameter } from '../../../shared/utils/WellUtils'
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
  const activity = ACTIVITY_TYPES.find(a => a.value === type)

  return activity?.title || type
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

const wellInfo = computed(() => {
  const diameter = report.value?.well?.diameter

  return {
    code: report.value?.well?.code || '',
    name: report.value?.well?.name || '',
    sector: report.value?.well?.sector || '',
    diameter: diameter ? formatWellDiameter(diameter) : '',
    inclination: report.value?.well?.inclination || '',
    initialDepth: report.value?.well?.initial_depth || 0,
    finalDepth: report.value?.well?.final_depth || 0,
    targetDepth: report.value?.well?.target_depth || 0,
  }
})

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

// Keyboard shortcut para imprimir (Ctrl+P / Cmd+P)
const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
    event.preventDefault()
    handlePrint()
  }
}

// Lifecycle
onMounted(() => {
  loadReport()
  generateReportQR()

  // Agregar listener para Ctrl+P / Cmd+P
  window.addEventListener('keydown', handleKeydown)
})

// Cleanup
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
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
        <div class="actions-left">
          <VBtn
            color="success"
            variant="flat"
            :loading="isExporting"
            :disabled="isExporting"
            @click="handleExportPDF"
          >
            <VIcon
              icon="tabler-file-download"
              class="me-2"
            />
            Exportar PDF
          </VBtn>
        </div>
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

        <!-- ROW 1: Antecedentes Consolidados (2 columnas) -->
        <div class="info-row-dual">
          <!-- Proyecto, Equipo & Personal -->
          <div class="section-clean info-section">
            <h3>PROYECTO, EQUIPO & PERSONAL</h3>
            <div class="info-grid-compact">
              <div class="info-row">
                <span class="label">Faena:</span>
                <span class="value">{{ projectInfo.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">C. Costo:</span>
                <span class="value">{{ projectInfo.costCenter }}</span>
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
                <span class="label">Ayudante 1:</span>
                <span class="value">{{ personnelInfo.dayHelpers[0] || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Ayudante 2:</span>
                <span class="value">{{ personnelInfo.dayHelpers[1] || '-' }}</span>
              </div>
              <div
                v-if="personnelInfo.dayHelpers[2]"
                class="info-row"
              >
                <span class="label">Otro:</span>
                <span class="value">{{ personnelInfo.dayHelpers[2] }}</span>
              </div>
            </div>
          </div>

          <!-- Pozo, Parámetros & Horómetro -->
          <div class="section-clean info-section">
            <h3>POZO, PARÁMETROS & HORÓMETRO</h3>
            <div class="info-grid-compact">
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
                <span class="value">{{ wellInfo.initialDepth }} m</span>
              </div>
              <div class="info-row">
                <span class="label">Prof. Final:</span>
                <span class="value">{{ wellInfo.finalDepth }} m</span>
              </div>
              <div class="info-row">
                <span class="label">Mts. Perf.:</span>
                <span class="value font-bold">{{ totalMeters }} m</span>
              </div>
              <div class="info-row">
                <span class="label">Pull Down:</span>
                <span class="value">{{ parametersInfo.pullDown }}</span>
              </div>
              <div class="info-row">
                <span class="label">RPM:</span>
                <span class="value">{{ parametersInfo.rpmPullDown }}</span>
              </div>
              <div class="info-row">
                <span class="label">Horómetro Inicial:</span>
                <span class="value">{{ horometerInfo.dayStart }} hrs</span>
              </div>
              <div class="info-row">
                <span class="label">Horómetro Final:</span>
                <span class="value">{{ horometerInfo.dayEnd }} hrs</span>
              </div>
              <div class="info-row">
                <span class="label">Total Hrs.:</span>
                <span class="value font-bold">{{ totalHours }} hrs</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ROW 2: Perforación (Full width) -->
        <div class="full-row">
          <div class="section full-section">
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
        </div>

        <!-- ROW 3: Herramientas Utilizadas (Full width) -->
        <div class="full-row">
          <div class="section full-section">
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

        <!-- ROW 4: Rebaje + Consumos (2 columnas) -->
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

        <!-- ROW 5: Período en Horas (Full width) -->
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
   DRILLING REPORT PRINT VIEW - MODERN ENTERPRISE 2025
   Optimizado para impresión en papel carta (8.5" x 11")
   Tipografía profesional mejorada con mejor legibilidad
   WCAG AAA compliance + Diseño moderno
   Colores dinámicos usando tema Vuetify (primary/secondary)
   ============================================ */

/* === BASE STYLES === */
.drilling-report-print-view {
  overflow: auto;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  block-size: 100%;
  color: #212529;
  font-family: Inter, Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  letter-spacing: 0.01em;
  line-height: 1.75;
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
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 80%);
  block-size: 100%;
  inline-size: 100%;
  inset-block-start: 0;
  inset-inline-start: 0;
}

.export-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 30%);
  gap: 16px;
  text-align: center;
}

.export-text {
  margin: 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 600;
}

.export-subtext {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* === ACTIONS BAR - ESTILO MODAL CONSISTENTE === */
.actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgb(var(--v-theme-surface));
  border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-block-end: 20px;
  padding-block: 16px;
  padding-inline: 24px;
}

.actions-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
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
  position: relative;
  padding: 32px; /* Reducido para ahorrar espacio */
  border-radius: 8px;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 12%), 0 2px 8px rgba(0, 0, 0, 8%);

  /* Letter size: 8.5" x 11" = 816px x 1056px at 96dpi */
  inline-size: 100%;
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: 1100px;
  min-block-size: auto;
}

/* === WATERMARK === */
.watermark {
  position: fixed;
  z-index: 1;
  color: rgba(220, 53, 69, 8%);
  font-size: 120px;
  font-weight: 900;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  letter-spacing: 20px;
  pointer-events: none;
  transform: translate(-50%, -50%) rotate(-45deg);
  user-select: none;
  white-space: nowrap;
}

/* === HEADER STYLES - MODERNO CON COLOR DINÁMICO === */
.report-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.06) 0%, rgba(var(--v-theme-secondary), 0.03) 100%);
  border-block-end: 3px solid rgb(var(--v-theme-primary));
  box-shadow: none; /* Sin sombra para ahorrar tinta */
  margin-block-end: 16px;
  padding-block: 14px;
  padding-inline: 16px;
}

.company-logo {
  flex: 0 0 150px;
}

.logo-image {
  filter: contrast(1.1);
  max-block-size: 50px;
  max-inline-size: 130px;
  object-fit: contain;
}

.logo-text {
  text-align: center;
}

.logo-main {
  color: #000;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.logo-sub {
  color: #333;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-block-start: 3px;
}

.report-title {
  flex: 1;
  text-align: center;
}

.report-title h1 {
  margin: 0;
  color: rgb(var(--v-theme-primary));
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 1.2px;
  line-height: 1.3;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 8%);
  text-transform: uppercase;
}

.report-info {
  flex: 0 0 150px;
  text-align: end;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  line-height: 1.5;
  margin-block-end: 6px;
  padding-block: 2px;
  padding-inline: 0;
}

.info-row .label {
  color: rgb(var(--v-theme-primary));
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin-inline-end: 8px;
  text-transform: uppercase;
}

.info-row .value {
  color: #1a1a1a;
  font-size: 11px;
  font-weight: 600;
}

/* === NUEVO SISTEMA DE LAYOUT POR FILAS === */

/* ROW 1: Layout Dual (2 columnas) para Antecedentes Consolidados */
.info-row-dual {
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
  margin-block-end: 14px;
}

.info-section {
  /* Secciones de información dual */
}

/* Sección limpia SIN bordes exteriores - Más moderno */
.section-clean {
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  break-inside: avoid;
  page-break-inside: avoid;
}

.section-clean:hover {
  box-shadow: none;
  border: none;
}

.section-clean h3 {
  background: linear-gradient(90deg, rgba(var(--v-theme-primary), 0.08) 0%, transparent 100%);
  border-block-end: 2px solid rgb(var(--v-theme-primary));
  border-radius: 3px;
  font-size: 10px;
  font-weight: 800;
  margin-block: 0 10px;
  margin-inline: 0;
  padding: 8px 10px;
  text-align: start;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
  letter-spacing: 0.5px;
}

/* Grid compacto para info */
.info-grid-compact {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-grid-compact .info-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 8px;
  background: linear-gradient(90deg, rgba(var(--v-theme-secondary), 0.02) 0%, transparent 100%);
  border-radius: 3px;
  font-size: 10px;
  line-height: 1.5;
  transition: all 0.2s ease;
  border-inline-start: 2px solid transparent;
}

.info-grid-compact .info-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
  border-inline-start-color: rgb(var(--v-theme-primary));
}

.info-grid-compact .label {
  font-weight: 700;
  min-inline-size: 110px;
  color: rgb(var(--v-theme-primary));
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.2px;
}

.info-grid-compact .value {
  flex: 1;
  text-align: end;
  color: #212529;
  font-weight: 600;
  font-size: 10px;
}

.font-bold {
  font-weight: 800 !important;
  color: rgb(var(--v-theme-primary)) !important;
}

/* DEPRECATED - Grid dual antiguo */
.info-grid-dual {
  display: grid;
  column-gap: 12px;
  gap: 4px 8px;
  grid-template-columns: 1fr 1fr;
}

.info-grid-dual .info-row {
  display: flex;
  justify-content: space-between;
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(var(--v-theme-secondary), 0.02) 0%, transparent 100%);
  font-size: 10px;
  grid-column: span 2;
  line-height: 1.5;
  padding-block: 4px;
  padding-inline: 6px;
  transition: background 0.2s ease;
}

.info-grid-dual .info-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.info-grid-dual .label {
  color: rgb(var(--v-theme-primary));
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2px;
  min-inline-size: 90px;
  text-transform: uppercase;
}

.info-grid-dual .value {
  flex: 1;
  color: #212529;
  font-size: 10px;
  font-weight: 600;
  text-align: end;
}

/* ROW 1 (DEPRECATED): 3 Secciones Compactas - Ya no se usa */
.compact-row {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr 1fr;
  margin-block-end: 12px;
}

.compact-section {
  /* DEPRECATED - Secciones compactas de información */
}

/* ROW 2-3-5: Tablas Full Width (Perforación, Herramientas, Período) */
.full-row {
  margin-block-end: 12px;
}

.full-section {
  /* Sección de ancho completo para tablas con muchas columnas */
}

/* ROW 4: 2 Tablas Secundarias (Rebaje + Consumos) */
.secondary-row {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
  margin-block-end: 12px;
}

.medium-section {
  /* Secciones medianas */
}

/* DEPRECATED - Ya no se usa main-row */
.main-row {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
  margin-block-end: 12px;
}

.wide-section {
  /* Secciones anchas - DEPRECATED */
}

/* === SECTION STYLES - MODERNO CON CARDS === */
.section {
  border: 1.5px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 4px;
  background: white;
  box-shadow: none; /* Sin sombra para ahorrar tinta */
  break-inside: avoid;
  padding-block: 12px;
  padding-inline: 14px;
  page-break-inside: avoid;
  transition: all 0.2s ease;
}

.section:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 6%);
}

.section h3 {
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(var(--v-theme-primary), 0.08) 0%, transparent 100%);
  border-block-end: 2px solid rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
  margin-block: -4px 10px;
  margin-inline: -4px;
  padding-block: 8px;
  padding-inline: 10px;
  text-align: start;
  text-transform: uppercase;
}

.sub-section {
  margin-block-end: 12pt;
}

.sub-section h4 {
  color: #000;
  font-size: 10pt;
  font-weight: 700;
  margin-block: 0 6pt;
  margin-inline: 0;
  text-transform: uppercase;
}

/* === INFO TABLE STYLES - MODERNO Y LEGIBLE === */
.info-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-table .info-row {
  display: flex;
  justify-content: space-between;
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(var(--v-theme-secondary), 0.02) 0%, transparent 100%);
  font-size: 10px;
  line-height: 1.5;
  padding-block: 5px;
  padding-inline: 8px;
  transition: background 0.2s ease;
}

.info-table .info-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.info-table .label {
  color: rgb(var(--v-theme-primary));
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2px;
  min-inline-size: 110px;
  text-transform: uppercase;
}

.info-table .value {
  flex: 1;
  color: #212529;
  font-size: 10px;
  font-weight: 600;
  text-align: end;
}

/* === DATA TABLE STYLES - MODERNO Y LEGIBLE === */
.table-container {
  border-radius: 3px;
  break-inside: avoid;
  overflow-x: auto;
  page-break-inside: avoid;
}

.data-table {
  overflow: hidden;
  border-radius: 3px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 9px;
  inline-size: 100%;
  table-layout: auto;
}

.data-table th,
.data-table td {
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
  padding-block: 6px;
  padding-inline: 8px;
  text-align: center;
  vertical-align: middle;
}

.data-table th {
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-primary), 0.06) 100%);
  break-after: avoid;
  color: rgb(var(--v-theme-primary));
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.4px;
  line-height: 1.4;
  page-break-after: avoid;
  text-transform: uppercase;
}

.data-table td {
  color: #212529;
  font-size: 9px;
  font-weight: 500;
  line-height: 1.5;
}

/* ZEBRA STRIPING - MODERNO */
.data-table tbody tr:nth-child(odd) {
  background-color: #fff;
}

.data-table tbody tr:nth-child(even) {
  background-color: rgba(var(--v-theme-secondary), 0.025);
}

.data-table tbody tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
  transition: background-color 0.2s ease;
}

.data-table .total-row {
  background: linear-gradient(90deg, rgba(var(--v-theme-primary), 0.12) 0%, rgba(var(--v-theme-secondary), 0.08) 100%) !important;
  border-block-start: 2px solid rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-primary));
  font-weight: 800;
}

/* === NOTE SECTION === */
.note-section {
  border: 1.5px solid rgba(var(--v-theme-secondary), 0.2);
  border-radius: 3px;
  background: linear-gradient(135deg, rgba(var(--v-theme-secondary), 0.03) 0%, rgba(var(--v-theme-primary), 0.01) 100%);
  border-inline-start: 3px solid rgb(var(--v-theme-secondary));
  box-shadow: none; /* Sin sombra para ahorrar tinta */
  break-inside: avoid;
  margin-block-start: 12px;
  padding-block: 10px;
  padding-inline: 12px;
  page-break-inside: avoid;
}

.note-section p {
  margin: 0;
  color: #495057;
  font-size: 9px;
  font-style: italic;
  font-weight: 500;
  line-height: 1.6;
}

.note-section strong {
  color: rgb(var(--v-theme-secondary));
  font-weight: 800;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.note {
  color: #000;
  font-size: 8pt;
  font-weight: 700;
  margin-block-start: 6pt;
  text-align: center;
}

/* === SIGNATURES SECTION === */
.signatures-section {
  display: grid;
  border-block-start: 2px solid rgba(var(--v-theme-primary), 0.2);
  break-inside: avoid;
  gap: 12px;
  grid-template-columns: 1fr 1fr 1fr;
  margin-block-start: 16px;
  padding-block-start: 14px;
  page-break-inside: avoid;
}

.signature-box {
  text-align: center;
}

.signature-label {
  display: inline-block;
  border-radius: 3px;
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgb(var(--v-theme-primary));
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  margin-block-end: 8px;
  padding-block: 4px;
  padding-inline: 8px;
  text-transform: uppercase;
}

.signature-space {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed rgba(var(--v-theme-primary), 0.25);
  border-radius: 4px;
  background: rgba(var(--v-theme-secondary), 0.01);
  block-size: 70px;
  transition: all 0.2s ease;
}

.signature-space:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  background: rgba(var(--v-theme-primary), 0.03);
}

.signature-content img {
  max-block-size: 100%;
  max-inline-size: 100%;
  object-fit: contain;
}

/* === OBSERVATIONS SECTION === */
.observations-section {
  padding: 18px;
  border: 2px solid rgba(var(--v-theme-primary), 0.15);
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 4%);
  break-inside: avoid;
  margin-block-start: 20px;
  page-break-inside: avoid;
}

.observations-section h3 {
  border-block-end: 2px solid rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.8px;
  margin-block: 0 12px;
  margin-inline: 0;
  padding-block-end: 8px;
  text-transform: uppercase;
}

.observations-section p {
  margin: 0;
  color: #212529;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.7;
}

/* === ENTERPRISE FOOTER === */
.enterprise-footer {
  border-radius: 3px;
  background: linear-gradient(135deg, rgba(var(--v-theme-secondary), 0.02) 0%, rgba(var(--v-theme-primary), 0.01) 100%);
  border-block-start: 2px solid rgba(var(--v-theme-primary), 0.2);
  break-inside: avoid;
  margin-block-start: 16px;
  padding-block: 12px;
  padding-inline: 14px;
  page-break-inside: avoid;
}

.footer-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.footer-left {
  flex: 1;
}

.footer-title {
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.4px;
  margin-block: 0 6px;
  margin-inline: 0;
  text-transform: uppercase;
}

.footer-disclaimer {
  color: #6c757d;
  font-size: 8px;
  font-style: italic;
  font-weight: 500;
  line-height: 1.5;
  margin-block: 0 8px;
  margin-inline: 0;
}

.footer-meta {
  margin: 0;
  color: #495057;
  font-size: 8px;
  font-weight: 600;
  line-height: 1.5;
}

.footer-meta strong {
  color: rgb(var(--v-theme-primary));
}

.footer-right {
  flex: 0 0 auto;
}

.qr-section {
  padding: 8px;
  border: 1.5px solid rgba(var(--v-theme-primary), 0.15);
  border-radius: 4px;
  background: white;
  box-shadow: none; /* Sin sombra para ahorrar tinta */
  text-align: center;
}

.qr-code {
  padding: 4px;
  border: 1.5px solid rgb(var(--v-theme-primary));
  border-radius: 3px;
  background: white;
  block-size: 70px;
  inline-size: 70px;
}

.qr-label {
  color: rgb(var(--v-theme-primary));
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin-block: 6px 0;
  margin-inline: 0;
  text-transform: uppercase;
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
    margin: 0.4in; /* Márgenes compactos */
    size: letter portrait; /* 8.5" x 11" */
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
    overflow: visible;
    background: white !important;
  }

  .report-content {
    padding: 0;
    margin: 0;
    max-inline-size: none;
  }

  .print-document {
    padding: 0.25in; /* Más compacto */
    border-radius: 0;
    margin: 0;
    box-shadow: none !important;
    inline-size: 100%;
    max-inline-size: none;
  }

  /* === LAYOUT COMPACTO PARA PRINT === */
  .info-row-dual {
    gap: 10px;
    grid-template-columns: 1fr 1fr;
    margin-block-end: 10px;
  }

  .section-clean h3 {
    font-size: 9px;
    padding: 6px 8px;
    margin-block-end: 8px;
    background: white !important; /* Sin gradientes para ahorrar tinta */
  }

  .info-grid-compact {
    gap: 0px; /* Eliminar gap para impresión compacta */
  }

  .info-grid-compact .info-row {
    font-size: 8px;
    padding: 2px 5px; /* Reducido de 3px 6px */
    background: white !important; /* Sin gradientes para ahorrar tinta */
  }

  .info-grid-compact .label,
  .info-grid-compact .value {
    font-size: 8px;
  }

  .info-grid-compact .label {
    min-inline-size: 90px;
  }

  /* DEPRECATED */
  .info-grid-dual {
    gap: 2px 6px;
  }

  .info-grid-dual .info-row {
    font-size: 8px;
    padding-block: 3px;
    padding-inline: 5px;
  }

  .info-grid-dual .label,
  .info-grid-dual .value {
    font-size: 8px;
  }

  .info-grid-dual .label {
    min-inline-size: 70px;
  }

  .secondary-row {
    gap: 8px;
    grid-template-columns: 1fr 1fr;
    margin-block-end: 8px;
  }

  .full-row {
    margin-block-end: 8px;
  }

  /* DEPRECATED */
  .compact-row {
    gap: 8px;
    grid-template-columns: 1fr 1fr 1fr;
    margin-block-end: 8px;
  }

  /* === HEADER MÁS COMPACTO === */
  .report-header {
    background: white !important; /* Sin gradientes para ahorrar tinta */
    box-shadow: none !important;
    margin-block-end: 10px;
    padding-block: 10px;
    padding-inline: 12px;
  }

  /* === SECCIONES COMPACTAS === */
  .section {
    border-radius: 0;
    box-shadow: none !important;
    margin-block-end: 8px;
    padding-block: 8px;
    padding-inline: 10px;
  }

  .section h3 {
    font-size: 10px;
    margin-block: -2px 8px;
    margin-inline: -2px;
    padding-block: 6px;
    padding-inline: 8px;
  }

  /* === TABLAS COMPACTAS === */
  .data-table th,
  .data-table td {
    font-size: 8px;
    padding-block: 4px;
    padding-inline: 6px;
  }

  .info-table .info-row {
    gap: 2px;
    padding-block: 3px;
    padding-inline: 6px;
  }

  .info-table .label,
  .info-table .value {
    font-size: 8px;
  }

  /* === FIRMAS COMPACTAS === */
  .signatures-section {
    gap: 8px;
    margin-block-start: 10px;
    padding-block-start: 10px;
  }

  .signature-space {
    block-size: 60px;
  }

  .signature-label {
    font-size: 8px;
    margin-block-end: 6px;
    padding-block: 3px;
    padding-inline: 6px;
  }

  /* === FOOTER COMPACTO === */
  .enterprise-footer {
    background: white !important; /* Sin gradientes */
    margin-block-start: 10px;
    padding-block: 8px;
    padding-inline: 10px;
  }

  .footer-title {
    font-size: 10px;
    margin-block-end: 4px;
  }

  .footer-disclaimer,
  .footer-meta {
    font-size: 7px;
  }

  .qr-code {
    block-size: 60px;
    inline-size: 60px;
  }

  .qr-label {
    font-size: 6px;
  }

  /* === NOTE SECTION COMPACTO === */
  .note-section {
    background: white !important; /* Sin gradientes */
    margin-block-start: 8px;
    padding-block: 8px;
    padding-inline: 10px;
  }

  .note-section p {
    font-size: 8px;
  }

  /* === OBSERVATIONS COMPACTO === */
  .observations-section {
    margin-block-start: 8px;
    padding-block: 8px;
    padding-inline: 10px;
  }

  .observations-section h3 {
    font-size: 10px;
    margin-block-end: 6px;
    padding-block-end: 4px;
  }

  .observations-section p {
    font-size: 8px;
  }

  /* === TYPOGRAPHY OPTIMIZATION === */
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* === REMOVE INTERACTIVE EFFECTS === */
  .section:hover,
  .info-table .info-row:hover,
  .data-table tbody tr:hover,
  .signature-space:hover {
    border-color: inherit !important;
    background: inherit !important;
    box-shadow: none !important;
  }

  /* === GRADIENTES MÁS SUTILES PARA PRINT === */
  .report-header,
  .section h3,
  .data-table th,
  .note-section,
  .enterprise-footer {
    background: white !important; /* Eliminar gradientes para tinta */
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

  /* === COLOR PRESERVATION - MANTENER TEMA === */
  .data-table tbody tr:nth-child(even) {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .data-table th {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .data-table .total-row {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* === MANTENER COLORES DE MARCA EN PRINT === */
  .section,
  .report-header,
  .section h3,
  .info-table .label,
  .report-title h1,
  .signature-label,
  .footer-title,
  .note-section strong {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* === SIMPLIFICAR BORDES PARA PRINT === */
  .section {
    border-width: 1.5px !important;
    box-shadow: none !important;
  }

  .data-table {
    border-radius: 0 !important;
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
  p,
 h1,
 h2,
 h3,
 h4,
 h5,
 h6 {
    orphans: 3;
    widows: 3;
  }

  /* === QR CODE & FOOTER ADJUSTMENTS === */
  .qr-code {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* ============================================
   RESPONSIVE DESIGN - MOBILE & TABLET
   ============================================ */

@media (max-width: 1024px) {
  .print-document {
    padding: 20px;
    inline-size: 100%;
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
