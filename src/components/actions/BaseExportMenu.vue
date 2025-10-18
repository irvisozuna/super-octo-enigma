<script setup lang="ts">
/**
 * BaseExportMenu - Componente de menú de exportación reutilizable
 *
 * Uso:
 * <BaseExportMenu
 *   :loading="exporting"
 *   :disabled="!hasData"
 *   @export="handleExport"
 * />
 */

export interface ExportFormat {
  type: 'excel' | 'pdf' | 'csv' | 'json'
  label: string
  icon: string
  color?: string
}

interface Props {
  formats?: ExportFormat[]
  loading?: boolean
  disabled?: boolean
  buttonText?: string
  buttonVariant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  buttonColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  formats: () => [
    { type: 'excel', label: 'Exportar a Excel', icon: 'tabler-file-spreadsheet', color: 'success' },
    { type: 'pdf', label: 'Exportar a PDF', icon: 'tabler-file-type-pdf', color: 'error' },
    { type: 'csv', label: 'Exportar a CSV', icon: 'tabler-file-text', color: 'info' },
  ],
  loading: false,
  disabled: false,
  buttonText: 'Exportar',
  buttonVariant: 'outlined',
  buttonColor: 'secondary',
})

const emit = defineEmits<{
  'export': [format: ExportFormat['type']]
}>()

const handleExport = (format: ExportFormat['type']) => {
  emit('export', format)
}
</script>

<template>
  <VMenu>
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        :variant="buttonVariant"
        :color="buttonColor"
        :loading="loading"
        :disabled="disabled"
        prepend-icon="tabler-download"
      >
        {{ buttonText }}
      </VBtn>
    </template>

    <VList>
      <VListItem
        v-for="format in formats"
        :key="format.type"
        @click="handleExport(format.type)"
      >
        <template #prepend>
          <VIcon
            :icon="format.icon"
            :color="format.color"
          />
        </template>
        <VListItemTitle>{{ format.label }}</VListItemTitle>
      </VListItem>
    </VList>
  </VMenu>
</template>
