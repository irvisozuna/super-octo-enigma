<script setup lang="ts">
import type { ClientStatusHistoryDto } from '../../../application/dtos/ClientDtos'
import type { ClientStatus } from '../../../domain/entities/ClientEntity'

interface Props {
  history: ClientStatusHistoryDto[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const { t } = useI18n()

function formatDate(date?: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getStatusIcon(status: ClientStatus) {
  const icons: Record<ClientStatus, string> = {
    active: 'tabler-check',
    inactive: 'tabler-x',
    suspended: 'tabler-pause',
    blacklisted: 'tabler-ban',
  }

  return icons[status] || 'tabler-point'
}

function getStatusColor(status: ClientStatus) {
  const colors: Record<ClientStatus, string> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'warning',
    blacklisted: 'error',
  }

  return colors[status] || 'default'
}

function getStatusLabel(status: ClientStatus) {
  return t(`client.status.${status}`)
}

function getTransitionIcon(item: ClientStatusHistoryDto) {
  // Use new status icon for the transition
  return getStatusIcon(item.new_status)
}

function getTransitionColor(item: ClientStatusHistoryDto) {
  // Use new status color for the transition
  return getStatusColor(item.new_status)
}

function getTransitionTitle(item: ClientStatusHistoryDto) {
  const oldLabel = getStatusLabel(item.old_status)
  const newLabel = getStatusLabel(item.new_status)

  return `${oldLabel} → ${newLabel}`
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-4">
      <h6 class="text-h6 mb-1">
        {{ t('client.history.title') }}
      </h6>
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ t('client.history.description') }}
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center pa-8"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <!-- Timeline -->
    <VTimeline
      v-else-if="history.length > 0"
      side="end"
      truncate-line="both"
      density="compact"
    >
      <VTimelineItem
        v-for="(item, index) in history"
        :key="index"
        :dot-color="getTransitionColor(item)"
        size="small"
      >
        <template #icon>
          <VIcon
            :icon="getTransitionIcon(item)"
            size="16"
          />
        </template>

        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center gap-2">
                <VChip
                  size="small"
                  :color="getStatusColor(item.old_status)"
                  variant="tonal"
                >
                  {{ getStatusLabel(item.old_status) }}
                </VChip>
                <VIcon
                  icon="tabler-arrow-right"
                  size="16"
                  class="text-medium-emphasis"
                />
                <VChip
                  size="small"
                  :color="getStatusColor(item.new_status)"
                  variant="tonal"
                >
                  {{ getStatusLabel(item.new_status) }}
                </VChip>
              </div>
              <VChip
                size="x-small"
                :color="getTransitionColor(item)"
                variant="tonal"
              >
                {{ formatDate(item.effective_date) }}
              </VChip>
            </div>

            <h6
              v-if="item.reason"
              class="text-subtitle-2 font-weight-medium mb-2"
            >
              {{ item.reason }}
            </h6>

            <p
              v-if="item.notes"
              class="text-body-2 mb-2"
            >
              {{ item.notes }}
            </p>

            <div
              v-if="item.changed_by_user"
              class="d-flex align-center gap-1 text-caption text-medium-emphasis"
            >
              <VIcon size="14">
                tabler-user
              </VIcon>
              <span>{{ t('client.history.changed_by') }}: {{ item.changed_by_user.name }}</span>
            </div>
          </VCardText>
        </VCard>
      </VTimelineItem>
    </VTimeline>

    <!-- Empty State -->
    <VAlert
      v-else
      color="info"
      variant="tonal"
      icon="tabler-history"
    >
      <div class="text-body-2">
        {{ t('client.history.no_history') }}
      </div>
    </VAlert>
  </div>
</template>
