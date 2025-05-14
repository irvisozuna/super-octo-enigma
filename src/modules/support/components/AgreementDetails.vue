<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Detail {
  rowid: number
  fk_agreements: number
  numpay: number
  fk_invoice: number | null
  payment_amount: number
  paid: number
  remaining_balance: number
  issue_date: string
  due_date: string
  payment_date: string | null
  tms: string
  created_at: string
  status: number
}

const props = defineProps<{
  modelValue: boolean
  details: Detail[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()

// Computed properties for summary
const summary = computed(() => {
  if (!props.details.length) {
    return {
      total: 0,
      paid: 0,
      overdue: 0,
      pending: 0,
    }
  }

  const today = new Date()

  return {
    total: props.details.length,
    paid: props.details.filter((detail: Detail) => detail.status === 4).length,
    overdue: props.details.filter((detail: Detail) => {
      const dueDate = new Date(detail.due_date)

      return detail.status !== 4 && dueDate < today
    }).length,
    pending: props.details.filter((detail: Detail) => {
      const dueDate = new Date(detail.due_date)

      return detail.status !== 4 && dueDate >= today
    }).length,
  }
})

function isOverdue(detail: Detail): boolean {
  const today = new Date()
  const dueDate = new Date(detail.due_date)

  return detail.status !== 4 && dueDate < today
}

function getStatusColor(detail: Detail): string {
  if (detail.status === 4)
    return 'success'
  if (isOverdue(detail))
    return 'error'

  return 'warning'
}

function getStatusText(detail: Detail): string {
  if (detail.status === 4)
    return t('paid')
  if (isOverdue(detail))
    return t('overdue')

  return t('pending')
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="100%"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle>{{ t('agreement_details') }}</VCardTitle>
      <VCardText>
        <!-- Summary Section -->
        <VRow class="mb-4">
          <VCol cols="12">
            <VCard
              variant="outlined"
              class="pa-4"
            >
              <div class="d-flex justify-space-between align-center flex-wrap gap-4">
                <div class="text-center">
                  <div class="text-h6">
                    {{ t('total') }}
                  </div>
                  <div class="text-h4">
                    {{ summary.total }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-h6">
                    {{ t('paid') }}
                  </div>
                  <div class="text-h4 text-success">
                    {{ summary.paid }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-h6">
                    {{ t('overdue') }}
                  </div>
                  <div class="text-h4 text-error">
                    {{ summary.overdue }}
                  </div>
                </div>
                <div class="text-center">
                  <div class="text-h6">
                    {{ t('pending') }}
                  </div>
                  <div class="text-h4 text-warning">
                    {{ summary.pending }}
                  </div>
                </div>
              </div>
            </VCard>
          </VCol>
        </VRow>

        <!-- Details table -->
        <VTable>
          <thead>
            <tr>
              <th>{{ t('payment_number') }}</th>
              <th>{{ t('payment_amount') }}</th>
              <th>{{ t('paid_amount') }}</th>
              <th>{{ t('remaining_balance') }}</th>
              <th>{{ t('issue_date') }}</th>
              <th>{{ t('due_date') }}</th>
              <th>{{ t('payment_date') }}</th>
              <th>{{ t('status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="detail in details"
              :key="detail.rowid"
            >
              <td>{{ detail.numpay }}</td>
              <td>{{ $formatCurrency(detail.payment_amount) }}</td>
              <td>{{ $formatCurrency(detail.paid) }}</td>
              <td>{{ $formatCurrency(detail.remaining_balance) }}</td>
              <td>{{ $formatDate(detail.issue_date) }}</td>
              <td>
                <VChip
                  :color="isOverdue(detail) ? 'error' : 'default'"
                  size="small"
                >
                  {{ $formatDate(detail.due_date) }}
                </VChip>
              </td>
              <td v-if="detail.payment_date">
                {{ $formatDate(detail.payment_date) }}
              </td>
              <td v-if="!detail.payment_date" />
              <td>
                <VChip
                  :color="getStatusColor(detail)"
                  size="small"
                >
                  {{ getStatusText(detail) }}
                </VChip>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          @click="close"
        >
          {{ t('close') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.text-success {
  color: rgb(var(--v-theme-success));
}

.text-error {
  color: rgb(var(--v-theme-error));
}

.text-warning {
  color: rgb(var(--v-theme-warning));
}
</style>
