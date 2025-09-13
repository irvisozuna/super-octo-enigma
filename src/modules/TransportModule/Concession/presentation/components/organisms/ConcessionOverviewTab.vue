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

// Computed properties
const overviewData = computed(() => [
  {
    title: t('concession.fields.concession_number'),
    value: props.concession?.concession_number || '-',
    icon: 'tabler-certificate',
  },
  {
    title: t('concession.fields.concession_type'),
    value: props.concession?.concession_type || '-',
    icon: 'tabler-category',
  },
  {
    title: t('concession.fields.service_area'),
    value: props.concession?.service_area || '-',
    icon: 'tabler-map-pin',
  },
  {
    title: t('concession.fields.issue_date'),
    value: formatDate(props.concession?.issue_date),
    icon: 'tabler-calendar-plus',
  },
  {
    title: t('concession.fields.expiry_date'),
    value: formatDate(props.concession?.expiry_date),
    icon: 'tabler-calendar-x',
    isExpiring: isExpiringSoon(props.concession?.expiry_date),
  },
  {
    title: t('concession.fields.fee_amount'),
    value: formatCurrency(props.concession?.fee_amount),
    icon: 'tabler-currency-dollar',
  },
])

const holderInfo = computed(() => [
  {
    title: t('concession_holder.fields.full_name'),
    value: props.concession?.holder?.full_name || '-',
    icon: 'tabler-user',
  },
  {
    title: t('concession_holder.fields.holder_type'),
    value: props.concession?.holder?.holder_type || '-',
    icon: 'tabler-building',
  },
  {
    title: t('concession_holder.fields.identification_number'),
    value: props.concession?.holder?.identification_number || '-',
    icon: 'tabler-id-badge',
  },
  {
    title: t('concession_holder.fields.phone'),
    value: props.concession?.holder?.phone || '-',
    icon: 'tabler-phone',
  },
])

const quickStats = computed(() => [
  {
    title: t('concession.stats.active_vehicles'),
    value: props.concession?.active_vehicles_count || 0,
    icon: 'tabler-car',
    color: 'success',
  },
  {
    title: t('concession.stats.unpaid_fines'),
    value: props.concession?.unpaid_fines_count || 0,
    icon: 'tabler-file-dollar',
    color: props.concession?.unpaid_fines_count > 0 ? 'error' : 'default',
  },
  {
    title: t('concession.stats.documents'),
    value: props.concession?.documents_count || 0,
    icon: 'tabler-file-text',
    color: 'info',
  },
  {
    title: t('concession.stats.days_until_expiry'),
    value: daysUntilExpiration(props.concession?.expiry_date),
    icon: 'tabler-calendar-time',
    color: getExpiryColor(props.concession?.expiry_date),
  },
])

// Helper functions
function formatDate(date: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

function formatCurrency(amount: number) {
  if (!amount)
    return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function isExpiringSoon(expiryDate: string, days = 90) {
  if (!expiryDate)
    return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= days && diffDays >= 0
}

function daysUntilExpiration(expiryDate: string): number {
  if (!expiryDate)
    return 0
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getExpiryColor(expiryDate: string): string {
  const days = daysUntilExpiration(expiryDate)
  if (days <= 0)
    return 'error'
  if (days <= 30)
    return 'warning'
  if (days <= 90)
    return 'info'

  return 'success'
}

function getStatusColor(status: string) {
  const colors = {
    active: 'success',
    inactive: 'warning',
    expired: 'error',
    suspended: 'info',
  }

  return colors[status?.toLowerCase()] || 'default'
}
</script>

<template>
  <VCardText class="pa-6">
    <VRow>
      <!-- Quick Stats Cards -->
      <VCol cols="12">
        <h4 class="text-h6 mb-4 d-flex align-center">
          <VIcon class="me-2">
            tabler-dashboard
          </VIcon>
          {{ t('concession.quick_stats') }}
        </h4>

        <VRow>
          <VCol
            v-for="stat in quickStats"
            :key="stat.title"
            cols="12"
            sm="6"
            lg="3"
          >
            <VCard
              variant="tonal"
              :color="stat.color"
              class="text-center"
            >
              <VCardText class="pa-4">
                <VIcon
                  :icon="stat.icon"
                  size="32"
                  class="mb-2"
                />
                <div class="text-h4 font-weight-bold">
                  {{ stat.value }}
                </div>
                <div class="text-caption">
                  {{ stat.title }}
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>

      <!-- Concession Details -->
      <VCol
        cols="12"
        lg="6"
      >
        <VCard
          variant="outlined"
          class="h-100"
        >
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-info-circle
            </VIcon>
            {{ t('concession.concession_details') }}
          </VCardTitle>

          <VCardText>
            <VList density="compact">
              <VListItem
                v-for="item in overviewData"
                :key="item.title"
                class="px-0"
              >
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    class="me-3"
                  />
                </template>

                <VListItemTitle class="font-weight-medium">
                  {{ item.title }}
                </VListItemTitle>

                <VListItemSubtitle
                  :class="{
                    'text-error font-weight-medium': item.isExpiring,
                  }"
                >
                  {{ item.value }}
                  <VChip
                    v-if="item.isExpiring"
                    color="warning"
                    size="x-small"
                    class="ms-2"
                  >
                    {{ t('concession.expiring_soon') }}
                  </VChip>
                </VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Holder Information -->
      <VCol
        cols="12"
        lg="6"
      >
        <VCard
          variant="outlined"
          class="h-100"
        >
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-user
            </VIcon>
            {{ t('concession.holder_information') }}
          </VCardTitle>

          <VCardText>
            <VList density="compact">
              <VListItem
                v-for="item in holderInfo"
                :key="item.title"
                class="px-0"
              >
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    class="me-3"
                  />
                </template>

                <VListItemTitle class="font-weight-medium">
                  {{ item.title }}
                </VListItemTitle>

                <VListItemSubtitle>{{ item.value }}</VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Route Description -->
      <VCol
        v-if="concession?.route_description"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-route
            </VIcon>
            {{ t('concession.fields.route_description') }}
          </VCardTitle>

          <VCardText>
            <p class="mb-0">
              {{ concession.route_description }}
            </p>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Terms and Conditions -->
      <VCol
        v-if="concession?.terms_conditions"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-file-text
            </VIcon>
            {{ t('concession.fields.terms_conditions') }}
          </VCardTitle>

          <VCardText>
            <p class="mb-0">
              {{ concession.terms_conditions }}
            </p>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Additional Notes -->
      <VCol
        v-if="concession?.notes"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-notes
            </VIcon>
            {{ t('concession.fields.notes') }}
          </VCardTitle>

          <VCardText>
            <p class="mb-0">
              {{ concession.notes }}
            </p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VCardText>
</template>

<style scoped>
.v-list-item {
  min-height: 48px;
}

.v-card--variant-tonal {
  transition: all 0.3s ease;
}

.v-card--variant-tonal:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
}
</style>
