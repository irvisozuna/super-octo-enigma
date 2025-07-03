<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, defineEmits, defineProps, ref, watch } from 'vue'
import { useAbility } from '@casl/vue'

interface Header {
  title: string
  value: string
  permission?: {
    action: string
    subject: string
  }
}

// Props
const props = defineProps({
  headers: {
    type: Array as PropType<Header[]>,
    required: true,
    validator: (value: Header[]) => {
      return value.every(header =>
        typeof header === 'object'
        && 'title' in header
        && 'value' in header,
      )
    },
  }, // Encabezados de la tabla
  items: { type: Array, required: true }, // Elementos a mostrar
  total: { type: Number, required: true }, // Total de elementos
  page: { type: Number, required: true }, // Página actual
  itemsPerPage: { type: Number, required: true }, // Elementos por página
  loading: { type: Boolean, required: true }, // Estado de carga
  itemsPerPageOptions: { type: Array, default: () => [10, 25, 50, 100] }, // Opciones para la paginación
  selection: { type: Array, default: () => [] }, // Elementos seleccionados
})

// Emits
const emits = defineEmits([
  'update:page',
  'update:items-per-page',
  'update:selection',
  'view',
  'edit',
  'delete',
])

// ACL
const ability = useAbility()

// Computed para verificar si existe la columna de acciones
const hasActionsColumn = computed(() => {
  return props.headers.some(header => header.value === 'actions')
})

// Local refs para manejar paginación
const localPage = ref(props.page || 1) // Valor predeterminado: 1
const localItemsPerPage = ref(props.itemsPerPage || 10) // Valor predeterminado: 10

// Computed para el v-model de selección
const internalSelection = computed({
  get: () => props.selection,
  set: val => emits('update:selection', val),
})

// Watch para sincronizar props con refs locales
watch(
  () => props.page,
  newPage => (localPage.value = newPage),
)

watch(
  () => props.itemsPerPage,
  newItemsPerPage => (localItemsPerPage.value = newItemsPerPage),
)

// Métodos
function updatePage(newPage: number) {
  emits('update:page', newPage)
}

function updateItemsPerPage(newItemsPerPage: number) {
  emits('update:items-per-page', newItemsPerPage)
}

// Computed para filtrar headers basado en permisos
const filteredHeaders = computed(() => {
  return props.headers.filter(header => {
    if (!header.permission)
      return true

    return ability.can(header.permission.action, header.permission.subject)
  })
})
</script>

<template>
  <VDataTableServer
    v-model="internalSelection"
    :headers="filteredHeaders"
    :items="items"
    :items-length="total"
    :page="localPage"
    item-value="rowid"
    return-object
    :items-per-page="localItemsPerPage"
    :loading="loading"
    :show-select="hasActionsColumn.value"
    :items-per-page-options="itemsPerPageOptions"
    @update:page="updatePage"
    @update:items-per-page="updateItemsPerPage"
  >
    <!-- Renderizado de columnas dinámico -->
    <template
      v-for="header in filteredHeaders"
      :key="header.value"
      #[`item.${header.value}`]="{ item }"
    >
      <slot
        :name="header.value"
        :item="item"
      >
        {{ item?.[header.value] || '' }}
      </slot>
    </template>

    <!-- Columna de acciones (contenido predeterminado si no se proporciona un slot personalizado) -->
    <template #item.actions="{ item }">
      <slot
        name="actions"
        :item="item"
      >
        <!-- Contenido predeterminado (botones de view, edit, delete) -->
        <VBtn
          icon="tabler-eye"
          rounded
          variant="text"
          @click="$emit('view', item)"
        >
          <VIcon icon="tabler-eye" />
          <VTooltip
            activator="parent"
            location="top"
          >
            {{ $t('view') }}
          </VTooltip>
        </VBtn>
        <VBtn
          icon="tabler-pencil"
          rounded
          variant="text"
          @click="$emit('edit', item)"
        >
          <VIcon icon="tabler-pencil" />
          <VTooltip
            activator="parent"
            location="top"
          >
            {{ $t('edit') }}
          </VTooltip>
        </VBtn>
        <VBtn
          icon="tabler-trash"
          rounded
          color="error"
          variant="text"
          @click="$emit('delete', item)"
        >
          <VIcon icon="tabler-trash" />
          <VTooltip
            activator="parent"
            location="top"
          >
            {{ $t('delete') }}
          </VTooltip>
        </VBtn>
      </slot>
    </template>
  </VDataTableServer>
</template>
