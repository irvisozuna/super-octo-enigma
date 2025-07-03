<script setup lang="ts">
import BaseTable from '@/components/BaseTable.vue'; // Asegúrate de importar correctamente tu componente BaseTable
import { useAppManager } from '@/composables/useAppManager';
import { useContractStore } from '@/modules/support/stores/contractStore';
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { closeDialog } = useAppManager();
const contractStore = useContractStore();

const contracts = ref([]); // Inicialmente sin datos
const loading = ref(true); // Estado de carga activado al inicio
const selectedContract = ref(null);
const searchQuery = ref('');
const pagination = ref({
  limit: 10,
  offset: 0,
  count: 0,
  total: 0,
});

// Props para personalizar el título y descripción
const props = defineProps({
  activeTab: { type: Number, required: true },
});

// Encabezados de la tabla
const headers = [
  { title: t('description'), value: 'label' },
  { title: t('type'), value: 'adjustment_type' },
  { title: t('reason'), value: 'adjustment_reason_desc' },
  { title: t('amount'), value: 'adjustment_amount' },
  { title: t('date'), value: 'date_creation' },
  { title: t('file'), value: 'file' }
];

// Función para actualizar la página
function updatePage(newPage: number) {
  pagination.value.page = newPage;
  fetchData();
}

// Función para actualizar los elementos por página
function updateItemsPerPage(newItemsPerPage: number) {
  pagination.value.limit = newItemsPerPage;
  fetchData();
}

// Función para manejar la entrada de búsqueda
function onSearchInput() {
  pagination.value.offset = 0;
  pagination.value.search = searchQuery.value;
  fetchData();
}

// Función para cargar los datos
async function fetchData() {
  loading.value = true;
  try {
    const response = await contractStore.getAdjustmentsByContract(contractStore.item.id_account, pagination.value);
    contracts.value = replaceNullWithEmptyString(response.data); // Reemplazar null por ''
    pagination.value = response.pagination;
  } catch (error) {
    console.error('Error al cargar los Pagos:', error);
  } finally {
    loading.value = false;
  }
}

// Función para reemplazar valores null por una cadena vacía
function replaceNullWithEmptyString(data: any[]) {
  return data.map(item => {
    const newItem = { ...item };
    for (const key in newItem) {
      if (newItem[key] === null) {
        newItem[key] = '';
      }
    }
    return newItem;
  });
}

// Montar datos al iniciar el componente
onMounted(fetchData);

// Escuchar cambios en el tab activo y recargar datos
watch(() => props.activeTab, (newTab) => {
  if (newTab === 6) { // Suponiendo que el tab de BillingHistory es el índice 1
    fetchData();
  }
});
</script>

<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Tabla de contratos -->
      <BaseTable
        v-if="!loading"
        :headers="headers"
        :items="contracts"
        :total="pagination.total"
        :page="pagination.offset / pagination.limit + 1"
        :items-per-page="pagination.limit"
        :loading="loading"
        v-model:selection="selectedContract"
        @update:page="updatePage"
        @update:items-per-page="updateItemsPerPage"
      >
      <template #file="{ item }">
      <VBtn variant="text" v-if="item.file" :href="item.file" target="_blank" color="primary" small>
        {{ t('download') }}
      </VBtn>
      </template>
      <template #adjustment_amount="{ item }">
        <div class="text-end">{{ $formatCurrency(item.adjustment_amount) || 'N/A' }}</div>
      </template>
      <template #date_creation="{ item }">
        {{ $formatDate(item.date_creation,{ 
  day: '2-digit', month: '2-digit', year: 'numeric', 
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
}) || 'N/A' }}
      </template>
      </BaseTable>

      <!-- Estado de carga -->
      <div v-if="loading" class="text-center py-6">
        <VProgressCircular indeterminate color="primary" />
        <p class="mt-2">{{ t('loading') }}...</p>
      </div>
    </VCardText>
  </VCard>
</template>
