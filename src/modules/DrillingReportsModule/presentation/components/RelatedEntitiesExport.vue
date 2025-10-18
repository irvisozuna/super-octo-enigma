<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjects } from '../composables/useProjects'
import { useWells } from '../composables/useWells'
import { useTools } from '../composables/useTools'
import { useEmployees } from '../composables/useEmployees'
import { useEquipment } from '../composables/useEquipment'
import { useDocuments } from '../composables/useDocuments'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'exported', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const { projects, fetchProjects } = useProjects()
const { wells, fetchWellsByProject } = useWells()
const { tools, fetchTools } = useTools()
const { employees, fetchEmployees } = useEmployees()
const { equipment, fetchEquipment } = useEquipment()
const { documents, fetchDocumentsByEntity } = useDocuments()

const exportType = ref('')
const format = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const selectedFields = ref<string[]>([])
const statusFilter = ref('')
const searchFilter = ref('')
const exporting = ref(false)
const exportProgress = ref(0)
const exportSuccess = ref(false)
const exportedData = ref<any>(null)

const exportTypeOptions = computed(() => [
  { title: t('DrillingReportsModule.projects.title'), value: 'project' },
  { title: t('DrillingReportsModule.wells.title'), value: 'well' },
  { title: t('DrillingReportsModule.tools.title'), value: 'tool' },
  { title: t('DrillingReportsModule.employees.title'), value: 'employee' },
  { title: t('DrillingReportsModule.equipment.title'), value: 'equipment' },
  { title: t('DrillingReportsModule.documents.title'), value: 'document' },
])

const formatOptions = computed(() => [
  { title: 'Excel (.xlsx)', value: 'xlsx' },
  { title: 'CSV (.csv)', value: 'csv' },
  { title: 'PDF (.pdf)', value: 'pdf' },
  { title: 'JSON (.json)', value: 'json' },
])

const fieldOptions = computed(() => {
  const fields: Record<string, any[]> = {
    project: [
      { title: t('DrillingReportsModule.projects.name'), value: 'name' },
      { title: t('DrillingReportsModule.projects.description'), value: 'description' },
      { title: t('DrillingReportsModule.projects.startDate'), value: 'start_date' },
      { title: t('DrillingReportsModule.projects.endDate'), value: 'end_date' },
      { title: t('DrillingReportsModule.projects.status'), value: 'status' },
      { title: t('DrillingReportsModule.projects.budget'), value: 'budget' },
    ],
    well: [
      { title: t('DrillingReportsModule.wells.name'), value: 'name' },
      { title: t('DrillingReportsModule.wells.type'), value: 'well_type' },
      { title: t('DrillingReportsModule.wells.depthPlanned'), value: 'depth_planned' },
      { title: t('DrillingReportsModule.wells.depthActual'), value: 'depth_actual' },
      { title: t('DrillingReportsModule.wells.status'), value: 'status' },
    ],
    tool: [
      { title: t('DrillingReportsModule.tools.name'), value: 'name' },
      { title: t('DrillingReportsModule.tools.type'), value: 'tool_type' },
      { title: t('DrillingReportsModule.tools.manufacturer'), value: 'manufacturer' },
      { title: t('DrillingReportsModule.tools.model'), value: 'model' },
      { title: t('DrillingReportsModule.tools.status'), value: 'status' },
    ],
    employee: [
      { title: t('DrillingReportsModule.employees.firstName'), value: 'first_name' },
      { title: t('DrillingReportsModule.employees.lastName'), value: 'last_name' },
      { title: t('DrillingReportsModule.employees.position'), value: 'position' },
      { title: t('DrillingReportsModule.employees.department'), value: 'department' },
      { title: t('DrillingReportsModule.employees.status'), value: 'status' },
    ],
    equipment: [
      { title: t('DrillingReportsModule.equipment.name'), value: 'name' },
      { title: t('DrillingReportsModule.equipment.type'), value: 'equipment_type' },
      { title: t('DrillingReportsModule.equipment.manufacturer'), value: 'manufacturer' },
      { title: t('DrillingReportsModule.equipment.model'), value: 'model' },
      { title: t('DrillingReportsModule.equipment.status'), value: 'status' },
    ],
    document: [
      { title: t('DrillingReportsModule.documents.name'), value: 'name' },
      { title: t('DrillingReportsModule.documents.type'), value: 'document_type' },
      { title: t('DrillingReportsModule.documents.fileName'), value: 'file_name' },
      { title: t('DrillingReportsModule.documents.fileSize'), value: 'file_size_bytes' },
      { title: t('DrillingReportsModule.documents.status'), value: 'status' },
    ],
  }

  return fields[exportType.value] || []
})

const statusOptions = computed(() => [
  { title: t('DrillingReportsModule.status.active'), value: 'active' },
  { title: t('DrillingReportsModule.status.completed'), value: 'completed' },
  { title: t('DrillingReportsModule.status.draft'), value: 'draft' },
  { title: t('DrillingReportsModule.status.approved'), value: 'approved' },
  { title: t('DrillingReportsModule.status.rejected'), value: 'rejected' },
])

const handleExport = async () => {
  if (!exportType.value || !format.value)
    return

  exporting.value = true
  exportProgress.value = 0
  exportSuccess.value = false

  try {
    // Simulate export progress
    const progressInterval = setInterval(() => {
      if (exportProgress.value < 90)
        exportProgress.value += 10
    }, 200)

    // Get data based on export type
    let data: any[] = []

    switch (exportType.value) {
    case 'project':
      data = projects.value
        break;
    case 'well':
      data = wells.value
        break;
    case 'tool':
      data = tools.value
        break;
    case 'employee':
      data = employees.value
        break;
    case 'equipment':
      data = equipment.value
        break;
    case 'document':
      data = documents.value
        break;
    }

    // Apply filters
    if (statusFilter.value)
      data = data.filter(item => item.status === statusFilter.value)

    if (searchFilter.value) {
      data = data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchFilter.value.toLowerCase()),
        ),
      )
    }

    // Apply field selection
    if (selectedFields.value.length > 0) {
      data = data.map(item => {
        const filteredItem: any = {}

        selectedFields.value.forEach(field => {
          if (item[field] !== undefined)
            filteredItem[field] = item[field]
        })

        return filteredItem
      })
    }

    // Simulate export completion
    setTimeout(() => {
      clearInterval(progressInterval)
      exportProgress.value = 100
      exportSuccess.value = true
      exportedData.value = data
      exporting.value = false
    }, 2000)
  }
  catch (error) {
    console.error('Export error:', error)
    exporting.value = false
  }
}

const handleClear = () => {
  exportType.value = ''
  format.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  selectedFields.value = []
  statusFilter.value = ''
  searchFilter.value = ''
  exportSuccess.value = false
  exportedData.value = null
}

const handleDownload = () => {
  if (!exportedData.value)
    return

  const dataStr = JSON.stringify(exportedData.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  const link = document.createElement('a')

  link.href = url
  link.download = `export_${exportType.value}_${new Date().toISOString().split('T')[0]}.json`
  link.click()

  URL.revokeObjectURL(url)
}

watch(exportType, () => {
  selectedFields.value = []
})
</script>

<template>
  <div class="related-entities-export">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-download"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.exportData') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleExport">
          <VRow>
            <!-- Entity Type -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="exportType"
                :items="exportTypeOptions"
                :label="$t('DrillingReportsModule.common.entityType')"
                :rules="[v => !!v || 'Debe seleccionar un tipo de entidad']"
                required
              />
            </VCol>

            <!-- Format -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="format"
                :items="formatOptions"
                :label="$t('DrillingReportsModule.common.format')"
                :rules="[v => !!v || 'Debe seleccionar un formato']"
                required
              />
            </VCol>

            <!-- Date Range -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="dateFrom"
                :label="$t('DrillingReportsModule.filters.dateFrom')"
                type="date"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="dateTo"
                :label="$t('DrillingReportsModule.filters.dateTo')"
                type="date"
              />
            </VCol>

            <!-- Fields to Include -->
            <VCol cols="12">
              <VSelect
                v-model="selectedFields"
                :items="fieldOptions"
                :label="$t('DrillingReportsModule.common.fieldsToInclude')"
                multiple
                chips
                closable-chips
              />
            </VCol>

            <!-- Filters -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="statusFilter"
                :items="statusOptions"
                :label="$t('DrillingReportsModule.common.status')"
                clearable
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="searchFilter"
                :label="$t('DrillingReportsModule.common.search')"
                prepend-inner-icon="mdi-magnify"
                clearable
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol
              cols="12"
              class="d-flex justify-end"
            >
              <VBtn
                color="grey"
                variant="text"
                @click="handleClear"
              >
                {{ $t('DrillingReportsModule.common.clear') }}
              </VBtn>
              <VBtn
                color="primary"
                type="submit"
                :loading="exporting"
                :disabled="!exportType || !format"
              >
                <VIcon
                  icon="mdi-download"
                  class="me-2"
                />
                {{ $t('DrillingReportsModule.common.export') }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>

    <!-- Export Progress -->
    <VCard
      v-if="exporting"
      class="mt-4"
    >
      <VCardText>
        <div class="text-center">
          <VProgressCircular
            :model-value="exportProgress"
            :size="60"
            :width="6"
            color="primary"
            class="mb-4"
          >
            {{ exportProgress }}%
          </VProgressCircular>
          <div class="text-h6 mb-2">
            {{ $t('DrillingReportsModule.common.exporting') }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ $t('DrillingReportsModule.common.exportProgress') }}
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Export Success -->
    <VCard
      v-if="exportSuccess"
      class="mt-4"
    >
      <VCardText>
        <div class="text-center">
          <VIcon
            icon="mdi-check-circle"
            size="48"
            color="success"
            class="mb-4"
          />
          <div class="text-h6 mb-2 text-success">
            {{ $t('DrillingReportsModule.common.exportSuccess') }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            {{ $t('DrillingReportsModule.common.exportSuccessDescription') }}
          </div>
          <VBtn
            color="primary"
            @click="handleDownload"
          >
            <VIcon
              icon="mdi-download"
              class="me-2"
            />
            {{ $t('DrillingReportsModule.common.downloadFile') }}
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.related-entities-export {
  inline-size: 100%;
}
</style>
