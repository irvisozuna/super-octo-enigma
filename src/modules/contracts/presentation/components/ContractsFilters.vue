<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useContractsStore } from '../stores/contractsStore'

interface ContractsFiltersProps {
  searchQuery?: string
  selectedStatus?: string | null
  selectedSector?: string | null
  selectedSystem?: string | null
  selectedTypeContract?: string | null
}

interface ContractsFiltersEmits {
  (e: 'update:searchQuery', value: string): void
  (e: 'update:selectedStatus', value: string | null): void
  (e: 'update:selectedSector', value: string | null): void
  (e: 'update:selectedSystem', value: string | null): void
  (e: 'update:selectedTypeContract', value: string | null): void
  (e: 'clear'): void
}

defineProps<ContractsFiltersProps>()

const emit = defineEmits<ContractsFiltersEmits>()
const contractsStore = useContractsStore()

// Opciones de filtros cargadas desde API
const statusOptions = ref<string[]>([])
const sectorOptions = ref<string[]>([])
const systemOptions = ref<string[]>([])
const typeContractOptions = ref<string[]>([])
const loading = ref(false)

// Cargar catálogos
const loadCatalogs = async () => {
  loading.value = true
  try {
    const catalogs = await contractsStore.fetchCatalogs()

    statusOptions.value = catalogs.status
    sectorOptions.value = catalogs.sectors
    systemOptions.value = catalogs.systems
    typeContractOptions.value = catalogs.type_contracts
  }
  catch (error) {
    console.error('Error loading filter catalogs:', error)
  }
  finally {
    loading.value = false
  }
}

const handleClear = () => {
  emit('update:searchQuery', '')
  emit('update:selectedStatus', null)
  emit('update:selectedSector', null)
  emit('update:selectedSystem', null)
  emit('update:selectedTypeContract', null)
  emit('clear')
}

onMounted(() => {
  loadCatalogs()
})
</script>

<template>
  <div>
    <!-- Primera fila: Búsqueda y Tipo de Contrato -->
    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <AppTextField
          :model-value="searchQuery"
          placeholder="Buscar por ID de contrato, cuenta o nombre de cliente..."
          prepend-inner-icon="tabler-search"
          clearable
          @update:model-value="emit('update:searchQuery', $event)"
        />
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <AppSelect
          :model-value="selectedTypeContract"
          :items="typeContractOptions"
          :loading="loading"
          item-title="name"
          item-value="externalId"
          placeholder="Tipo de Contrato"
          clearable
          @update:model-value="emit('update:selectedTypeContract', $event)"
        />
      </VCol>
    </VRow>

    <!-- Segunda fila: Sistema, Sector, Estado y Limpiar -->
    <VRow class="mt-2">
      <VCol
        cols="12"
        md="3"
      >
        <AppSelect
          :model-value="selectedSystem"
          :items="systemOptions"
          :loading="loading"
          item-title="name"
          item-value="externalId"
          placeholder="Sistema"
          clearable
          @update:model-value="emit('update:selectedSystem', $event)"
        />
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <AppSelect
          :model-value="selectedSector"
          :items="sectorOptions"
          :loading="loading"
          item-title="name"
          item-value="externalId"
          placeholder="Sector"
          clearable
          @update:model-value="emit('update:selectedSector', $event)"
        />
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <AppSelect
          :model-value="selectedStatus"
          :items="statusOptions"
          :loading="loading"
          item-title="name"
          item-value="externalId"
          placeholder="Estado"
          clearable
          @update:model-value="emit('update:selectedStatus', $event)"
        />
      </VCol>

      <VCol
        cols="12"
        md="3"
      >
        <VBtn
          block
          variant="tonal"
          color="secondary"
          @click="handleClear"
        >
          Limpiar Filtros
        </VBtn>
      </VCol>
    </VRow>
  </div>
</template>
