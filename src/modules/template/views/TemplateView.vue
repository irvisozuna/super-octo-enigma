<template>
  <VRow v-if="itemData">
    <!-- Bio Panel -->
    <VCol cols="12" md="5" lg="4">
      <BioPanel :item-data="itemData" />
    </VCol>

    <!-- Tabs -->
    <VCol cols="12" md="7" lg="8">
      <VTabs v-model="activeTab" class="v-tabs-pill">
        <VTab v-for="tab in tabs" :key="tab.title">
          <VIcon :size="18" :icon="tab.icon" class="me-1" />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VWindow v-model="activeTab" class="mt-6 disable-tab-transition" :touch="false">
        <VWindowItem v-for="tab in tabs" :key="tab.title">
          <component :is="tab.component" :item-data="itemData" />
        </VWindowItem>
      </VWindow>
    </VCol>
  </VRow>

  <div v-else>
    <VAlert type="error" variant="tonal">
      {{ $t('templateNotFound', { id: route.params.id }) }}
    </VAlert>
  </div>
</template>

<script setup lang="ts">
import AccountTab from '@/modules/template/components/TemplateAccountTab.vue';
import BioPanel from '@/modules/template/components/TemplateBioPanel.vue';
import { useTemplateStore } from '@/modules/template/stores/templateStore';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

// Interfaces
interface Tab {
  title: string;
  icon: string;
  component: any;
}

interface ItemData {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: string;
  country: string;
}

// Ruta y Store
const route = useRoute() as { params: { id: string } };
const templateStore = useTemplateStore();

// Estado
const itemData = ref<ItemData | null>(null);
const activeTab = ref(0);

// Tabs predeterminados
const tabs = ref<Tab[]>([
  { icon: 'tabler-user', title: 'Bio', component: BioPanel },
  { icon: 'tabler-settings', title: 'Account', component: AccountTab },
]);

// Obtener datos del elemento
async function fetchItemData() {
  try {
    itemData.value = await templateStore.fetchItem(route.params.id as string);
  } catch (error) {
    console.error(`Error fetching template data:`, error);
    itemData.value = null;
  }
}

// Montar datos al iniciar el componente
onMounted(fetchItemData);
</script>
