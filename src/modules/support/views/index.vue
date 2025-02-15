<script setup lang="ts">
import { useContractStore } from '@/modules/support/stores/contractStore';
import { markRaw, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AdjustmentsTab from '../components/AdjustmentsTab.vue';
import AgreementsTab from '../components/AgreementsTab.vue';
import BillingHistoryTab from '../components/BillingHistoryTab.vue';
import ContractDetails from '../components/ContractDetails.vue';
import ContractSearchDialog from '../components/dialog/ContractSearchDialog.vue';
import PaymentHistoryTab from '../components/PaymentHistoryTab.vue';
import ReadingsTab from '../components/ReadingsTab.vue';
import WorkOrdersTab from '../components/WorkOrdersTab.vue';

// Interfaces
interface Tab {
  title: string;
  icon: string;
  component: any;
}

// i18n y routing
const { t } = useI18n();
const route = useRoute() as { params: { id: string } };

// Store
const contractStore = useContractStore();
// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager();

// Estado
const activeTab = ref(0); // Índice del tab activo
const searchQuery = ref(''); // Entrada del buscador
const isLoading = ref(false); // Estado de carga para controlar el spinner
const itemData = ref(null); // Datos del contrato

// Configuración de los tabs
const tabs = ref<Tab[]>([
  { icon: 'tabler-user', title: t('tabs.generalInfo'), component: markRaw(ContractDetails) }, //0
  { icon: 'tabler-receipt', title: t('tabs.billingHistory'), component: markRaw(BillingHistoryTab) }, //1
  { icon: 'tabler-cash', title: t('tabs.paymentHistory'), component: markRaw(PaymentHistoryTab) },//2
  { icon: 'tabler-book', title: t('tabs.readings'), component: markRaw(ReadingsTab) },//3
  { icon: 'tabler-clipboard', title: t('tabs.workOrders'), component: markRaw(WorkOrdersTab) },//4
  { icon: 'tabler-file-like', title: t('tabs.agreements'), component: markRaw(AgreementsTab) },//5
  { icon: 'tabler-settings', title: t('tabs.settings'), component: markRaw(AdjustmentsTab) },//6
]);

// Función para buscar un contrato
async function searchContract() {
  if (!searchQuery.value.trim()) return;
  isLoading.value = true;
  try {
    const result = await contractStore.getContract(searchQuery.value);
    activeTab.value = 0;
    searchQuery.value = ''; // Limpia el campo de búsqueda
  } catch (error) {
    console.error('Error fetching contract data:', error);
    itemData.value = null;
  } finally {
    isLoading.value = false;
  }
}

// Obtener datos del elemento al montar
async function fetchItemData() {
  isLoading.value = true;
  try {
    if (route.params.id) {
      
      const result = await contractStore.getContracts(route.params.id);

      itemData.value = result.data;
    }
  } catch (error) {
    console.error('Error fetching support data:', error);
    itemData.value = null;
  } finally {
    isLoading.value = false;
  }
}

// Función para manejar la lógica de recarga según el tab seleccionado
function reloadTabData(tabIndex: number) {
  isLoading.value = true;

  switch (tabIndex) {
    case 0:
      // General Info
      fetchItemData();
      break;
    case 1:
      // Billing History
      console.log('Fetching Billing History');
      break;
    case 2:
      // Payment History
      console.log('Fetching Payment History');
      break;
    // Agrega más casos para los demás tabs
    default:
      console.log('No specific action for this tab');
  }

  isLoading.value = false;
}

// Función para abrir el diálogo de búsqueda avanzada
function openAdvanceSearchDialog() {
  openDialog(ContractSearchDialog, {}, { width: '100%', persistent: true }).then((result) => {
    if (result === 'submit') {
      // irse al primer tab
      activeTab.value = 0;
    }
  });
}

// Watch para detectar cambios de tab y recargar datos
watch(activeTab, (newTabIndex) => {
  reloadTabData(newTabIndex);
});

// Montar datos al iniciar el componente
onMounted(fetchItemData);
</script>

<template>
  <VRow>
    <VCol>
      <!-- Card con el buscador -->
      <AppCardActions :loading="isLoading" :title="$t('contract_search')" @refresh="searchContract" no-actions>
        <VCardText>
          <div class="d-flex flex-column flex-md-row justify-center align-center">
        <VTextField
          v-model="searchQuery"
          :label="t('search.contract')"
          variant="outlined"
          outlined
          dense
          class="mb-2 mb-md-0 me-md-4 w-100"
          @keyup.enter="searchContract"
          
        />
        <VBtn color="success" @click="searchContract" class="mb-2 mb-md-0 me-md-2 w-100 w-md-auto">
          <VIcon icon="tabler-search" class="me-2" />
          {{ t('search.search') }}
        </VBtn>
        <VBtn color="primary" @click="openAdvanceSearchDialog" class="w-100 w-md-auto">
          <VIcon icon="tabler-search" class="me-2" />
          {{ t('search.advanced') }}
        </VBtn>
          </div>
        </VCardText>
      </AppCardActions>
    </VCol>
  </VRow>

  <VRow v-if="contractStore.item">
    <VCol cols="12">
      <AppCardActions :loading="isLoading" variant="outlined" style="border: none;" @refresh="searchContract" no-actions>
        <VCard>
          <VTabs v-model="activeTab">
            <VTab v-for="(tab, index) in tabs" :key="index">
              <VIcon :size="18" :icon="tab.icon" class="me-1" />
              {{ tab.title }}
            </VTab>
          </VTabs>
        </VCard>
        <VWindow v-model="activeTab" class="mt-4 disable-tab-transition" :touch="false">
          <VWindowItem v-for="(tab, index) in tabs" :key="index">
            <component :is="tab.component" :active-tab="activeTab"/>
          </VWindowItem>
        </VWindow>
      </AppCardActions>
    </VCol>
  </VRow>
</template>
