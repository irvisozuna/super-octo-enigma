<script setup lang="ts">
import { useSupportStore } from '@/modules/support/stores/supportStore'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

// Interfaces
interface Tab {
  title: string
  icon: string
  component: any
}

interface ItemData {
  id: number
  name: string
  email: string
  role: string
  avatar?: string
  status: string
  country: string
}

// Ruta y Store
const route = useRoute() as { params: { id: string } }
const supportStore = useSupportStore()

// Estado
const itemData = ref<ItemData | null>(null)
const activeTab = ref(0)

// Tabs predeterminados
const tabs = ref<Tab[]>([
])

// Obtener datos del elemento
async function fetchItemData() {
  try {
    itemData.value = await supportStore.fetchItem(route.params.id as string)
  }
  catch (error) {
    console.error('Error fetching support data:', error)
    itemData.value = null
  }
}

// Montar datos al iniciar el componente
onMounted(fetchItemData)
</script>

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
      {{ $t('supportNotFound', { id: route.params.id }) }}
    </VAlert>
  </div>
</template>
