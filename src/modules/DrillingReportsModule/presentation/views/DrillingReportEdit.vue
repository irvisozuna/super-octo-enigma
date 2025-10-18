<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDrillingReportStore } from '../stores/drillingReportStore'
import { useDrillingReportPermissions } from '../composables/useDrillingReportPermissions'
import { SHIFTS } from '../../shared/constants/DrillingConstants'
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
const permissions = useDrillingReportPermissions()

// State
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const saving = ref(false)

const formData = ref({
  project_id: '',
  well_id: '',
  report_date: '',
  shift: 'day',
  equipment_id: null,
  operator_day_id: null,
  operator_night_id: null,
  helper1_day_id: null,
  helper2_day_id: null,
  helper1_night_id: null,
  helper2_night_id: null,
  horometer_start_day: null,
  horometer_start_night: null,
  horometer_end_day: null,
  horometer_end_night: null,
  rpm_pull_down: null,
  rpm_rotation: null,
  observations: '',
})

const errors = ref({})
const projects = ref([])
const wells = ref([])
const employees = ref([])
const equipment = ref([])

// Computed
const report = computed(() => drillingReportStore.currentReport)
const shifts = computed(() => SHIFTS)

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Este campo es requerido',
  date: (value: string) => {
    if (!value)
      return true
    const date = new Date(value)
    const today = new Date()

    return date <= today || 'La fecha no puede ser futura'
  },
}

// Methods
const goBack = () => {
  router.push(`/drilling/reports/${props.reportId}`)
}

const onProjectChange = async (projectId: string) => {
  if (projectId) {
    try {
      await drillingReportStore.fetchWellsByProject(projectId)
    }
    catch (error) {
      console.error('Error loading wells:', error)
    }
  }
  formData.value.well_id = ''
}

const loadData = async () => {
  loading.value = true
  try {
    // Load report data
    await drillingReportStore.fetchReport(props.reportId)

    // Populate form with report data
    if (report.value) {
      formData.value = {
        project_id: report.value.project?.id || '',
        well_id: report.value.well?.id || '',
        report_date: report.value.report_date || '',
        shift: report.value.shift || 'day',
        equipment_id: report.value.equipment?.id || null,
        operator_day_id: report.value.personnel?.operator_day?.id || null,
        operator_night_id: report.value.personnel?.operator_night?.id || null,
        helper1_day_id: report.value.personnel?.helper1_day?.id || null,
        helper2_day_id: report.value.personnel?.helper2_day?.id || null,
        helper1_night_id: report.value.personnel?.helper1_night?.id || null,
        helper2_night_id: report.value.personnel?.helper2_night?.id || null,
        horometer_start_day: report.value.horometer?.day?.start || null,
        horometer_start_night: report.value.horometer?.night?.start || null,
        horometer_end_day: report.value.horometer?.day?.end || null,
        horometer_end_night: report.value.horometer?.night?.end || null,
        rpm_pull_down: report.value.rpm?.pull_down || null,
        rpm_rotation: report.value.rpm?.rotation || null,
        observations: report.value.observations || '',
      }
    }

    // Load dropdown data
    await Promise.all([
      drillingReportStore.fetchProjectsSimple(),
      drillingReportStore.fetchEmployeesSimple(),
      drillingReportStore.fetchEquipmentSimple(),
    ])
  }
  catch (error) {
    console.error('Error loading data:', error)
  }
  finally {
    loading.value = false
  }
}

const saveReport = async () => {
  if (!formValid.value)
    return

  saving.value = true
  try {
    await drillingReportStore.updateReport(props.reportId, formData.value)

    // Show success message
    console.log('Report updated successfully')

    // Navigate back to detail view
    router.push(`/drilling/reports/${props.reportId}`)
  }
  catch (error) {
    console.error('Error saving report:', error)

    // Error notification already handled by console.error
  }
  finally {
    saving.value = false
  }
}

// Watchers
watch(() => formData.value.shift, newShift => {
  if (newShift === 'day') {
    formData.value.operator_night_id = null
    formData.value.helper1_night_id = null
    formData.value.helper2_night_id = null
    formData.value.horometer_start_night = null
    formData.value.horometer_end_night = null
  }
  else if (newShift === 'night') {
    formData.value.operator_day_id = null
    formData.value.helper1_day_id = null
    formData.value.helper2_day_id = null
    formData.value.horometer_start_day = null
    formData.value.horometer_end_day = null
  }
})

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="drilling-report-edit">
    <!-- Header -->
    <div class="edit-header">
      <div class="header-left">
        <VBtn
          icon="tabler-arrow-left"
          variant="text"
          @click="goBack"
        />
        <div class="edit-info">
          <h1 class="edit-title">
            Editar Reporte
          </h1>
          <p class="edit-subtitle">
            {{ report.report_number }} - {{ formatDate(report.report_date) }}
          </p>
        </div>
      </div>
      <div class="header-right">
        <VBtn
          color="grey"
          variant="outlined"
          @click="goBack"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          :loading="saving"
          @click="saveReport"
        >
          <VIcon
            icon="tabler-device-floppy"
            class="me-2"
          />
          Guardar Cambios
        </VBtn>
      </div>
    </div>

    <!-- Form -->
    <VForm
      ref="formRef"
      v-model="formValid"
      @submit.prevent="saveReport"
    >
      <VCard>
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
              <VSelect
                v-model="formData.project_id"
                :items="projects"
                item-title="name"
                item-value="id"
                label="Proyecto *"
                :rules="[rules.required]"
                :error-messages="errors.project_id"
                @update:model-value="onProjectChange"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.well_id"
                :items="wells"
                item-title="name"
                item-value="id"
                label="Pozo *"
                :rules="[rules.required]"
                :error-messages="errors.well_id"
                :disabled="!formData.project_id"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="formData.report_date"
                type="date"
                label="Fecha de Reporte *"
                :rules="[rules.required, rules.date]"
                :error-messages="errors.report_date"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="formData.shift"
                :items="shifts"
                item-title="label"
                item-value="value"
                label="Turno *"
                :rules="[rules.required]"
                :error-messages="errors.shift"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="formData.equipment_id"
                :items="equipment"
                item-title="name"
                item-value="id"
                label="Equipo"
                clearable
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Personnel Section -->
      <VCard class="mt-4">
        <VCardTitle>
          <VIcon
            icon="tabler-users"
            class="me-2"
          />
          Personal
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.operator_day_id"
                :items="employees"
                item-title="name"
                item-value="id"
                label="Operador Día"
                :disabled="formData.shift === 'night'"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.operator_night_id"
                :items="employees"
                item-title="name"
                item-value="id"
                label="Operador Noche"
                :disabled="formData.shift === 'day'"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="formData.helper1_day_id"
                :items="employees"
                item-title="name"
                item-value="id"
                label="Ayudante 1 Día"
                :disabled="formData.shift === 'night'"
                clearable
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="formData.helper2_day_id"
                :items="employees"
                item-title="name"
                item-value="id"
                label="Ayudante 2 Día"
                :disabled="formData.shift === 'night'"
                clearable
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="formData.helper1_night_id"
                :items="employees"
                item-title="name"
                item-value="id"
                label="Ayudante 1 Noche"
                :disabled="formData.shift === 'day'"
                clearable
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.helper2_night_id"
                :items="employees"
                item-title="name"
                item-value="id"
                label="Ayudante 2 Noche"
                :disabled="formData.shift === 'day'"
                clearable
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Horometer Section -->
      <VCard class="mt-4">
        <VCardTitle>
          <VIcon
            icon="tabler-speedometer"
            class="me-2"
          />
          Horómetro
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.horometer_start_day"
                type="number"
                step="0.1"
                label="Lectura Inicial Día"
                :error-messages="errors.horometer_start_day"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.horometer_start_night"
                type="number"
                step="0.1"
                label="Lectura Inicial Noche"
                :error-messages="errors.horometer_start_night"
                :disabled="formData.shift === 'day'"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.horometer_end_day"
                type="number"
                step="0.1"
                label="Lectura Final Día"
                :error-messages="errors.horometer_end_day"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.horometer_end_night"
                type="number"
                step="0.1"
                label="Lectura Final Noche"
                :error-messages="errors.horometer_end_night"
                :disabled="formData.shift === 'day'"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- RPM Section -->
      <VCard class="mt-4">
        <VCardTitle>
          <VIcon
            icon="tabler-settings"
            class="me-2"
          />
          RPM
        </VCardTitle>
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.rpm_pull_down"
                type="number"
                step="0.1"
                label="RPM Pull Down"
                :error-messages="errors.rpm_pull_down"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.rpm_rotation"
                type="number"
                step="0.1"
                label="RPM Rotation"
                :error-messages="errors.rpm_rotation"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>

      <!-- Observations Section -->
      <VCard class="mt-4">
        <VCardTitle>
          <VIcon
            icon="tabler-notes"
            class="me-2"
          />
          Observaciones
        </VCardTitle>
        <VCardText>
          <VTextarea
            v-model="formData.observations"
            label="Observaciones Generales"
            rows="4"
            :error-messages="errors.observations"
            :counter="1000"
          />
        </VCardText>
      </VCard>
    </VForm>

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
.drilling-report-edit {
  padding: 20px;
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: 1200px;
}

.edit-header {
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

.edit-title {
  font-size: 24px;
  font-weight: 600;
  margin-block: 0 4px;
  margin-inline: 0;
}

.edit-subtitle {
  margin: 0;
  color: #666;
}

.header-right {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .edit-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-right {
    justify-content: flex-start;
    inline-size: 100%;
  }
}
</style>
