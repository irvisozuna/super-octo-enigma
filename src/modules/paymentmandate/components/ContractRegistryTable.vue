<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ContractRegistry } from '../types/contractRegistry'
import BaseTable from '@/components/BaseTable.vue'

interface Props {
  headers: any[]
  items: ContractRegistry[]
  total: number
  page: number
  itemsPerPage: number
  loading: boolean
  selection: ContractRegistry[]
  module: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selection': [value: ContractRegistry[]]
  'update:page': [value: number]
  'update:items-per-page': [value: number]
  'view': [item: ContractRegistry]
  'edit': [item: ContractRegistry]
  'delete': [item: ContractRegistry]
  'update:items-update-option': [value: any]
}>()

const { t } = useI18n()

// Formatear datos para la tabla
const formattedItems = computed(() => {
  return props.items.map(item => ({
    ...item,
    maxAmount: new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'MXN',
    }).format(item.maxAmount),
    cardNumber: item.cardNumber ? `****${item.cardNumber.slice(-4)}` : '',
    expirationDate: item.expirationDate || '-',
    registrationDate: item.registrationDate ? new Date(item.registrationDate).toLocaleDateString('es-ES') : '-',
  }))
})

function handleSelectionChange(selection: ContractRegistry[]) {
  emit('update:selection', selection)
}

function handlePageChange(page: number) {
  emit('update:page', page)
}

function handleItemsPerPageChange(itemsPerPage: number) {
  emit('update:items-per-page', itemsPerPage)
}

function handleView(item: ContractRegistry) {
  // Encontrar el item original sin formatear
  const originalItem = props.items.find(original => original.id === item.id)

  emit('view', originalItem || item)
}

function handleEdit(item: ContractRegistry) {
  // Encontrar el item original sin formatear
  const originalItem = props.items.find(original => original.id === item.id)

  emit('edit', originalItem || item)
}

function handleDelete(item: ContractRegistry) {
  emit('delete', item)
}

function handleSortChange(options: any) {
  emit('update:items-update-option', options)
}
</script>

<template>
  <BaseTable
    :headers="headers"
    :items="formattedItems"
    :total="total"
    :page="page"
    :items-per-page="itemsPerPage"
    :loading="loading"
    :selection="selection"
    :module="module"
    @update:selection="handleSelectionChange"
    @update:page="handlePageChange"
    @update:items-per-page="handleItemsPerPageChange"
    @update:items-update-option="handleSortChange"
  >
    <!-- Slot personalizado para las acciones -->
    <template #actions="{ item }">
      <div class="d-flex align-center gap-2">
        <!-- Botón de Ver Detalle -->
        <VBtn
          icon="tabler-eye"
          size="small"
          variant="text"
          color="primary"
          @click="handleView(item)"
        >
          <VIcon icon="tabler-eye" />
          <VTooltip
            activator="parent"
            location="top"
          >
            {{ $t('view') }}
          </VTooltip>
        </VBtn>

        <!-- Menú de 3 puntos -->
        <VMenu>
          <template #activator="{ props: menuProps }">
            <VBtn
              icon="tabler-dots-vertical"
              size="small"
              variant="text"
              color="default"
              v-bind="menuProps"
            >
              <VIcon icon="tabler-dots-vertical" />
              <VTooltip
                activator="parent"
                location="top"
              >
                {{ $t('more_actions') }}
              </VTooltip>
            </VBtn>
          </template>

          <VList>
            <VListItem
              prepend-icon="tabler-pencil"
              @click="handleEdit(item)"
            >
              <VListItemTitle>{{ $t('edit') }}</VListItemTitle>
            </VListItem>
            <VListItem
              prepend-icon="tabler-trash"
              class="text-error"
              @click="handleDelete(item)"
            >
              <VListItemTitle class="text-error">
                {{ $t('delete') }}
              </VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
      </div>
    </template>
  </BaseTable>
</template>
