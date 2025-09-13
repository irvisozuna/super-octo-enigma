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

// Computed
const payments = computed(() => props.concession?.payments || [])

const totalPaid = computed(() =>
  payments.value.reduce((sum, payment) => sum + (payment.amount || 0), 0),
)

// Methods
const formatCurrency = (amount: number) => {
  if (!amount)
    return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const formatDate = (date: string) => {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

const getPaymentTypeColor = (type: string) => {
  const colors = {
    concession_fee: 'primary',
    fine_payment: 'warning',
    penalty: 'error',
    renewal_fee: 'info',
  }

  return colors[type?.toLowerCase()] || 'grey'
}
</script>

<template>
  <VCardText class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <h4 class="text-h6 d-flex align-center">
        <VIcon class="me-2">
          tabler-credit-card
        </VIcon>
        {{ t('concession.tabs.payments') }}
      </h4>

      <div class="text-center">
        <div class="text-h6 font-weight-bold text-success">
          {{ formatCurrency(totalPaid) }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ t('concession.payments.total_paid') }}
        </div>
      </div>
    </div>

    <!-- No Payments -->
    <div
      v-if="payments.length === 0"
      class="text-center py-12"
    >
      <VIcon
        size="64"
        color="grey-400"
        class="mb-4"
      >
        tabler-credit-card-off
      </VIcon>
      <h6 class="text-h6 mb-2">
        {{ t('concession.payments.no_payments') }}
      </h6>
      <p class="text-body-2">
        {{ t('concession.payments.no_payments_description') }}
      </p>
    </div>

    <!-- Payments List -->
    <VTimeline
      v-else
      side="end"
      density="compact"
    >
      <VTimelineItem
        v-for="payment in payments"
        :key="payment.id"
        size="small"
        :dot-color="getPaymentTypeColor(payment.type)"
      >
        <template #icon>
          <VIcon
            icon="tabler-credit-card"
            size="16"
          />
        </template>

        <VCard
          variant="tonal"
          :color="getPaymentTypeColor(payment.type)"
        >
          <VCardText class="pa-4">
            <div class="d-flex justify-space-between align-center mb-2">
              <h6 class="text-h6 font-weight-bold">
                {{ formatCurrency(payment.amount) }}
              </h6>
              <VChip size="small">
                {{ formatDate(payment.payment_date) }}
              </VChip>
            </div>

            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-2">{{ t('concession.payments.type') }}:</span>
              <VChip
                :color="getPaymentTypeColor(payment.type)"
                size="small"
                variant="outlined"
              >
                {{ payment.type }}
              </VChip>
            </div>

            <div
              v-if="payment.reference_number"
              class="d-flex justify-space-between mb-2"
            >
              <span class="text-body-2">{{ t('concession.payments.reference') }}:</span>
              <span class="font-weight-medium">{{ payment.reference_number }}</span>
            </div>

            <div class="d-flex justify-space-between">
              <span class="text-body-2">{{ t('concession.payments.method') }}:</span>
              <span>{{ payment.payment_method || '-' }}</span>
            </div>

            <div
              v-if="payment.notes"
              class="mt-2 pt-2 border-t"
            >
              <p class="text-body-2 mb-0">
                {{ payment.notes }}
              </p>
            </div>
          </VCardText>
        </VCard>
      </VTimelineItem>
    </VTimeline>
  </VCardText>
</template>

<style scoped>
.v-timeline-item {
  padding-bottom: 16px;
}
</style>
