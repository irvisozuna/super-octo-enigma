<template>
  <VCardText>
    <VRow>
      <VCol align-self="end">
        <div>
          <span class="text-h6 font-weight-500">
            <VIcon icon="tabler-map-pin" class="me-2" />{{ $t('address') }}:
          </span>
          {{ contract?.address }}
        </div>
        <div class="d-flex flex-wrap mt-2">
          <span class="flex-1-1-100">
            <span class="text-h6 font-weight-500">
              <VIcon icon="tabler-map-2" class="me-2" />{{ $t('community') }}:
            </span>
            {{ contract?.community }}
          </span>
          <span class="flex-1-0">
            <span class="text-h6 font-weight-500">
              <VIcon icon="tabler-map-2" class="me-2" />{{ $t('system') }}:
            </span>
            {{ contract?.system }}
            <span class="text-h6 font-weight-500">{{ $t('sector') }}:</span>
            {{ contract?.sector }}
          </span>
        </div>
      </VCol>
    </VRow>
  </VCardText>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContractStore } from '@/modules/support/stores/contractStore'

const contractStore = useContractStore()
const contract = computed(() => contractStore.item)
</script>
