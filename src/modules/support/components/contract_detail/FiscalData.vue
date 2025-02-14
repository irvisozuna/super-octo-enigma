<template>
  <VCard class="pa-4">
    <VCardTitle class="text-h6">{{ $t('fiscal_data') }}</VCardTitle>
    <VCardText>
      <VList dense>
        <VListItem>
          <VIcon icon="tabler-star" class="me-2" />{{ $t('business_name') }}: {{ contract?.sat_cname || 'N/A' }}
        </VListItem>
        <VListItem>
          <VIcon icon="tabler-devices-2" class="me-2" />{{ $t('rfc') }}: {{ contract?.rfc || 'N/A' }}
        </VListItem>
        <VListItem>
          <VIcon icon="tabler-activity" class="me-2" />{{ $t('postal_code') }}: {{ contract?.sat_zip || 'N/A' }}
        </VListItem>
        <VListItem>
          <VIcon icon="tabler-calendar" class="me-2" />{{ $t('cfdi_use') }}: {{ contract?.usecfdi || 'N/A' }}
          <VBtn icon variant="plain" class="ms-2">
            <VIcon icon="tabler-edit-3" />
          </VBtn>
        </VListItem>
        <VListItem>
          <VIcon icon="tabler-calendar" class="me-2" />{{ $t('email') }}: {{ contract?.sat_emails || 'N/A' }}
          <VBtn icon variant="plain" class="ms-2">
            <VIcon icon="tabler-edit-3" />
          </VBtn>
        </VListItem>
        <VListItem>
          <VIcon icon="tabler-calendar" class="me-2" />{{ $t('phone') }}: {{ contract?.phone || 'N/A' }}
          <VBtn icon variant="plain" class="ms-2">
            <VIcon icon="tabler-edit-3" />
          </VBtn>
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
