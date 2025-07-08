<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  items: any[]
  loading?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <VCard variant="outlined">
    <VCardText>
      <div class="text-h6 mb-4">
        {{ t('paymentmandate.items') }}
      </div>

      <VTable>
        <thead>
          <tr>
            <th>{{ t('paymentmandate.contract_id') }}</th>
            <th>{{ t('paymentmandate.client_name') }}</th>
            <th>{{ t('paymentmandate.client_reference') }}</th>
            <th>{{ t('paymentmandate.amount') }}</th>
            <th>{{ t('paymentmandate.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
          >
            <td>{{ item.contract_id }}</td>
            <td>{{ item.client_name }}</td>
            <td>{{ item.client_reference }}</td>
            <td class="text-end">
              {{ $formatCurrency(item.amount) }}
            </td>
            <td>
              <VTooltip
                v-if="item.status === 'error' && item.error_message"
                :text="item.error_message"
                location="top"
              >
                <template #activator="{ props }">
                  <VChip
                    v-bind="props"
                    color="error"
                    size="small"
                  >
                    {{ t(`paymentmandate.${item.status}`) }}
                  </VChip>
                </template>
              </VTooltip>
              <VChip
                v-else
                color="success"
                size="small"
              >
                {{ t(`paymentmandate.${item.status}`) }}
              </VChip>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td
              colspan="5"
              class="text-center"
            >
              {{ t('paymentmandate.noItems') }}
            </td>
          </tr>
        </tbody>
      </VTable>
    </VCardText>
  </VCard>
</template>
