<template>
  <VCard>
    <VCardTitle>
      <v-sheet class="d-flex mb-6">
        <v-sheet class="ma-2 pa-2 me-auto">
          <span class="text-h6">{{ $t('account') }}:</span>
          <span class="text-h6 ms-2 text-primary">{{ account?.rowid }}</span>
          <span class="text-h6 ms-4">{{ $t('user') }}:</span>
          <span class="text-h6 ms-2 text-primary">{{ account?.nameuser }}</span>
        </v-sheet>
        <v-sheet class="ma-2 pa-2">
          <VChip :color="statusColor">{{ account?.status }}</VChip>
        </v-sheet>
      </v-sheet>
    </VCardTitle>
  </VCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Account } from '../../types/account';
import { useContractStore } from '@/modules/support/stores/contractStore'

// Store
const contractStore = useContractStore()

// Computed property reading from store's item
const account = computed<Account | null>(() => contractStore.item);

// Optional: Compute status color
const statusColor = computed(() => {
  switch(account.value?.status) {
    case 'active': return 'success'
    case 'inactive': return 'error'
    default: return 'secondary'
  }
});

</script>
