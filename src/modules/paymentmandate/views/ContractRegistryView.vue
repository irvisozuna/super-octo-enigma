<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ContractRegistry } from '../types/contractRegistry'
import { useAppManager } from '@/composables/useAppManager'

// Props
const props = defineProps<{
  contract: ContractRegistry
  title?: string
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { closeDialog } = useAppManager()

// Computed para formatear datos
const formattedContract = computed(() => ({
  ...props.contract,
  maxAmount: new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'MXN',
  }).format(props.contract.maxAmount),
  cardNumber: props.contract.cardNumber ? `****${props.contract.cardNumber.slice(-4)}` : '-',
  expirationDate: props.contract.expirationDate || '-',
  registrationDate: props.contract.registrationDate ? new Date(props.contract.registrationDate).toLocaleDateString('es-ES') : '-',
  chargeFrequency: `${props.contract.chargeFrequency} días`,
}))

function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result)
}

function handleClose() {
  close('close')
}
</script>

<template>
  <DialogCloseBtn @click="close" />
  <VCard class="pa-sm-10 pa-2">
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        {{ props.title || 'Ver Contrato' }}
      </h4>
    </VCardTitle>

    <VDivider />

    <VCardText>
      <VRow>
        <!-- Número de control -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.controlNumber"
            :label="$t('paymentmandate.contractRegistry.control_number')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Número de contrato -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.contractNumber"
            :label="$t('paymentmandate.contractRegistry.contract_number')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Nombre del titular -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.name"
            :label="$t('paymentmandate.contractRegistry.name')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Número de tarjeta -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.cardNumber"
            :label="$t('paymentmandate.contractRegistry.card_number')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Monto máximo -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.maxAmount"
            :label="$t('paymentmandate.contractRegistry.max_amount')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Fecha de expiración -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.expirationDate"
            :label="$t('paymentmandate.contractRegistry.expiration_date')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Banco -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.bank"
            :label="$t('paymentmandate.contractRegistry.bank')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Tipo de cuenta -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.accountType"
            :label="$t('paymentmandate.contractRegistry.account_type')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Fecha de registro -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.registrationDate"
            :label="$t('paymentmandate.contractRegistry.registration_date')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Frecuencia de cobro -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.chargeFrequency"
            :label="$t('paymentmandate.contractRegistry.charge_frequency')"
            variant="outlined"
            readonly
          />
        </VCol>

        <!-- Teléfono -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formattedContract.phone"
            :label="$t('paymentmandate.contractRegistry.phone')"
            variant="outlined"
            readonly
          />
        </VCol>
      </VRow>
    </VCardText>

    <VDivider />

    <VCardActions class="justify-end">
      <VBtn
        color="secondary"
        variant="tonal"
        @click="handleClose"
      >
        {{ $t('close') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
