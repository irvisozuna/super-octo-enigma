<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  concession: any
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// Computed - Mock history data for demo
const activityHistory = computed(() => [
  {
    id: '1',
    type: 'concession_issued',
    title: t('concession.history.concession_issued'),
    description: `Concession ${props.concession?.concession_number} was issued`,
    timestamp: props.concession?.issue_date,
    icon: 'tabler-certificate',
    color: 'success',
    user: 'System',
  },
  {
    id: '2',
    type: 'vehicle_assigned',
    title: t('concession.history.vehicle_assigned'),
    description: 'Vehicle ABC-123 was assigned to this concession',
    timestamp: '2024-01-15T10:00:00Z',
    icon: 'tabler-car-plus',
    color: 'info',
    user: 'Admin User',
  },
  {
    id: '3',
    type: 'fine_issued',
    title: t('concession.history.fine_issued'),
    description: 'Fine #F-2024-001 issued for speeding violation',
    timestamp: '2024-02-01T15:30:00Z',
    icon: 'tabler-alert-triangle',
    color: 'warning',
    user: 'Traffic Officer',
  },
  {
    id: '4',
    type: 'payment_received',
    title: t('concession.history.payment_received'),
    description: 'Annual fee payment of $500.00 received',
    timestamp: '2024-02-15T09:15:00Z',
    icon: 'tabler-credit-card',
    color: 'success',
    user: 'Payment System',
  },
  {
    id: '5',
    type: 'document_uploaded',
    title: t('concession.history.document_uploaded'),
    description: 'Insurance certificate uploaded',
    timestamp: '2024-03-01T14:20:00Z',
    icon: 'tabler-file-upload',
    color: 'primary',
    user: props.concession?.holder?.full_name || 'Holder',
  },
])

// Methods
const formatDateTime = (date: string) => {
  if (!date)
    return '-'

  return new Date(date).toLocaleString()
}

const getTimeAgo = (date: string) => {
  if (!date)
    return ''
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60)
    return 'Just now'
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`

  return `${Math.floor(diffInSeconds / 2592000)}mo ago`
}

const getActivityTypeLabel = (type: string) => {
  const labels = {
    concession_issued: t('concession.history.types.issued'),
    vehicle_assigned: t('concession.history.types.vehicle_assigned'),
    vehicle_unassigned: t('concession.history.types.vehicle_unassigned'),
    fine_issued: t('concession.history.types.fine_issued'),
    fine_paid: t('concession.history.types.fine_paid'),
    payment_received: t('concession.history.types.payment_received'),
    document_uploaded: t('concession.history.types.document_uploaded'),
    document_expired: t('concession.history.types.document_expired'),
    holder_changed: t('concession.history.types.holder_changed'),
    status_changed: t('concession.history.types.status_changed'),
    renewal: t('concession.history.types.renewal'),
  }

  return labels[type] || type
}
</script>

<template>
  <VCardText class="pa-6">
    <h4 class="text-h6 mb-6 d-flex align-center">
      <VIcon class="me-2">
        tabler-history
      </VIcon>
      {{ t('concession.tabs.history') }}
      <VChip
        color="primary"
        size="small"
        class="ms-3"
      >
        {{ activityHistory.length }}
      </VChip>
    </h4>

    <!-- History Timeline -->
    <VTimeline
      side="end"
      density="compact"
      class="history-timeline"
    >
      <VTimelineItem
        v-for="activity in activityHistory"
        :key="activity.id"
        size="small"
        :dot-color="activity.color"
      >
        <template #icon>
          <VIcon
            :icon="activity.icon"
            size="16"
          />
        </template>

        <VCard
          variant="tonal"
          :color="activity.color"
          class="activity-card"
        >
          <VCardText class="pa-4">
            <!-- Header -->
            <div class="d-flex justify-space-between align-start mb-2">
              <div>
                <h6 class="text-subtitle-1 font-weight-bold mb-1">
                  {{ activity.title }}
                </h6>
                <VChip
                  :color="activity.color"
                  size="x-small"
                  variant="outlined"
                >
                  {{ getActivityTypeLabel(activity.type) }}
                </VChip>
              </div>

              <div class="text-end">
                <div class="text-caption text-medium-emphasis">
                  {{ getTimeAgo(activity.timestamp) }}
                </div>
                <div class="text-caption">
                  {{ formatDateTime(activity.timestamp) }}
                </div>
              </div>
            </div>

            <!-- Description -->
            <p class="text-body-2 mb-2">
              {{ activity.description }}
            </p>

            <!-- User Info -->
            <div class="d-flex align-center">
              <VIcon
                size="16"
                class="me-1"
              >
                tabler-user
              </VIcon>
              <span class="text-caption">{{ activity.user }}</span>
            </div>
          </VCardText>
        </VCard>
      </VTimelineItem>
    </VTimeline>

    <!-- Load More (if needed) -->
    <div class="text-center mt-6">
      <VBtn
        variant="outlined"
        @click="emit('refresh')"
      >
        <VIcon start>
          tabler-refresh
        </VIcon>
        {{ t('concession.history.load_more') }}
      </VBtn>
    </div>
  </VCardText>
</template>

<style scoped>
.history-timeline .v-timeline-item {
  padding-bottom: 20px;
}

.activity-card {
  transition: all 0.2s ease;
}

.activity-card:hover {
  transform: translateX(4px);
}
</style>
