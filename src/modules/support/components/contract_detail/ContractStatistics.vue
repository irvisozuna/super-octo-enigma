<template>
  <VRow>
    <VCol>
      <VCard>
        <VCardText>
          <VRow class="d-flex justify-center align-center">
            <VCol
              v-for="(stat, index) in statistics"
              :key="index"
              cols="12"
              sm="6"
              md="4"
              class="d-flex justify-center align-center"
            >
              <div
                class="border border-dashed d-flex flex-column justify-center align-center cursor-pointer rounded py-4 px-3"
                style="aspect-ratio: 1; inline-size: 100%;"
                @click="toggle"
              >
                <h6 class="text-base mb-0">{{ stat.value }}</h6>
                <h6 class="text-base text-center font-weight-light mb-0">{{ $t(stat.label) }}</h6>
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContractStore } from '@/modules/support/stores/contractStore'

const contractStore = useContractStore()
const contract = computed(() => contractStore.item)

const statistics = computed(() => [
  { label: 'balance_due', value: contract.value?.balanceDue },
  { label: 'positive_balance', value: contract.value?.positiveBalance },
  { label: 'months_due', value: contract.value?.monthsDue },
])
</script>
