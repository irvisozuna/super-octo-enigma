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
      {{ $t('userNotFound', { id: route.params.id }) }}
    </VAlert>
  </div>
</template>

<script setup lang="ts">
import AccountTab from '@/modules/user/components/UserAccountTab.vue';
import BioPanel from '@/modules/user/components/UserBioPanel.vue';
import { useUserStore } from '@/modules/user/stores/userStore';
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
const userStore = useUserStore();

// Estado
const itemData = ref<ItemData | null>(null);
const activeTab = ref(0);

// Tabs predeterminados
const tabs = ref<Tab[]>([
  // { icon: 'tabler-user', title: 'info', component: BioPanel },
  { icon: 'tabler-settings', title: 'account', component: AccountTab },
]);

// Obtener datos del elemento
async function fetchItemData() {
  try {
    itemData.value = await userStore.fetchItem(route.params.id as string);
  } catch (error) {
    console.error(`Error fetching user data:`, error);
    itemData.value = null;
  }
}

// Montar datos al iniciar el componente
onMounted(fetchItemData);
</script>
