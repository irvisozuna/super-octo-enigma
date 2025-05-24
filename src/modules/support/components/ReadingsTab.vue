<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RebillingItem, TableItem } from '../types/RebillingItem'
import RebillingDetailDialog from './dialog/RebillingDetailDialog.vue'
import ContractImagesDialog from './dialog/ContractImagesDialog.vue'
import BaseTable from '@/components/BaseTable.vue'
import { useContractStore } from '@/modules/support/stores/contractStore'

// Props para personalizar el título y descripción
const props = defineProps({
  activeTab: { type: Number, required: true },
})

const { t } = useI18n()
const contractStore = useContractStore()

interface PaginationState {
  limit: number
  offset: number
  count: number
  total: number
  page?: number
  search?: string
}

const contracts = ref<TableItem[]>([])
const loading = ref(true)
const selectedContract = ref<TableItem[]>([])
const searchQuery = ref('')

const pagination = ref<PaginationState>({
  limit: 10,
  offset: 0,
  count: 0,
  total: 0,
})

const isRebillingDialogVisible = ref(false)
const selectedRebillingData = ref<RebillingItem[]>([])
const isImagesDialogVisible = ref(false)
const selectedReading = ref<TableItem | null>(null)

// Encabezados de la tabla
const headers = [
  { title: t('billingPeriod'), value: 'Periodo' },
  { title: t('date'), value: 'Fecha' },
  { title: t('Lecturista'), value: 'Lecturista' },
  { title: t('Anterior'), value: 'Anterior' },
  { title: t('Actual'), value: 'Actual' },
  { title: t('real_consumo'), value: 'Real_Consumo' },
  { title: t('Consumo'), value: 'Consumo' },
  { title: t('Anomalia'), value: 'Anomalia' },
  { title: t('view_evidence'), value: 'view_evidence' },
]

// Función para actualizar la página
function updatePage(newPage: number) {
  pagination.value.page = newPage
  fetchData()
}

// Función para actualizar los elementos por página
function updateItemsPerPage(newItemsPerPage: number) {
  pagination.value.limit = newItemsPerPage
  fetchData()
}

// Función para cargar los datos
async function fetchData() {
  loading.value = true
  try {
    if (!contractStore.item?.id_account)
      throw new Error('No contract selected')

    const response = await contractStore.getReadingsByContract(
      String(contractStore.item.id_account),
      pagination.value,
    )

    contracts.value = replaceNullWithEmptyString(response.data)
    pagination.value = response.pagination
  }
  catch (error) {
    console.error('Error al cargar los Pagos:', error)
  }
  finally {
    loading.value = false
  }
}

// Función para reemplazar valores null por una cadena vacía
function replaceNullWithEmptyString(data: any[]): TableItem[] {
  return data.map(item => {
    const newItem = { ...item }
    for (const key in newItem) {
      if (newItem[key] === null)
        newItem[key] = ''
    }

    return newItem
  })
}

// Montar datos al iniciar el componente
onMounted(fetchData)

// Escuchar cambios en el tab activo y recargar datos
watch(() => props.activeTab, newTab => {
  if (newTab === 3)
    fetchData()
})

const showRebillingDetails = (item: TableItem) => {
  if (item.rebilling && item.rebilling.length > 0) {
    selectedRebillingData.value = item.rebilling
    isRebillingDialogVisible.value = true
  }
}

const showImages = (item: TableItem) => {
  selectedReading.value = item
  isImagesDialogVisible.value = true
}
</script>

<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Tabla de contratos -->
      <BaseTable
        v-if="!loading"
        v-model:selection="selectedContract"
        :headers="headers"
        :items="contracts"
        :total="pagination.total"
        :page="pagination.offset / pagination.limit + 1"
        :items-per-page="pagination.limit"
        :loading="loading"
        @update:page="updatePage"
        @update:items-per-page="updateItemsPerPage"
      >
        <template #Consumo="{ item }">
          {{ (item as TableItem).Consumo || '0' }}
          <VTooltip
            v-if="(item as TableItem).rebilling && (item as TableItem).rebilling.length > 0"
            location="top"
          >
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                size="small"
                color="warning"
                variant="tonal"
                icon
                @click="showRebillingDetails(item as TableItem)"
              >
                <VIcon
                  icon="tabler-history"
                  size="18"
                />
              </VBtn>
            </template>
            <span>{{ t('has_rebilling') }}</span>
          </VTooltip>
        </template>
        <template #Fecha="{ item }">
          <div class="">
            {{ (item as TableItem).Fecha || 'N/A' }}
          </div>
        </template>
        <template #view_evidence="{ item }">
          <VTooltip location="top">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                size="small"
                color="primary"
                variant="tonal"
                icon
                @click="showImages(item as TableItem)"
              >
                <VIcon
                  icon="tabler-photo"
                  size="18"
                />
              </VBtn>
            </template>
            <span>{{ t('view_evidence') }}</span>
          </VTooltip>
        </template>
      </BaseTable>

      <!-- Estado de carga -->
      <div
        v-if="loading"
        class="text-center py-6"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
        <p class="mt-2">
          {{ t('loading') }}...
        </p>
      </div>
    </VCardText>
  </VCard>

  <!-- Diálogo de detalle de refacturación -->
  <RebillingDetailDialog
    v-model:is-dialog-visible="isRebillingDialogVisible"
    :rebilling-data="selectedRebillingData"
  />

  <!-- Diálogo de imágenes -->
  <ContractImagesDialog
    v-if="selectedReading && contractStore.item?.id_account"
    v-model:is-dialog-visible="isImagesDialogVisible"
    :contract-id="String(contractStore.item!.account)"
    :period-id="selectedReading.PeriodCode"
  />
</template>
