<script setup lang="ts">
import BaseTable from '@/components/BaseTable.vue'
import { useAppManager } from '@/composables/useAppManager'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// Props para personalizar el título y descripción
const props = defineProps({
  activeTab: { type: Number, required: true },
})

const { t } = useI18n()
const { closeDialog } = useAppManager()
const contractStore = useContractStore()

const contracts = ref([]) // Inicialmente sin datos
const loading = ref(true) // Estado de carga activado al inicio
const selectedContract = ref(null)
const searchQuery = ref('')
const showMessageDialog = ref(false)
const selectedMessage = ref('')

const pagination = ref({
  limit: 10,
  offset: 0,
  count: 0,
  total: 0,
})

// Encabezados de la tabla
const headers = [
  { title: t('date'), value: 'datec' },
  { title: t('reference'), value: 'ref' },
  { title: t('subject'), value: 'subject' },
  { title: t('priority'), value: 'severity_code' },
  { title: t('type'), value: 'type_code' },
  { title: t('resolution'), value: 'resolution' },
  { title: t('author'), value: 'reported_by' },
  { title: t('message'), value: 'message' },
  { title: t('closed_comments'), value: 'closed_comments' },

  // { title: t('closed'), value: 'totalPaid' },
  { title: t('status'), value: 'status' },
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

// Función para manejar la entrada de búsqueda
function onSearchInput() {
  pagination.value.offset = 0
  pagination.value.search = searchQuery.value
  fetchData()
}

// Función para cargar los datos
async function fetchData() {
  loading.value = true
  try {
    const response = await contractStore.getWorkOrdersByContract(contractStore.item.id_account, pagination.value)

    contracts.value = replaceNullWithEmptyString(response.data) // Reemplazar null por ''
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
function replaceNullWithEmptyString(data: any[]) {
  return data.map(item => {
    const newItem = { ...item }
    for (const key in newItem) {
      if (newItem[key] === null)
        newItem[key] = ''
    }

    return newItem
  })
}

// Agregar esta nueva función antes del onMounted
function showFullMessage(message: string) {
  selectedMessage.value = message
  showMessageDialog.value = true
}

// Montar datos al iniciar el componente
onMounted(fetchData)

// Escuchar cambios en el tab activo y recargar datos
watch(() => props.activeTab, newTab => {
  if (newTab === 4) { // Suponiendo que el tab de BillingHistory es el índice 1
    fetchData()
  }
})
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
        <template #message="{ item }">
          <div class="d-flex align-center">
            <div
              class="text-truncate"
              style="max-inline-size: 200px;"
              v-html="item.message"
            />
            <VIcon
              v-if="item.message"
              icon="tabler-eye"
              size="small"
              class="ms-2 cursor-pointer"
              @click="showFullMessage(item.message)"
            />
          </div>
        </template>
        <template #type_code="{ item }">
          {{ $t(item.type_code) }}
        </template>
        <template #datec="{ item }">
          {{ $formatDate(item.datec) }}
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

    <!-- Agregar el diálogo para mostrar el mensaje completo -->
    <VDialog
      v-model="showMessageDialog"
      max-width="600"
    >
      <VCard>
        <VCardTitle>{{ t('message') }}</VCardTitle>
        <VCardText>
          <div v-html="selectedMessage" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            @click="showMessageDialog = false"
          >
            {{ t('close') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
