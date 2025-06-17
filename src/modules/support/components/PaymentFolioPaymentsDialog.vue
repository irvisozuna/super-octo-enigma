<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseTable from '@/components/BaseTable.vue'

defineProps<{
  open: boolean
  payments: any[]
  title: string
}>()

const emit = defineEmits(['close', 'show-details'])
const { t } = useI18n()

const paymentHeaders = computed(() => [
  { title: t('paymentId'), value: 'paymentId' },
  { title: t('billingPeriod'), value: 'billingPeriod' },
  { title: t('date'), value: 'date' },
  { title: t('consumo'), value: 'consumo' },
  { title: t('drenaje'), value: 'drenaje' },
  { title: t('saneamiento'), value: 'saneamiento' },
  { title: t('recargos'), value: 'recargos' },
  { title: t('bomberos'), value: 'bomberos' },
  { title: t('otros'), value: 'otros' },
  { title: t('total_concept'), value: 'total_concept' },
  { title: t('totalPaid'), value: 'totalPaid' },
  { title: t('payment_method'), value: 'payment_method' },
  { title: t('details'), value: 'details', sortable: false },
])
</script>

<template>
  <VDialog
    :model-value="open"
    max-width="1200"
    @update:model-value="val => !val && emit('close')"
  >
    <VCard>
      <VCardTitle>{{ title }}</VCardTitle>
      <VCardText>
        <BaseTable
          :headers="paymentHeaders"
          :items="payments"
          :total="payments.length"
          :page="1"
          :items-per-page="payments.length"
          :loading="false"
        >
          <template #date="{ item }">
            <div>{{ $formatDate(item.date, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) || 'N/A' }}</div>
          </template>
          <template #consumo="{ item }">
            <div class="text-end">
              {{ $formatCurrency(item.consumo) || 'N/A' }}
            </div>
          </template>
          <template #drenaje="{ item }">
            <div class="text-end">
              {{ $formatCurrency(item.drenaje) || 'N/A' }}
            </div>
          </template>
          <template #saneamiento="{ item }">
            <div class="text-end">
              {{ $formatCurrency(item.saneamiento) || 'N/A' }}
            </div>
          </template>
          <template #recargos="{ item }">
            <div class="text-end">
              {{ $formatCurrency(item.recargos) || 'N/A' }}
            </div>
          </template>
          <template #bomberos="{ item }">
            <div class="text-end">
              {{ $formatCurrency(item.bomberos) || 'N/A' }}
            </div>
          </template>
          <template #totalPaid="{ item }">
            <div class="text-end">
              {{ $formatCurrency(item.totalPaid) || 'N/A' }}
            </div>
          </template>
          <template #total_concept="{ item }">
            <div class="text-end">
              {{ $formatCurrency(item.total_concept) || 'N/A' }}
            </div>
          </template>
          <template #otros="{ item }">
            <div class="text-end">
              {{ $formatCurrency(item.otros) || '0' }}
            </div>
          </template>
          <template #payment_method="{ item }">
            <div class="text">
              {{ item.payment_method || '-' }}
            </div>
          </template>
          <template #details="{ item }">
            <VIcon
              v-if="item.details && item.details.length > 0"
              icon="tabler-eye"
              size="small"
              class="ms-2 cursor-pointer"
              @click="emit('show-details', item.details, `${t('paymentId')}: ${item.paymentId}`)"
            />
          </template>
        </BaseTable>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          @click="emit('close')"
        >
          {{ t('close') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
