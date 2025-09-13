<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useConcessionStore } from '../stores/concessionStore'

// Components
import ConcessionOverviewTab from '../components/organisms/ConcessionOverviewTab.vue'
import ConcessionVehiclesTab from '../components/organisms/ConcessionVehiclesTab.vue'
import ConcessionHoldersTab from '../components/organisms/ConcessionHoldersTab.vue'
import ConcessionFinesTab from '../components/organisms/ConcessionFinesTab.vue'
import ConcessionPaymentsTab from '../components/organisms/ConcessionPaymentsTab.vue'
import ConcessionDocumentsTab from '../components/organisms/ConcessionDocumentsTab.vue'
import ConcessionHistoryTab from '../components/organisms/ConcessionHistoryTab.vue'

// Composables
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const concessionStore = useConcessionStore()

// Reactive data
const loading = ref(true)
const activeTab = ref('overview')
const concessionId = computed(() => route.params.id as string)

// Computed
const concession = computed(() => concessionStore.selectedItem)

const tabs = computed(() => [
  {
    value: 'overview',
    title: t('concession.tabs.overview'),
    icon: 'tabler-info-circle',
    component: ConcessionOverviewTab,
  },
  {
    value: 'vehicles',
    title: t('concession.tabs.vehicles'),
    icon: 'tabler-car',
    component: ConcessionVehiclesTab,
    badge: concession.value?.active_vehicles_count || 0,
  },
  {
    value: 'holders',
    title: t('concession.tabs.holders'),
    icon: 'tabler-users',
    component: ConcessionHoldersTab,
  },
  {
    value: 'fines',
    title: t('concession.tabs.fines'),
    icon: 'tabler-file-dollar',
    component: ConcessionFinesTab,
    badge: concession.value?.unpaid_fines_count || 0,
    badgeColor: concession.value?.unpaid_fines_count > 0 ? 'error' : 'default',
  },
  {
    value: 'payments',
    title: t('concession.tabs.payments'),
    icon: 'tabler-credit-card',
    component: ConcessionPaymentsTab,
  },
  {
    value: 'documents',
    title: t('concession.tabs.documents'),
    icon: 'tabler-file-text',
    component: ConcessionDocumentsTab,
    badge: concession.value?.documents_count || 0,
  },
  {
    value: 'history',
    title: t('concession.tabs.history'),
    icon: 'tabler-history',
    component: ConcessionHistoryTab,
  },
])

const currentTabConfig = computed(() =>
  tabs.value.find(tab => tab.value === activeTab.value),
)

// Methods
const fetchConcessionDetail = async () => {
  if (!concessionId.value) {
    router.push({ name: 'concessionsList' })

    return
  }

  loading.value = true
  try {
    await concessionStore.fetchItemById(concessionId.value, {
      include: ['holder', 'vehicles', 'vehicles.drivers', 'fines', 'documents', 'payments', 'transfers'],
    })
  }
  catch (error) {
    console.error('Error loading concession:', error)

    // Handle error - maybe show toast
  }
  finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'concessionsList' })
}

const openEditDialog = () => {
  router.push({ name: 'concessionsEdit', params: { id: concessionId.value } })
}

const getStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    inactive: 'warning',
    expired: 'error',
    suspended: 'info',
  }

  return colors[status?.toLowerCase()] || 'default'
}

const isExpiringSoon = (expiryDate: string, days = 90) => {
  if (!expiryDate)
    return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= days && diffDays >= 0
}

const formatDate = (date: string) => {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  fetchConcessionDetail()
})
</script>

<template>
  <div class="concession-detail">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="d-flex justify-center align-center"
      style="min-height: 400px;"
    >
      <VProgressCircular
        indeterminate
        size="48"
        color="primary"
      />
    </div>

    <!-- Main Content -->
    <template v-else-if="concession">
      <!-- Header -->
      <VCard class="mb-6">
        <VCardText class="pa-6">
          <div class="d-flex align-center justify-space-between flex-wrap gap-4">
            <!-- Back Button & Title -->
            <div class="d-flex align-center">
              <VBtn
                icon
                variant="text"
                @click="goBack"
              >
                <VIcon>tabler-arrow-left</VIcon>
              </VBtn>

              <div class="ms-4">
                <h1 class="text-h4 font-weight-bold">
                  {{ concession.concession_number }}
                </h1>
                <div class="d-flex align-center gap-2 mt-1">
                  <VChip
                    :color="getStatusColor(concession.status)"
                    size="small"
                    variant="tonal"
                  >
                    {{ concession.status }}
                  </VChip>

                  <VChip
                    v-if="isExpiringSoon(concession.expiry_date)"
                    color="warning"
                    size="small"
                    variant="tonal"
                  >
                    <VIcon start>
                      tabler-clock-hour-4
                    </VIcon>
                    {{ t('concession.expiring_soon') }}
                  </VChip>
                </div>
              </div>
            </div>

            <!-- Quick Info -->
            <div class="d-flex align-center gap-6">
              <div class="text-center">
                <div class="text-h6 font-weight-bold">
                  {{ concession.holder?.full_name || '-' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('concession.fields.holder') }}
                </div>
              </div>

              <VDivider vertical />

              <div class="text-center">
                <div class="text-h6 font-weight-bold">
                  {{ formatDate(concession.expiry_date) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('concession.fields.expiry_date') }}
                </div>
              </div>

              <VDivider vertical />

              <div class="text-center">
                <div class="text-h6 font-weight-bold">
                  {{ concession.concession_type || '-' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('concession.fields.concession_type') }}
                </div>
              </div>

              <!-- Actions -->
              <VBtn
                color="primary"
                @click="openEditDialog"
              >
                <VIcon start>
                  tabler-pencil
                </VIcon>
                {{ t('common.edit') }}
              </VBtn>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Tabs Navigation -->
      <VCard>
        <VTabs
          v-model="activeTab"
          class="px-6 pt-4"
          show-arrows
          slider-color="primary"
        >
          <VTab
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
            class="text-capitalize"
          >
            <VIcon
              :icon="tab.icon"
              start
            />
            {{ tab.title }}

            <VBadge
              v-if="tab.badge !== undefined && tab.badge > 0"
              :content="tab.badge"
              :color="tab.badgeColor || 'primary'"
              inline
              class="ms-2"
            />
          </VTab>
        </VTabs>

        <VDivider />

        <!-- Tab Content -->
        <VTabsWindow v-model="activeTab">
          <VTabsWindowItem
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
          >
            <component
              :is="tab.component"
              :concession="concession"
              :loading="loading"
              @refresh="fetchConcessionDetail"
            />
          </VTabsWindowItem>
        </VTabsWindow>
      </VCard>
    </template>

    <!-- Not Found State -->
    <template v-else>
      <VCard class="text-center pa-12">
        <VIcon
          size="64"
          color="grey-400"
          class="mb-4"
        >
          tabler-certificate-off
        </VIcon>
        <h3 class="text-h6 mb-2">
          {{ t('concession.not_found') }}
        </h3>
        <p class="text-body-2 mb-4">
          {{ t('concession.not_found_description') }}
        </p>
        <VBtn
          color="primary"
          @click="goBack"
        >
          <VIcon start>
            tabler-arrow-left
          </VIcon>
          {{ t('concession.actions.back_to_list') }}
        </VBtn>
      </VCard>
    </template>
  </div>
</template>

<style scoped>
.concession-detail {
  min-height: 100vh;
  background-color: rgb(var(--v-theme-surface));
}

.v-tab {
  text-transform: none !important;
}

.v-tabs-window-item {
  padding: 0;
}
</style>
