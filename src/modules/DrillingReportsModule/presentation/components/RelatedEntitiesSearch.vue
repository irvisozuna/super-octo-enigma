<script setup lang="ts">
import { computed, ref } from 'vue'
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
  (e: 'resultSelected', result: any): void
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

const searchQuery = ref('')
const entityType = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const status = ref('')
const searching = ref(false)
const hasSearched = ref(false)
const searchResults = ref<any[]>([])

const entityTypeOptions = computed(() => [
  { title: t('DrillingReportsModule.projects.title'), value: 'project' },
  { title: t('DrillingReportsModule.wells.title'), value: 'well' },
  { title: t('DrillingReportsModule.tools.title'), value: 'tool' },
  { title: t('DrillingReportsModule.employees.title'), value: 'employee' },
  { title: t('DrillingReportsModule.equipment.title'), value: 'equipment' },
  { title: t('DrillingReportsModule.documents.title'), value: 'document' },
])

const statusOptions = computed(() => [
  { title: t('DrillingReportsModule.status.active'), value: 'active' },
  { title: t('DrillingReportsModule.status.completed'), value: 'completed' },
  { title: t('DrillingReportsModule.status.draft'), value: 'draft' },
  { title: t('DrillingReportsModule.status.approved'), value: 'approved' },
  { title: t('DrillingReportsModule.status.rejected'), value: 'rejected' },
])

const handleSearch = async () => {
  if (!searchQuery.value.trim())
    return

  searching.value = true
  hasSearched.value = true

  try {
    const results: any[] = []

    // Search in projects
    if (!entityType.value || entityType.value === 'project') {
      const projectResults = projects.value.filter(project =>
        project.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        || project.description?.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )

      results.push(...projectResults.map(p => ({
        ...p,
        type: 'project',
        title: p.name,
        description: p.description,
      })))
    }

    // Search in wells
    if (!entityType.value || entityType.value === 'well') {
      const wellResults = wells.value.filter(well =>
        well.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )

      results.push(...wellResults.map(w => ({
        ...w,
        type: 'well',
        title: w.name,
        description: `Pozo de ${w.well_type}`,
      })))
    }

    // Search in tools
    if (!entityType.value || entityType.value === 'tool') {
      const toolResults = tools.value.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        || tool.manufacturer.toLowerCase().includes(searchQuery.value.toLowerCase())
        || tool.model.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )

      results.push(...toolResults.map(t => ({
        ...t,
        type: 'tool',
        title: t.name,
        description: `${t.manufacturer} ${t.model}`,
      })))
    }

    // Search in employees
    if (!entityType.value || entityType.value === 'employee') {
      const employeeResults = employees.value.filter(employee =>
        employee.first_name.toLowerCase().includes(searchQuery.value.toLowerCase())
        || employee.last_name.toLowerCase().includes(searchQuery.value.toLowerCase())
        || employee.position.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )

      results.push(...employeeResults.map(e => ({
        ...e,
        type: 'employee',
        title: `${e.first_name} ${e.last_name}`,
        description: e.position,
      })))
    }

    // Search in equipment
    if (!entityType.value || entityType.value === 'equipment') {
      const equipmentResults = equipment.value.filter(eq =>
        eq.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        || eq.manufacturer.toLowerCase().includes(searchQuery.value.toLowerCase())
        || eq.model.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )

      results.push(...equipmentResults.map(e => ({
        ...e,
        type: 'equipment',
        title: e.name,
        description: `${e.manufacturer} ${e.model}`,
      })))
    }

    // Search in documents
    if (!entityType.value || entityType.value === 'document') {
      const documentResults = documents.value.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        || doc.description?.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )

      results.push(...documentResults.map(d => ({
        ...d,
        type: 'document',
        title: d.name,
        description: d.description || d.file_name,
      })))
    }

    searchResults.value = results
  }
  catch (error) {
    console.error('Search error:', error)
  }
  finally {
    searching.value = false
  }
}

const handleClear = () => {
  searchQuery.value = ''
  entityType.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  status.value = ''
  searchResults.value = []
  hasSearched.value = false
}

const handleResultClick = (result: any) => {
  emit('resultSelected', result)
}

const getEntityIcon = (type: string) => {
  const icons: Record<string, string> = {
    project: 'mdi-folder',
    well: 'mdi-well',
    tool: 'mdi-tools',
    employee: 'mdi-account',
    equipment: 'mdi-cog',
    document: 'mdi-file-document',
  }

  return icons[type] || 'mdi-help-circle'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    completed: 'info',
    draft: 'warning',
    approved: 'success',
    rejected: 'error',
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: t('DrillingReportsModule.status.active'),
    completed: t('DrillingReportsModule.status.completed'),
    draft: t('DrillingReportsModule.status.draft'),
    approved: t('DrillingReportsModule.status.approved'),
    rejected: t('DrillingReportsModule.status.rejected'),
  }

  return labels[status] || status
}
</script>

<template>
  <div class="related-entities-search">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-magnify"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.advancedSearch') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSearch">
          <VRow>
            <!-- Search Query -->
            <VCol
              cols="12"
              md="8"
            >
              <VTextField
                v-model="searchQuery"
                :label="$t('DrillingReportsModule.common.searchQuery')"
                :placeholder="$t('DrillingReportsModule.common.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                clearable
              />
            </VCol>

            <!-- Entity Type -->
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="entityType"
                :items="entityTypeOptions"
                :label="$t('DrillingReportsModule.common.entityType')"
                clearable
              />
            </VCol>

            <!-- Date Range -->
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="dateFrom"
                :label="$t('DrillingReportsModule.filters.dateFrom')"
                type="date"
              />
            </VCol>

            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="dateTo"
                :label="$t('DrillingReportsModule.filters.dateTo')"
                type="date"
              />
            </VCol>

            <!-- Status -->
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="status"
                :items="statusOptions"
                :label="$t('DrillingReportsModule.common.status')"
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
                :loading="searching"
              >
                {{ $t('DrillingReportsModule.common.search') }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>

    <!-- Search Results -->
    <VCard
      v-if="searchResults.length > 0"
      class="mt-4"
    >
      <VCardTitle>
        <VIcon
          icon="mdi-format-list-bulleted"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.searchResults') }}
        <VChip
          class="ms-2"
          color="primary"
        >
          {{ searchResults.length }}
        </VChip>
      </VCardTitle>

      <VCardText>
        <VList>
          <VListItem
            v-for="result in searchResults"
            :key="result.id"
            @click="handleResultClick(result)"
          >
            <template #prepend>
              <VIcon :icon="getEntityIcon(result.type)" />
            </template>
            <VListItemTitle>{{ result.title }}</VListItemTitle>
            <VListItemSubtitle>{{ result.description }}</VListItemSubtitle>
            <template #append>
              <VChip
                :color="getStatusColor(result.status)"
                size="small"
              >
                {{ getStatusLabel(result.status) }}
              </VChip>
            </template>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>

    <!-- No Results -->
    <VCard
      v-else-if="hasSearched && searchResults.length === 0"
      class="mt-4"
    >
      <VCardText class="text-center py-8">
        <VIcon
          icon="mdi-magnify-close"
          size="48"
          class="text-medium-emphasis mb-4"
        />
        <div class="text-h6 text-medium-emphasis mb-2">
          {{ $t('DrillingReportsModule.common.noResults') }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ $t('DrillingReportsModule.common.noResultsDescription') }}
        </div>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.related-entities-search {
  inline-size: 100%;
}
</style>
