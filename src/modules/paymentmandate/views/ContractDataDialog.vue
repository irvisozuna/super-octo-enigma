<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  contractData: {
    name: string
    phone?: string | null
    contractNumber: number
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  confirm: [useContractData: boolean]
  cancel: []
}>()

const { t } = useI18n()

const useContractData = ref(false)

function handleConfirm() {
  emit('confirm', useContractData.value)
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ $t('paymentmandate.contractRegistry.contract_found_title') }}
      </h4>
    </VCardTitle>

    <VDivider />

    <VCardText>
      <VAlert
        type="success"
        variant="tonal"
        class="mb-4"
      >
        <VAlertTitle>{{ $t('paymentmandate.contractRegistry.contract_found_message') }}</VAlertTitle>
        <p class="mb-0">
          <strong>{{ $t('paymentmandate.contractRegistry.contract_number') }}:</strong> {{ props.contractData.contractNumber }}
        </p>
        <p class="mb-0">
          <strong>{{ $t('paymentmandate.contractRegistry.name') }}:</strong> {{ props.contractData.name }}
        </p>
        <p
          v-if="props.contractData.phone"
          class="mb-0"
        >
          <strong>{{ $t('paymentmandate.contractRegistry.phone') }}:</strong> {{ props.contractData.phone }}
        </p>
      </VAlert>

      <VCheckbox
        v-model="useContractData"
        :label="$t('paymentmandate.contractRegistry.use_contract_data')"
        color="primary"
        class="mb-4"
      />

      <p class="text-body-2 text-medium-emphasis">
        {{ $t('paymentmandate.contractRegistry.contract_data_explanation') }}
      </p>
    </VCardText>

    <VDivider />

    <VCardActions class="justify-end">
      <VBtn
        variant="tonal"
        color="secondary"
        @click="handleCancel"
      >
        {{ $t('cancel') }}
      </VBtn>
      <VBtn
        color="primary"
        variant="tonal"
        @click="handleConfirm"
      >
        {{ $t('continue') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
