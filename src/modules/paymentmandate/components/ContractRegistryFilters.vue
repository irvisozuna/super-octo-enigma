<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBanks } from '@/composables/useBanks'
import { useAccountTypes } from '@/composables/useAccountTypes'

interface Props {
  initialFilters: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:filters': [filters: any]
}>()

const { t } = useI18n()
const { bankOptions, updateSearch, clearSearch } = useBanks()
const { accountTypeOptions, updateSearch: updateAccountTypeSearch } = useAccountTypes()

// Filtros reactivos
const filters = ref({
  search: props.initialFilters?.search || '',
  bank: props.initialFilters?.bank || '',
  accountType: props.initialFilters?.accountType || '',
  minAmount: props.initialFilters?.minAmount || '',
  maxAmount: props.initialFilters?.maxAmount || '',
  dateFrom: props.initialFilters?.dateFrom || '',
  dateTo: props.initialFilters?.dateTo || '',
})

// Watcher para emitir cambios
watch(filters, newFilters => {
  emit('update:filters', { ...newFilters })
}, { deep: true })

function clearFilters() {
  filters.value = {
    search: '',
    bank: '',
    accountType: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
  }
}
</script>

<template>
  <VCardText>
    <VRow>
      <!-- Búsqueda general -->
      <VCol
        cols="12"
        md="3"
      >
        <VTextField
          v-model="filters.search"
          :label="$t('paymentmandate.contractRegistry.search_contracts')"
          variant="outlined"
          dense
          clearable
        />
      </VCol>

      <!-- Filtro por banco -->
      <VCol
        cols="12"
        md="3"
      >
        <VAutocomplete
          v-model="filters.bank"
          :label="$t('paymentmandate.contractRegistry.bank')"
          :items="bankOptions"
          variant="outlined"
          dense
          clearable
          searchable
          :search="updateSearch"
          item-title="title"
          item-value="value"
        />
      </VCol>

      <!-- Filtro por tipo de cuenta -->
      <VCol
        cols="12"
        md="3"
      >
        <VAutocomplete
          v-model="filters.accountType"
          :label="$t('paymentmandate.contractRegistry.account_type')"
          :items="accountTypeOptions"
          variant="outlined"
          dense
          clearable
          searchable
          :search="updateAccountTypeSearch"
          item-title="title"
          item-value="value"
        />
      </VCol>

      <!-- Filtro por monto mínimo -->
      <VCol
        cols="12"
        md="3"
      >
        <VTextField
          v-model="filters.minAmount"
          :label="$t('paymentmandate.contractRegistry.min_amount')"
          type="number"
          variant="outlined"
          dense
          clearable
        />
      </VCol>

      <!-- Filtro por monto máximo -->
      <VCol
        cols="12"
        md="3"
      >
        <VTextField
          v-model="filters.maxAmount"
          :label="$t('paymentmandate.contractRegistry.max_amount')"
          type="number"
          variant="outlined"
          dense
          clearable
        />
      </VCol>

      <!-- Filtro por fecha desde -->
      <VCol
        cols="12"
        md="3"
      >
        <VTextField
          v-model="filters.dateFrom"
          :label="$t('paymentmandate.contractRegistry.date_from')"
          type="date"
          variant="outlined"
          dense
          clearable
        />
      </VCol>

      <!-- Filtro por fecha hasta -->
      <VCol
        cols="12"
        md="3"
      >
        <VTextField
          v-model="filters.dateTo"
          :label="$t('paymentmandate.contractRegistry.date_to')"
          type="date"
          variant="outlined"
          dense
          clearable
        />
      </VCol>

      <!-- Botón para limpiar filtros -->
      <VCol
        cols="12"
        md="3"
        class="d-flex align-center"
      >
        <VBtn
          variant="outlined"
          color="secondary"
          @click="clearFilters"
        >
          {{ $t('paymentmandate.contractRegistry.clear_filters') }}
        </VBtn>
      </VCol>
    </VRow>
  </VCardText>
</template>
