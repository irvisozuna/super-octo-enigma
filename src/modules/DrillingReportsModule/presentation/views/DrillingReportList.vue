<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDrillingReport } from '../composables/useDrillingReport'
import DrillingReportCard from '../components/organisms/DrillingReportCard.vue'

// Router
const router = useRouter()

// Composable
const {
  reports,
  loading,
  error,
  pagination,
  fetchReports,
  setFilters,
  resetFilters: resetFiltersComposable,
  clearError,
  currentPage,
  lastPage,
} = useDrillingReport()

// Local state
const searchQuery = ref('')
const statusFilter = ref('')
const shiftFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const showError = ref(false)

// Computed
const statusOptions = computed(() => [
  { title: 'Borrador', value: 'draft' },
  { title: 'Completado', value: 'completed' },
  { title: 'Aprobado', value: 'approved' },
  { title: 'Rechazado', value: 'rejected' },
])

const shiftOptions = computed(() => [
  { title: 'Día', value: 'day' },
  { title: 'Noche', value: 'night' },
  { title: 'Mixto', value: 'mixed' },
])

// Methods
const handleSearch = () => {
  setFilters({ search: searchQuery.value, page: 1 })
  fetchReports()
}

const handleFilterChange = () => {
  setFilters({
    status: statusFilter.value,
    shift: shiftFilter.value,
    date_from: dateFrom.value,
    date_to: dateTo.value,
    page: 1,
  })
  fetchReports()
}

const handlePageChange = (page: number) => {
  setFilters({ page })
  fetchReports()
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  shiftFilter.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  resetFiltersComposable()
  fetchReports()
}

const navigateToCreate = () => {
  router.push('/drilling/reports/create')
}

const handleViewReport = (report: any) => {
  router.push(`/drilling/reports/${report.id}`)
}

const handleEditReport = (report: any) => {
  router.push(`/drilling/reports/${report.id}/edit`)
}

const handleDeleteReport = async (report: any) => {
  if (confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
    try {
      await deleteReport(report.id, 'current-user-id') // TODO: Get from auth
      await fetchReports()
    }
    catch (err) {
      console.error('Error deleting report:', err)
    }
  }
}

const handleApproveReport = (report: any) => {
  router.push(`/drilling/reports/${report.id}/approve`)
}

const handleRejectReport = (report: any) => {
  router.push(`/drilling/reports/${report.id}/reject`)
}

const handleCompleteReport = (report: any) => {
  router.push(`/drilling/reports/${report.id}/complete`)
}

// Watch for errors
watch(error, newError => {
  if (newError)
    showError.value = true
})

// Lifecycle
onMounted(async () => {
  await fetchReports()
})
</script>

<template>
  <div class="drilling-report-list">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ $t('DrillingReportsModule.navigation.reports') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ $t('DrillingReportsModule.common.subtitle') }}
        </p>
      </div>

      <VBtn
        v-can="'drilling.reports.create'"
        color="primary"
        size="large"
        prepend-icon="tabler-plus"
        @click="navigateToCreate"
      >
        {{ $t('DrillingReportsModule.common.newReport') }}
      </VBtn>
    </div>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="searchQuery"
              :label="$t('DrillingReportsModule.filters.search')"
              prepend-inner-icon="tabler-search"
              clearable
              @input="handleSearch"
            />
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <VSelect
              v-model="statusFilter"
              :label="$t('DrillingReportsModule.filters.status')"
              :items="statusOptions"
              clearable
              @update:model-value="handleFilterChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <VSelect
              v-model="shiftFilter"
              :label="$t('DrillingReportsModule.filters.shift')"
              :items="shiftOptions"
              clearable
              @update:model-value="handleFilterChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="dateFrom"
              :label="$t('DrillingReportsModule.filters.dateFrom')"
              type="date"
              @update:model-value="handleFilterChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="dateTo"
              :label="$t('DrillingReportsModule.filters.dateTo')"
              type="date"
              @update:model-value="handleFilterChange"
            />
          </VCol>

          <VCol
            cols="12"
            md="1"
          >
            <VBtn
              color="secondary"
              variant="outlined"
              @click="resetFilters"
            >
              {{ $t('DrillingReportsModule.common.reset') }}
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Reports Grid -->
    <VRow v-if="!loading">
      <VCol
        v-for="report in reports"
        :key="report.id"
        cols="12"
        md="6"
        lg="4"
      >
        <DrillingReportCard
          :report="report"
          @view="handleViewReport"
          @edit="handleEditReport"
          @delete="handleDeleteReport"
          @approve="handleApproveReport"
          @reject="handleRejectReport"
          @complete="handleCompleteReport"
        />
      </VCol>
    </VRow>

    <!-- Loading State -->
    <div
      v-else
      class="text-center py-8"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
      <p class="text-body-1 mt-4">
        {{ $t('DrillingReportsModule.common.loading') }}
      </p>
    </div>

    <!-- Empty State -->
    <VCard
      v-if="!loading && reports.length === 0"
      class="text-center py-8"
    >
      <VCardText>
        <VIcon
          icon="tabler-file-text"
          size="64"
          color="grey-lighten-1"
        />
        <h3 class="text-h6 mt-4">
          {{ $t('DrillingReportsModule.common.noReports') }}
        </h3>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('DrillingReportsModule.common.noReportsDescription') }}
        </p>
        <VBtn
          v-can="'drilling.reports.create'"
          color="primary"
          class="mt-4"
          @click="navigateToCreate"
        >
          {{ $t('DrillingReportsModule.common.createFirstReport') }}
        </VBtn>
      </VCardText>
    </VCard>

    <!-- Pagination -->
    <VPagination
      v-if="lastPage > 1"
      v-model="currentPage"
      :length="lastPage"
      :total-visible="7"
      class="mt-6"
      @update:model-value="handlePageChange"
    />

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
.drilling-report-list {
  padding: 24px;
}
</style>
