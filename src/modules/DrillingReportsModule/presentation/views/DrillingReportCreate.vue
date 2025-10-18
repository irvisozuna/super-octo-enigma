<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDrillingReport } from '../composables/useDrillingReport'
import { useProjects } from '../composables/useProjects'
import { useWells } from '../composables/useWells'
import { useEquipment } from '../composables/useEquipment'

// Import dialog components
import ProjectCreateDialog from '../components/ProjectCreateDialog.vue'
import WellCreateDialog from '../components/WellCreateDialog.vue'
import EquipmentCreateDialog from '../components/EquipmentCreateDialog.vue'
import { useAppManager } from '@/composables/useAppManager'
import { useEmployee } from '@/modules/EmployeeModule/presentation/composables/useEmployee'

// Router
const router = useRouter()

// App Manager for dialogs
const { openDialog } = useAppManager()

// Composable
const {
  loading,
  error,
  createReport,
  clearError,
} = useDrillingReport()

// Form ref
const formRef = ref()

// Form data
const formData = ref({
  project_id: '',
  well_id: '',
  report_date: new Date().toISOString().split('T')[0], // Today's date
  shift: 'mixed',
  equipment_id: '',
  operator_day_id: '',
  helper1_day_id: '',
  helper2_day_id: '',
  operator_night_id: '',
  helper1_night_id: '',
  helper2_night_id: '',
  horometer_start_day: null,
  horometer_start_night: null,
  rpm_pull_down: null,
  rpm_rotation: null,
  observations: '',
})

// Local state
const showError = ref(false)
const loadingProjects = ref(false)
const loadingWells = ref(false)
const loadingEquipment = ref(false)
const loadingEmployees = ref(false)

// Options
const projectOptions = ref([])
const wellOptions = ref([])
const equipmentOptions = ref([])
const employeeOptions = ref([])

const shiftOptions = [
  { title: 'Día', value: 'day' },
  { title: 'Noche', value: 'night' },
  { title: 'Mixto', value: 'mixed' },
]

// Validation rules
const rules = {
  required: (value: any) => !!value || 'Campo requerido',
  dateNotFuture: (value: string) => {
    if (!value)
      return true
    const date = new Date(value)
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    return date <= today || 'La fecha no puede ser futura'
  },
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Máximo ${max} caracteres`,
}

// Computed
const isFormValid = computed(() => {
  return formData.value.project_id
         && formData.value.well_id
         && formData.value.report_date
         && formData.value.shift
})

// Methods
const handleProjectChange = async () => {
  formData.value.well_id = ''
  await loadWells()
}

const handleShiftChange = () => {
  // Reset personnel when shift changes
  if (formData.value.shift === 'day') {
    formData.value.operator_night_id = ''
    formData.value.helper1_night_id = ''
    formData.value.helper2_night_id = ''
  }
  else if (formData.value.shift === 'night') {
    formData.value.operator_day_id = ''
    formData.value.helper1_day_id = ''
    formData.value.helper2_day_id = ''
  }
}

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return

  try {
    await createReport(formData.value)
    router.push('/drilling/reports')
  }
  catch (err) {
    console.error('Error creating report:', err)
  }
}

const goBack = () => {
  router.push('/drilling/reports')
}

// Dialog methods
const openCreateProjectDialog = () => {
  openDialog(ProjectCreateDialog, {}, {
    width: '800px',
    persistent: true,
  }).then(result => {
    if (result === 'submit')
      loadProjects() // Reload projects after creation
  })
}

const openCreateWellDialog = () => {
  openDialog(WellCreateDialog, {}, {
    width: '800px',
    persistent: true,
  }).then(result => {
    if (result === 'submit')
      loadWells() // Reload wells after creation
  })
}

const openCreateEquipmentDialog = () => {
  openDialog(EquipmentCreateDialog, {}, {
    width: '800px',
    persistent: true,
  }).then(result => {
    if (result === 'submit')
      loadEquipment() // Reload equipment after creation
  })
}

// Load data methods
const loadProjects = async () => {
  loadingProjects.value = true
  try {
    // Load projects from backend
    const { projectsStore } = useProjects()

    await projectsStore.fetchProjects()
    projectOptions.value = projectsStore.projects.map(project => ({
      title: project.name,
      value: project.id,
    }))
  }
  catch (err) {
    console.error('Error loading projects:', err)
    projectOptions.value = [] // Show empty list if no projects
  }
  finally {
    loadingProjects.value = false
  }
}

const loadWells = async () => {
  if (!formData.value.project_id)
    return

  loadingWells.value = true
  try {
    // Load wells from backend based on selected project
    const { wellsStore } = useWells()

    await wellsStore.fetchWellsByProject(formData.value.project_id)
    wellOptions.value = wellsStore.wells.map(well => ({
      title: well.name,
      value: well.id,
    }))
  }
  catch (err) {
    console.error('Error loading wells:', err)
    wellOptions.value = [] // Show empty list if no wells
  }
  finally {
    loadingWells.value = false
  }
}

const loadEquipment = async () => {
  loadingEquipment.value = true
  try {
    // Load equipment from backend
    const { equipmentStore } = useEquipment()

    await equipmentStore.fetchEquipment()
    equipmentOptions.value = equipmentStore.equipment.map(equipment => ({
      title: equipment.name,
      value: equipment.id,
    }))
  }
  catch (err) {
    console.error('Error loading equipment:', err)
    equipmentOptions.value = [] // Show empty list if no equipment
  }
  finally {
    loadingEquipment.value = false
  }
}

const loadEmployees = async () => {
  loadingEmployees.value = true
  try {
    // Load employees from EmployeeModule
    const { employeeStore } = useEmployee()

    await employeeStore.fetchList()
    employeeOptions.value = employeeStore.items.map(emp => ({
      title: `${emp.first_name} ${emp.last_name}`,
      value: emp.id,
    }))
  }
  catch (err) {
    console.error('Error loading employees:', err)
  }
  finally {
    loadingEmployees.value = false
  }
}

// Watch for errors
watch(error, newError => {
  if (newError)
    showError.value = true
})

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadProjects(),
    loadEquipment(),
    loadEmployees(),
  ])
})
</script>

<template>
  <div class="drilling-report-create">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <VBtn
        icon="tabler-arrow-left"
        variant="text"
        class="mr-4"
        @click="goBack"
      />
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ $t('DrillingReportsModule.create.title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          {{ $t('DrillingReportsModule.create.subtitle') }}
        </p>
      </div>
    </div>

    <!-- Form -->
    <VCard>
      <VCardText>
        <VForm
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <!-- Project Selection -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.project_id"
                :label="$t('DrillingReportsModule.fields.project')"
                :items="projectOptions"
                :rules="[rules.required]"
                :loading="loadingProjects"
                @update:model-value="handleProjectChange"
              />
              <div
                v-if="!loadingProjects && projectOptions.length === 0"
                class="text-caption text-warning mt-1"
              >
                <VIcon
                  icon="tabler-info-circle"
                  size="small"
                  class="mr-1"
                />
                No hay proyectos registrados. <a
                  href="#"
                  class="text-primary"
                  @click.prevent="openCreateProjectDialog"
                >Crear proyecto</a>
              </div>
            </VCol>

            <!-- Well Selection -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="formData.well_id"
                :label="$t('DrillingReportsModule.fields.well')"
                :items="wellOptions"
                :rules="[rules.required]"
                :loading="loadingWells"
                :disabled="!formData.project_id"
              />
              <div
                v-if="!loadingWells && wellOptions.length === 0 && formData.project_id"
                class="text-caption text-warning mt-1"
              >
                <VIcon
                  icon="tabler-info-circle"
                  size="small"
                  class="mr-1"
                />
                No hay pozos registrados para este proyecto. <a
                  href="#"
                  class="text-primary"
                  @click.prevent="openCreateWellDialog"
                >Crear pozo</a>
              </div>
            </VCol>

            <!-- Report Date -->
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="formData.report_date"
                :label="$t('DrillingReportsModule.fields.reportDate')"
                type="date"
                :rules="[rules.required, rules.dateNotFuture]"
              />
            </VCol>

            <!-- Shift -->
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="formData.shift"
                :label="$t('DrillingReportsModule.fields.shift')"
                :items="shiftOptions"
                :rules="[rules.required]"
                @update:model-value="handleShiftChange"
              />
            </VCol>

            <!-- Equipment -->
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="formData.equipment_id"
                :label="$t('DrillingReportsModule.fields.equipment')"
                :items="equipmentOptions"
                :loading="loadingEquipment"
                clearable
              />
              <div
                v-if="!loadingEquipment && equipmentOptions.length === 0"
                class="text-caption text-warning mt-1"
              >
                <VIcon
                  icon="tabler-info-circle"
                  size="small"
                  class="mr-1"
                />
                No hay equipos registrados. <a
                  href="#"
                  class="text-primary"
                  @click.prevent="openCreateEquipmentDialog"
                >Crear equipo</a>
              </div>
            </VCol>

            <!-- Personnel Section -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <h2 class="text-h5 mb-4 font-weight-bold">
                {{ $t('DrillingReportsModule.personnel.title') }}
              </h2>
            </VCol>
            <!-- Day Shift Personnel -->
            <VCol
              v-if="formData.shift === 'day' || formData.shift === 'mixed'"
              cols="6"
            >
              <div>
                <VCol>
                  <h3 class="text-h6 mb-3 font-weight-medium">
                    {{ $t('DrillingReportsModule.personnel.dayShift') }}
                  </h3>
                </VCol>

                <VCol>
                  <VSelect
                    v-model="formData.operator_day_id"
                    :label="$t('DrillingReportsModule.fields.operator')"
                    :items="employeeOptions"
                    :loading="loadingEmployees"
                    :rules="[rules.required]"
                  />
                </VCol>

                <VCol>
                  <VSelect
                    v-model="formData.helper1_day_id"
                    :label="$t('DrillingReportsModule.fields.helper1')"
                    :items="employeeOptions"
                    :loading="loadingEmployees"
                    clearable
                  />
                </VCol>

                <VCol>
                  <VSelect
                    v-model="formData.helper2_day_id"
                    :label="$t('DrillingReportsModule.fields.helper2')"
                    :items="employeeOptions"
                    :loading="loadingEmployees"
                    clearable
                  />
                </VCol>
              </div>
            </VCol>
            <VCol cols="6">
              <!-- Night Shift Personnel -->
              <div v-if="formData.shift === 'night' || formData.shift === 'mixed'">
                <VCol cols="12">
                  <h3 class="text-h6 mb-3 font-weight-medium">
                    {{ $t('DrillingReportsModule.personnel.nightShift') }}
                  </h3>
                </VCol>

                <VCol>
                  <VSelect
                    v-model="formData.operator_night_id"
                    :label="$t('DrillingReportsModule.fields.operator')"
                    :items="employeeOptions"
                    :loading="loadingEmployees"
                    :rules="[rules.required]"
                  />
                </VCol>

                <VCol>
                  <VSelect
                    v-model="formData.helper1_night_id"
                    :label="$t('DrillingReportsModule.fields.helper1')"
                    :items="employeeOptions"
                    :loading="loadingEmployees"
                    clearable
                  />
                </VCol>

                <VCol>
                  <VSelect
                    v-model="formData.helper2_night_id"
                    :label="$t('DrillingReportsModule.fields.helper2')"
                    :items="employeeOptions"
                    :loading="loadingEmployees"
                    clearable
                  />
                </VCol>
              </div>
            </VCol>

            <!-- Horometer Section -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <h2 class="text-h5 mb-4 font-weight-bold">
                {{ $t('DrillingReportsModule.horometer.title') }}
              </h2>
            </VCol>

            <VCol
              v-if="formData.shift === 'day' || formData.shift === 'mixed'"
              cols="12"
              md="6"
              lg="4"
            >
              <VTextField
                v-model.number="formData.horometer_start_day"
                :label="$t('DrillingReportsModule.fields.horometerStartDay')"
                type="number"
                step="0.1"
                min="0"
              />
            </VCol>

            <VCol
              v-if="formData.shift === 'night' || formData.shift === 'mixed'"
              cols="12"
              md="6"
              lg="4"
            >
              <VTextField
                v-model.number="formData.horometer_start_night"
                :label="$t('DrillingReportsModule.fields.horometerStartNight')"
                type="number"
                step="0.1"
                min="0"
                :disabled="formData.shift === 'day'"
              />
            </VCol>

            <!-- RPM Section -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <h2 class="text-h5 mb-4 font-weight-bold">
                {{ $t('DrillingReportsModule.rpm.title') }}
              </h2>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.rpm_pull_down"
                :label="$t('DrillingReportsModule.fields.rpmPullDown')"
                type="number"
                step="0.1"
                min="0"
                max="500"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="formData.rpm_rotation"
                :label="$t('DrillingReportsModule.fields.rpmRotation')"
                type="number"
                step="0.1"
                min="0"
                max="500"
              />
            </VCol>

            <!-- Observations -->
            <VCol cols="12">
              <VDivider class="my-4" />
              <h2 class="text-h5 mb-4 font-weight-bold">
                {{ $t('DrillingReportsModule.observations.title') }}
              </h2>
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="formData.observations"
                :label="$t('DrillingReportsModule.fields.observations')"
                :rules="[rules.maxLength(1000)]"
                rows="4"
                counter="1000"
              />
            </VCol>
          </VRow>

          <!-- Actions -->
          <div class="d-flex justify-end gap-4 mt-6">
            <VBtn
              variant="outlined"
              @click="goBack"
            >
              {{ $t('DrillingReportsModule.common.cancel') }}
            </VBtn>

            <VBtn
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="!isFormValid"
            >
              {{ $t('DrillingReportsModule.common.saveDraft') }}
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>

    <!-- Error Snackbar -->
    <VSnackbar
      v-model="showError"
      color="error"
      timeout="5000"
    >
      {{ error }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.drilling-report-create {
  padding: 24px;
}
</style>
