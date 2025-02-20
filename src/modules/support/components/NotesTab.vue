<script setup lang="ts">
import BaseTable from '@/components/BaseTable.vue'; // Asegúrate de importar correctamente tu componente BaseTable
import { useAppManager } from '@/composables/useAppManager'
import { useNotification } from '@/helpers/notificationHelper'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AddNoteDialog from './dialog/AddNoteDialog.vue'

// Props para personalizar el título y descripción
const props = defineProps({
  activeTab: { type: Number, required: true },
})

const { t } = useI18n()
const { closeDialog } = useAppManager()
const contractStore = useContractStore()
const { showSuccess, showError } = useNotification()
const { openDialog } = useAppManager()

const notes = ref([])
const loading = ref(true)
const showAddNoteDialog = ref(false)
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

  { title: t('subject'), value: 'subject' },
  { title: t('content'), value: 'content' },
  { title: t('date'), value: 'datec' },
  { title: t('author'), value: 'author_name' },
]

// Función para actualizar la página
function updatePage(newPage: number) {
  pagination.value.offset = (newPage - 1) * pagination.value.limit
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
    const response = await contractStore.getNotesByContract(contractStore.item.id_account, pagination.value)

    notes.value = response.data
    pagination.value = response.pagination
  }
  catch (error) {
    console.error('Error al cargar las notas:', error)
  }
  finally {
    loading.value = false
  }
}

function showFullMessage(message: string) {
  selectedMessage.value = message
  showMessageDialog.value = true
}
function openAddNoteDialog() {
  openDialog(AddNoteDialog, {}, { width: '50%', persistent: true }).then(result => {
    if (result === 'submit') {
      console.log('Nota creada, refrescando datos...')
      fetchData()
    }
  })
}

// Montar datos al iniciar el componente
onMounted(fetchData)

// Escuchar cambios en el tab activo y recargar datos
watch(() => props.activeTab, newTab => {
  if (newTab === 7) { // Ajusta este número según el índice de tu tab de notas
    fetchData()
  }
})
</script>

<template>
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <div class="d-flex justify-end mb-4">
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          @click="openAddNoteDialog"
        >
          {{ t('add_note') }}
        </VBtn>
      </div>

      <!-- Tabla de notas -->
      <BaseTable
        v-if="!loading"
        :headers="headers"
        :items="notes"
        :total="pagination.total"
        :page="pagination.offset / pagination.limit + 1"
        :items-per-page="pagination.limit"
        :loading="loading"
        @update:page="updatePage"
        @update:items-per-page="updateItemsPerPage"
      >
        <template #subject="{ item }">
          <div class="d-flex align-center">
            {{ $t(item.subject) }}
          </div>
        </template>
        <template #content="{ item }">
          <div class="d-flex align-center">
            <div
              class="text-truncate"
              style="max-inline-size: 200px;"
              v-html="item.content"
            />
            <VIcon
              v-if="item.content"
              icon="tabler-eye"
              size="small"
              class="ms-2 cursor-pointer"
              @click="showFullMessage(item.content)"
            />
          </div>
        </template>
        <template #datec="{ item }">
          {{ $formatDate(item.datec, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }) || 'N/A' }}
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
