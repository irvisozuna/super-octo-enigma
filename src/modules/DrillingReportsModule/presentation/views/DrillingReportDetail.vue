<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDrillingReportStore } from '../stores/drillingReportStore'
import { useDrillingReportPermissions } from '../composables/useDrillingReportPermissions'
import { useDrillingReportStatusTransition } from '../composables/useDrillingReportStatusTransition'
import {
  getActivityIcon,
  getActivityTypeLabel,
  getConsumableIcon,
  getConsumableTypeLabel,
  getMatrixConditionLabel,
  getShiftLabel,
  getSignatureMethodLabel,
  getSignatureTypeIcon,
  getSignatureTypeLabel,
  getToolCategoryIcon,
  getToolCategoryLabel,
  getWearPatternLabel,
} from '../../shared/utils/labelUtils'
import { formatDate, formatDateTime } from '@/modules/DrillingReportsModule/shared/utils/dateUtils'

// Props
interface Props {
  reportId: string
}

const props = defineProps<Props>()

// Composables
const router = useRouter()
const route = useRoute()
const drillingReportStore = useDrillingReportStore()
const permissions = useDrillingReportPermissions()

// State
const activeTab = ref('activities')
const showActivityModal = ref(false)
const showConsumptionModal = ref(false)
const showToolAssignmentModal = ref(false)
const showSignatureModal = ref(false)
const showCompleteModal = ref(false)
const showRejectModal = ref(false)
const selectedActivity = ref(null)
const selectedConsumption = ref(null)
const selectedToolAssignment = ref(null)

// Computed
const report = computed(() => drillingReportStore.currentReport)
const statusTransition = useDrillingReportStatusTransition(report.value)

const statusConfig = computed(() => statusTransition.currentStatusConfig.value)
const canEdit = computed(() => statusTransition.canEdit.value)
const canComplete = computed(() => statusTransition.canComplete.value)
const canApprove = computed(() => statusTransition.canApprove.value)
const canReject = computed(() => statusTransition.canReject.value)
const canExport = computed(() => permissions.canExportReports.value)
const canAddActivities = computed(() => permissions.canAddActivities.value)
const canUpdateActivities = computed(() => permissions.canUpdateActivities.value)
const canAddConsumptions = computed(() => permissions.canAddConsumptions.value)
const canUpdateConsumptions = computed(() => permissions.canUpdateConsumptions.value)
const canAssignTools = computed(() => permissions.canAssignTools.value)
const canUpdateToolAssignments = computed(() => permissions.canUpdateToolAssignments.value)

// Methods
const goBack = () => {
  router.push('/drilling/reports')
}

const editReport = () => {
  router.push(`/drilling/reports/${props.reportId}/edit`)
}

const addActivity = () => {
  selectedActivity.value = null
  showActivityModal.value = true
}

const editActivity = (activity: any) => {
  selectedActivity.value = activity
  showActivityModal.value = true
}

const deleteActivity = async (activity: any) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
    try {
      await drillingReportStore.deleteActivity(reportId.value as string, activity.id)
      await refreshReportData()
    }
    catch (error) {
      console.error('Error deleting activity:', error)
    }
  }
}

const addConsumption = () => {
  selectedConsumption.value = null
  showConsumptionModal.value = true
}

const editConsumption = (consumption: any) => {
  selectedConsumption.value = consumption
  showConsumptionModal.value = true
}

const deleteConsumption = async (consumption: any) => {
  if (confirm('¿Estás seguro de que quieres eliminar este consumo?')) {
    try {
      await drillingReportStore.deleteConsumption(reportId.value as string, consumption.id)
      await refreshReportData()
    }
    catch (error) {
      console.error('Error deleting consumption:', error)
    }
  }
}

const assignTool = () => {
  selectedToolAssignment.value = null
  showToolAssignmentModal.value = true
}

const editToolAssignment = (assignment: any) => {
  selectedToolAssignment.value = assignment
  showToolAssignmentModal.value = true
}

const deleteToolAssignment = async (assignment: any) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta asignación de herramienta?')) {
    try {
      await drillingReportStore.deleteToolAssignment(reportId.value as string, assignment.id)
      await refreshReportData()
    }
    catch (error) {
      console.error('Error deleting tool assignment:', error)
    }
  }
}

const viewSignature = (signature: any) => {
  // Open signature in modal or new window
  if (signature.signature_data) {
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Firma - ${signature.signatory_name}</title></head>
          <body style="text-align: center; padding: 20px;">
            <h2>Firma de ${signature.signatory_name}</h2>
            <img src="${signature.signature_data}" style="max-width: 100%; border: 1px solid #ccc;">
            <p>Firmado el: ${new Date(signature.signed_at).toLocaleString()}</p>
          </body>
        </html>
      `)
    }
  }
}

const completeReport = () => {
  showCompleteModal.value = true
}

const approveReport = async () => {
  if (confirm('¿Estás seguro de que quieres aprobar este reporte?')) {
    try {
      await drillingReportStore.approveReport(reportId.value as string)
      await refreshReportData()
    }
    catch (error) {
      console.error('Error approving report:', error)
    }
  }
}

const rejectReport = () => {
  showRejectModal.value = true
}

const exportReport = async () => {
  try {
    await drillingReportStore.exportReportToPDF(reportId.value as string)
  }
  catch (error) {
    console.error('Error exporting report:', error)
  }
}

// Refresh report data
const refreshReportData = async () => {
  try {
    await drillingReportStore.fetchReportById(reportId.value as string)
  }
  catch (error) {
    console.error('Error refreshing report:', error)
  }
}

// Event handlers
const onActivitySaved = async () => {
  showActivityModal.value = false
  await refreshReportData()
}

const onConsumptionSaved = async () => {
  showConsumptionModal.value = false
  await refreshReportData()
}

const onToolAssignmentSaved = async () => {
  showToolAssignmentModal.value = false
  await refreshReportData()
}

const onSignatureSaved = async () => {
  showSignatureModal.value = false
  await refreshReportData()
}

const onReportCompleted = async () => {
  showCompleteModal.value = false
  await refreshReportData()
}

const onReportRejected = async () => {
  showRejectModal.value = false
  await refreshReportData()
}

// Lifecycle
onMounted(async () => {
  await drillingReportStore.fetchReport(props.reportId)
})
</script>

<template>
  <div class="drilling-report-detail">
    <!-- Header -->
    <div class="report-header">
      <div class="header-left">
        <VBtn
          icon="tabler-arrow-left"
          variant="text"
          @click="goBack"
        />
        <div class="report-info">
          <h1 class="report-title">
            {{ report.report_number }}
          </h1>
          <div class="report-meta">
            <VChip
              :color="statusConfig.color"
              :bg-color="statusConfig.bgColor"
              size="small"
              class="status-chip"
            >
              <VIcon
                :icon="statusConfig.icon"
                class="me-2"
              />
              {{ statusConfig.label }}
            </VChip>
            <span class="report-date">
              {{ formatDate(report.report_date) }}
            </span>
            <span class="report-shift">
              {{ getShiftLabel(report.shift) }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <VBtn
          v-if="canEdit"
          color="primary"
          variant="outlined"
          @click="editReport"
        >
          <VIcon
            icon="tabler-edit"
            class="me-2"
          />
          Editar
        </VBtn>
        <VBtn
          v-if="canComplete"
          color="success"
          @click="completeReport"
        >
          <VIcon
            icon="tabler-check"
            class="me-2"
          />
          Completar
        </VBtn>
        <VBtn
          v-if="canApprove"
          color="success"
          @click="approveReport"
        >
          <VIcon
            icon="tabler-circle-check"
            class="me-2"
          />
          Aprobar
        </VBtn>
        <VBtn
          v-if="canReject"
          color="error"
          variant="outlined"
          @click="rejectReport"
        >
          <VIcon
            icon="tabler-circle-x"
            class="me-2"
          />
          Rechazar
        </VBtn>
        <VBtn
          v-if="canExport"
          color="info"
          variant="outlined"
          @click="exportReport"
        >
          <VIcon
            icon="tabler-download"
            class="me-2"
          />
          Exportar
        </VBtn>
      </div>
    </div>

    <!-- Project and Well Info -->
    <VCard class="mb-4">
      <VCardTitle>
        <VIcon
          icon="tabler-info-circle"
          class="me-2"
        />
        Información General
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <div class="info-item">
              <label class="info-label">Proyecto:</label>
              <span class="info-value">{{ report.project?.name }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">Pozo:</label>
              <span class="info-value">{{ report.well?.name }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">Equipo:</label>
              <span class="info-value">{{ report.equipment?.name || 'No asignado' }}</span>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <div class="info-item">
              <label class="info-label">Operador Día:</label>
              <span class="info-value">{{ report.personnel?.operator_day?.name || 'No asignado' }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">Operador Noche:</label>
              <span class="info-value">{{ report.personnel?.operator_night?.name || 'No asignado' }}</span>
            </div>
            <div class="info-item">
              <label class="info-label">Creado por:</label>
              <span class="info-value">{{ report.created_by?.name || 'Desconocido' }}</span>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Tabs -->
    <VTabs
      v-model="activeTab"
      class="mb-4"
    >
      <VTab value="activities">
        <VIcon
          icon="tabler-settings"
          class="me-2"
        />
        Actividades
        <VChip
          v-if="report.activities?.length"
          size="small"
          class="ms-2"
        >
          {{ report.activities.length }}
        </VChip>
      </VTab>
      <VTab value="consumptions">
        <VIcon
          icon="tabler-package"
          class="me-2"
        />
        Consumos
        <VChip
          v-if="report.consumptions?.length"
          size="small"
          class="ms-2"
        >
          {{ report.consumptions.length }}
        </VChip>
      </VTab>
      <VTab value="tools">
        <VIcon
          icon="tabler-tools"
          class="me-2"
        />
        Herramientas
        <VChip
          v-if="report.tool_assignments?.length"
          size="small"
          class="ms-2"
        >
          {{ report.tool_assignments.length }}
        </VChip>
      </VTab>
      <VTab value="signatures">
        <VIcon
          icon="tabler-signature"
          class="me-2"
        />
        Firmas
        <VChip
          v-if="report.signatures?.length"
          size="small"
          class="ms-2"
        >
          {{ report.signatures.length }}
        </VChip>
      </VTab>
      <VTab value="summary">
        <VIcon
          icon="mdi-chart-line"
          class="me-2"
        />
        Resumen
      </VTab>
    </VTabs>

    <!-- Tab Content -->
    <VTabsWindow v-model="activeTab">
      <!-- Activities Tab -->
      <VTabsWindowItem value="activities">
        <VCard>
          <VCardTitle>
            <div class="d-flex justify-space-between align-center">
              <span>Actividades</span>
              <VBtn
                v-if="canAddActivities"
                color="primary"
                size="small"
                @click="addActivity"
              >
                <VIcon
                  icon="tabler-plus"
                  class="me-2"
                />
                Agregar Actividad
              </VBtn>
            </div>
          </VCardTitle>
          <VCardText>
            <div
              v-if="report.activities?.length"
              class="activities-list"
            >
              <VCard
                v-for="activity in report.activities"
                :key="activity.id"
                class="mb-3"
                variant="outlined"
              >
                <VCardText>
                  <div class="d-flex justify-space-between align-start">
                    <div class="activity-info">
                      <div class="activity-type">
                        <VIcon
                          :icon="getActivityIcon(activity.activity_type)"
                          class="me-2"
                        />
                        {{ getActivityTypeLabel(activity.activity_type) }}
                      </div>
                      <div class="activity-details">
                        <span class="activity-hours">{{ activity.hours }}h</span>
                        <span class="activity-shift">{{ getShiftLabel(activity.shift) }}</span>
                        <span
                          v-if="activity.start_time"
                          class="activity-time"
                        >
                          {{ activity.start_time }} - {{ activity.end_time }}
                        </span>
                      </div>
                      <div
                        v-if="activity.description"
                        class="activity-description"
                      >
                        {{ activity.description }}
                      </div>
                    </div>
                    <div class="activity-actions">
                      <VBtn
                        v-if="canUpdateActivities"
                        icon="tabler-edit"
                        size="small"
                        variant="text"
                        @click="editActivity(activity)"
                      />
                      <VBtn
                        v-if="canUpdateActivities"
                        icon="tabler-trash"
                        size="small"
                        variant="text"
                        color="error"
                        @click="deleteActivity(activity)"
                      />
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </div>
            <div
              v-else
              class="text-center py-8"
            >
              <VIcon
                icon="tabler-info-circle"
                size="48"
                class="text-grey"
              />
              <p class="text-grey mt-2">
                No hay actividades registradas
              </p>
            </div>
          </VCardText>
        </VCard>
      </VTabsWindowItem>

      <!-- Consumptions Tab -->
      <VTabsWindowItem value="consumptions">
        <VCard>
          <VCardTitle>
            <div class="d-flex justify-space-between align-center">
              <span>Consumos</span>
              <VBtn
                v-if="canAddConsumptions"
                color="primary"
                size="small"
                @click="addConsumption"
              >
                <VIcon
                  icon="tabler-plus"
                  class="me-2"
                />
                Registrar Consumo
              </VBtn>
            </div>
          </VCardTitle>
          <VCardText>
            <div
              v-if="report.consumptions?.length"
              class="consumptions-list"
            >
              <VCard
                v-for="consumption in report.consumptions"
                :key="consumption.id"
                class="mb-3"
                variant="outlined"
              >
                <VCardText>
                  <div class="d-flex justify-space-between align-start">
                    <div class="consumption-info">
                      <div class="consumption-type">
                        <VIcon
                          :icon="getConsumableIcon(consumption.consumable_type)"
                          class="me-2"
                        />
                        {{ getConsumableTypeLabel(consumption.consumable_type) }}
                      </div>
                      <div class="consumption-details">
                        <span class="consumption-quantity">{{ consumption.quantity }} {{ consumption.unit }}</span>
                        <span class="consumption-shift">{{ getShiftLabel(consumption.shift) }}</span>
                      </div>
                    </div>
                    <div class="consumption-actions">
                      <VBtn
                        v-if="canUpdateConsumptions"
                        icon="tabler-edit"
                        size="small"
                        variant="text"
                        @click="editConsumption(consumption)"
                      />
                      <VBtn
                        v-if="canUpdateConsumptions"
                        icon="tabler-trash"
                        size="small"
                        variant="text"
                        color="error"
                        @click="deleteConsumption(consumption)"
                      />
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </div>
            <div
              v-else
              class="text-center py-8"
            >
              <VIcon
                icon="tabler-info-circle"
                size="48"
                class="text-grey"
              />
              <p class="text-grey mt-2">
                No hay consumos registrados
              </p>
            </div>
          </VCardText>
        </VCard>
      </VTabsWindowItem>

      <!-- Tools Tab -->
      <VTabsWindowItem value="tools">
        <VCard>
          <VCardTitle>
            <div class="d-flex justify-space-between align-center">
              <span>Herramientas</span>
              <VBtn
                v-if="canAssignTools"
                color="primary"
                size="small"
                @click="assignTool"
              >
                <VIcon
                  icon="tabler-plus"
                  class="me-2"
                />
                Asignar Herramienta
              </VBtn>
            </div>
          </VCardTitle>
          <VCardText>
            <div
              v-if="report.tool_assignments?.length"
              class="tools-list"
            >
              <VCard
                v-for="assignment in report.tool_assignments"
                :key="assignment.id"
                class="mb-3"
                variant="outlined"
              >
                <VCardText>
                  <div class="d-flex justify-space-between align-start">
                    <div class="tool-info">
                      <div class="tool-name">
                        <VIcon
                          :icon="getToolCategoryIcon(assignment.tool_category)"
                          class="me-2"
                        />
                        {{ assignment.tool?.name || 'Herramienta' }}
                      </div>
                      <div class="tool-details">
                        <span class="tool-category">{{ getToolCategoryLabel(assignment.tool_category) }}</span>
                        <span class="tool-shift">{{ getShiftLabel(assignment.shift) }}</span>
                        <span class="tool-depth">
                          {{ assignment.depth_range.start_meters }}m - {{ assignment.depth_range.end_meters }}m
                        </span>
                        <span class="tool-meters">
                          {{ assignment.depth_range.meters_drilled }}m perforados
                        </span>
                      </div>
                      <div
                        v-if="assignment.wear_pattern"
                        class="tool-wear"
                      >
                        <span class="wear-pattern">{{ getWearPatternLabel(assignment.wear_pattern) }}</span>
                        <span
                          v-if="assignment.matrix"
                          class="matrix-condition"
                        >{{ getMatrixConditionLabel(assignment.matrix) }}</span>
                      </div>
                    </div>
                    <div class="tool-actions">
                      <VBtn
                        v-if="canUpdateToolAssignments"
                        icon="tabler-edit"
                        size="small"
                        variant="text"
                        @click="editToolAssignment(assignment)"
                      />
                      <VBtn
                        v-if="canUpdateToolAssignments"
                        icon="tabler-trash"
                        size="small"
                        variant="text"
                        color="error"
                        @click="deleteToolAssignment(assignment)"
                      />
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </div>
            <div
              v-else
              class="text-center py-8"
            >
              <VIcon
                icon="tabler-info-circle"
                size="48"
                class="text-grey"
              />
              <p class="text-grey mt-2">
                No hay herramientas asignadas
              </p>
            </div>
          </VCardText>
        </VCard>
      </VTabsWindowItem>

      <!-- Signatures Tab -->
      <VTabsWindowItem value="signatures">
        <VCard>
          <VCardTitle>Firmas</VCardTitle>
          <VCardText>
            <div
              v-if="report.signatures?.length"
              class="signatures-list"
            >
              <VCard
                v-for="signature in report.signatures"
                :key="signature.id"
                class="mb-3"
                variant="outlined"
              >
                <VCardText>
                  <div class="d-flex justify-space-between align-center">
                    <div class="signature-info">
                      <div class="signature-type">
                        <VIcon
                          :icon="getSignatureTypeIcon(signature.signature_type)"
                          class="me-2"
                        />
                        {{ getSignatureTypeLabel(signature.signature_type) }}
                      </div>
                      <div class="signature-details">
                        <span class="signatory-name">{{ signature.signatory_name }}</span>
                        <span class="signature-method">{{ getSignatureMethodLabel(signature.signature_method) }}</span>
                        <span class="signature-date">{{ formatDateTime(signature.signed_at) }}</span>
                      </div>
                    </div>
                    <div class="signature-actions">
                      <VBtn
                        v-if="signature.signature_data"
                        icon="tabler-eye"
                        size="small"
                        variant="text"
                        @click="viewSignature(signature)"
                      />
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </div>
            <div
              v-else
              class="text-center py-8"
            >
              <VIcon
                icon="tabler-info-circle"
                size="48"
                class="text-grey"
              />
              <p class="text-grey mt-2">
                No hay firmas registradas
              </p>
            </div>
          </VCardText>
        </VCard>
      </VTabsWindowItem>

      <!-- Summary Tab -->
      <VTabsWindowItem value="summary">
        <VCard>
          <VCardTitle>Resumen del Reporte</VCardTitle>
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
                      <span class="summary-label">Horas Trabajadas:</span>
                      <span class="summary-value">{{ report.totals?.hours_worked || 0 }}h</span>
                    </div>
                    <div class="summary-item">
                      <VIcon
                        icon="tabler-ruler"
                        class="me-2"
                      />
                      <span class="summary-label">Metros Perforados:</span>
                      <span class="summary-value">{{ report.totals?.meters_drilled || 0 }}m</span>
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

            <VCard
              v-if="report.observations"
              variant="outlined"
            >
              <VCardTitle class="text-h6">
                Observaciones
              </VCardTitle>
              <VCardText>
                <p>{{ report.observations }}</p>
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>
      </VTabsWindowItem>
    </VTabsWindow>

    <!-- Modals -->
    <DrillingReportActivityModal
      v-model="showActivityModal"
      :activity="selectedActivity"
      :report-id="report.id"
      @saved="onActivitySaved"
    />

    <DrillingReportConsumptionModal
      v-model="showConsumptionModal"
      :consumption="selectedConsumption"
      :report-id="report.id"
      @saved="onConsumptionSaved"
    />

    <DrillingReportToolAssignmentModal
      v-model="showToolAssignmentModal"
      :assignment="selectedToolAssignment"
      :report-id="report.id"
      @saved="onToolAssignmentSaved"
    />

    <DrillingReportSignatureModal
      v-model="showSignatureModal"
      :report-id="report.id"
      @saved="onSignatureSaved"
    />

    <DrillingReportCompleteModal
      v-model="showCompleteModal"
      :report="report"
      @completed="onReportCompleted"
    />

    <DrillingReportRejectModal
      v-model="showRejectModal"
      :report="report"
      @rejected="onReportRejected"
    />
  </div>
</template>

<style scoped>
.drilling-report-detail {
  padding: 20px;
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: 1200px;
}

.report-header {
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

.report-title {
  font-size: 24px;
  font-weight: 600;
  margin-block: 0 8px;
  margin-inline: 0;
}

.report-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.report-date,
.report-shift {
  color: #666;
  font-size: 14px;
}

.header-right {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-block-end: 8px;
}

.info-label {
  font-weight: 500;
  margin-inline-end: 8px;
  min-inline-size: 120px;
}

.info-value {
  color: #666;
}

.activities-list,
.consumptions-list,
.tools-list,
.signatures-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-info,
.consumption-info,
.tool-info,
.signature-info {
  flex: 1;
}

.activity-type,
.consumption-type,
.tool-name,
.signature-type {
  font-weight: 500;
  margin-block-end: 4px;
}

.activity-details,
.consumption-details,
.tool-details,
.signature-details {
  display: flex;
  color: #666;
  font-size: 14px;
  gap: 16px;
  margin-block-end: 4px;
}

.activity-description,
.tool-wear {
  color: #666;
  font-size: 14px;
}

.activity-actions,
.consumption-actions,
.tool-actions,
.signature-actions {
  display: flex;
  gap: 4px;
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

.status-chip {
  font-weight: 500;
}

@media (max-width: 768px) {
  .report-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-right {
    justify-content: flex-start;
    inline-size: 100%;
  }

  .report-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
