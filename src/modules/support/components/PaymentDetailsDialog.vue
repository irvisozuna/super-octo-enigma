<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  open: boolean
  details: any[]
  title: string
}>()

const emit = defineEmits(['close'])
const { t } = useI18n()
</script>

<template>
  <VDialog
    :model-value="open"
    max-width="800"
    @update:model-value="val => !val && emit('close')"
  >
    <VCard>
      <VCardTitle>{{ title || t('payment_details') }}</VCardTitle>
      <VCardText>
        <div
          v-for="invoice in details"
          :key="invoice.ref"
          class="mb-6"
        >
          <div class="d-flex justify-space-between align-center mb-2">
            <h3 class="text-h6">
              {{ invoice.ref }}
            </h3>
            <div class="text-h6">
              {{ $formatCurrency(invoice.total) }}
            </div>
          </div>
          <VTable>
            <thead>
              <tr>
                <th>{{ t('concepto') }}</th>
                <th class="text-end">
                  {{ t('amount') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="detail in invoice.items"
                :key="`${invoice.ref}-${detail.label}`"
              >
                <td>{{ detail.label }}</td>
                <td class="text-end">
                  {{ $formatCurrency(detail.total_ttc) }}
                </td>
              </tr>
            </tbody>
          </VTable>
        </div>
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
