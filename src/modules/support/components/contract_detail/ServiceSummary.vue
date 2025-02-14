<template>
  <VCard class="pa-4">
    <VCardTitle class="text-h6">{{ $t('service_summary') }}</VCardTitle>
    <VCardText>
      <VList dense>
        <VListItem>
          <VIcon icon="tabler-star" class="me-2" />{{ $t('metric') }}: {{ contract?.type_charge || 'N/A' }}
        </VListItem>
        <VListItem>
          <VIcon icon="tabler-calendar" class="me-2" />{{ $t('services') }}: {{ contract?.type_services || 'N/A' }}
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
 </script>
