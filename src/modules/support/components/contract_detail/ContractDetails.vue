<template>
  <VCard class="pa-4">
    <VCardTitle class="text-h6">{{ $t('contract_general_data') }}</VCardTitle>
    <VCardText>
      <VList dense>
        <VListItem v-for="(detail, index) in contractDetails" :key="index">
          <VIcon :icon="detail.icon" class="me-2" />{{ $t(detail.label) }}: {{ detail.value }}
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContractStore } from '@/modules/support/stores/contractStore'

const contractStore = useContractStore()
const contract = computed(() => contractStore.item)

const contractDetails = computed(() => [
  { label: 'contract_type', value: contract.value?.type_contrat, icon: 'tabler-droplet' },
  { label: 'contract_date', value: contract.value?.date_created, icon: 'tabler-calendar' },
  { label: 'contract_status', value: contract.value?.status, icon: 'tabler-activity' },
  { label: 'meter_number', value: contract.value?.measurer, icon: 'tabler-hash' },
  { label: 'pensionary', value: contract.value?.pensionary ?? 'N/A', icon: 'tabler-percentage' },
  { label: 'validity', value: '', icon: 'tabler-clock' },
  { label: 'handicapped', value: contract.value?.handicapped ?? 'N/A', icon: 'tabler-users' },
  { label: 'business_activity', value: contract.value?.business_activity, icon: 'tabler-bookmark' },
  { label: 'rate', value: contract.value?.rate_type, icon: 'tabler-tag' },
])
</script>
