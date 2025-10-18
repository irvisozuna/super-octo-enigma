<script setup lang="ts">
import { computed } from 'vue'
import { useProjects } from '../composables/useProjects'
import { useWells } from '../composables/useWells'
import { useTools } from '../composables/useTools'
import { useEmployees } from '../composables/useEmployees'
import { useEquipment } from '../composables/useEquipment'
import { useDocuments } from '../composables/useDocuments'

interface Props {
  projectId?: string
  wellId?: string
}

const props = defineProps<Props>()

const { projects } = useProjects()
const { wells } = useWells()
const { tools } = useTools()
const { employees } = useEmployees()
const { equipment } = useEquipment()
const { documents } = useDocuments()

const getProjectProgress = () => {
  if (projects.value.length === 0)
    return 0
  const activeProjects = projects.value.filter(p => p.status === 'active')

  return Math.round((activeProjects.length / projects.value.length) * 100)
}

const getWellProgress = () => {
  if (wells.value.length === 0)
    return 0
  const completedWells = wells.value.filter(w => w.status === 'completed')

  return Math.round((completedWells.length / wells.value.length) * 100)
}

const getToolProgress = () => {
  if (tools.value.length === 0)
    return 0
  const availableTools = tools.value.filter(t => t.status === 'available')

  return Math.round((availableTools.length / tools.value.length) * 100)
}

const getEmployeeProgress = () => {
  if (employees.value.length === 0)
    return 0
  const activeEmployees = employees.value.filter(e => e.status === 'active')

  return Math.round((activeEmployees.length / employees.value.length) * 100)
}

const getEquipmentProgress = () => {
  if (equipment.value.length === 0)
    return 0
  const availableEquipment = equipment.value.filter(e => e.status === 'available')

  return Math.round((availableEquipment.length / equipment.value.length) * 100)
}

const getDocumentProgress = () => {
  if (documents.value.length === 0)
    return 0
  const approvedDocuments = documents.value.filter(d => d.status === 'approved')

  return Math.round((approvedDocuments.length / documents.value.length) * 100)
}
</script>

<template>
  <div class="related-entities-summary">
    <VRow>
      <!-- Projects Summary -->
      <VCol
        cols="12"
        md="6"
        lg="3"
      >
        <VCard class="h-100">
          <VCardTitle class="d-flex align-center">
            <VIcon
              icon="mdi-folder"
              class="me-2"
              color="primary"
            />
            {{ $t('DrillingReportsModule.projects.title') }}
          </VCardTitle>
          <VCardText>
            <div class="text-h4 font-weight-bold text-primary">
              {{ projects.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.projects.totalProjects') }}
            </div>
            <VProgressLinear
              :model-value="getProjectProgress()"
              color="primary"
              height="8"
              class="mt-2"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Wells Summary -->
      <VCol
        cols="12"
        md="6"
        lg="3"
      >
        <VCard class="h-100">
          <VCardTitle class="d-flex align-center">
            <VIcon
              icon="mdi-well"
              class="me-2"
              color="success"
            />
            {{ $t('DrillingReportsModule.wells.title') }}
          </VCardTitle>
          <VCardText>
            <div class="text-h4 font-weight-bold text-success">
              {{ wells.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.wells.totalWells') }}
            </div>
            <VProgressLinear
              :model-value="getWellProgress()"
              color="success"
              height="8"
              class="mt-2"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Tools Summary -->
      <VCol
        cols="12"
        md="6"
        lg="3"
      >
        <VCard class="h-100">
          <VCardTitle class="d-flex align-center">
            <VIcon
              icon="mdi-tools"
              class="me-2"
              color="warning"
            />
            {{ $t('DrillingReportsModule.tools.title') }}
          </VCardTitle>
          <VCardText>
            <div class="text-h4 font-weight-bold text-warning">
              {{ tools.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.tools.totalTools') }}
            </div>
            <VProgressLinear
              :model-value="getToolProgress()"
              color="warning"
              height="8"
              class="mt-2"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Employees Summary -->
      <VCol
        cols="12"
        md="6"
        lg="3"
      >
        <VCard class="h-100">
          <VCardTitle class="d-flex align-center">
            <VIcon
              icon="mdi-account-group"
              class="me-2"
              color="info"
            />
            {{ $t('DrillingReportsModule.employees.title') }}
          </VCardTitle>
          <VCardText>
            <div class="text-h4 font-weight-bold text-info">
              {{ employees.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.employees.totalEmployees') }}
            </div>
            <VProgressLinear
              :model-value="getEmployeeProgress()"
              color="info"
              height="8"
              class="mt-2"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Equipment Summary -->
      <VCol
        cols="12"
        md="6"
        lg="3"
      >
        <VCard class="h-100">
          <VCardTitle class="d-flex align-center">
            <VIcon
              icon="mdi-cog"
              class="me-2"
              color="error"
            />
            {{ $t('DrillingReportsModule.equipment.title') }}
          </VCardTitle>
          <VCardText>
            <div class="text-h4 font-weight-bold text-error">
              {{ equipment.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.equipment.totalEquipment') }}
            </div>
            <VProgressLinear
              :model-value="getEquipmentProgress()"
              color="error"
              height="8"
              class="mt-2"
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Documents Summary -->
      <VCol
        cols="12"
        md="6"
        lg="3"
      >
        <VCard class="h-100">
          <VCardTitle class="d-flex align-center">
            <VIcon
              icon="mdi-file-document"
              class="me-2"
              color="purple"
            />
            {{ $t('DrillingReportsModule.documents.title') }}
          </VCardTitle>
          <VCardText>
            <div class="text-h4 font-weight-bold text-purple">
              {{ documents.length }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('DrillingReportsModule.documents.totalDocuments') }}
            </div>
            <VProgressLinear
              :model-value="getDocumentProgress()"
              color="purple"
              height="8"
              class="mt-2"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.related-entities-summary {
  inline-size: 100%;
}

.text-purple {
  color: #9c27b0 !important;
}
</style>
