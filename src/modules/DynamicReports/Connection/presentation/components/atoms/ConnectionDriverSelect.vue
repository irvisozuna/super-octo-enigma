<script setup lang="ts">
import type { ConnectionDriver } from '../../../domain/entities/Connection'

interface Props {
  modelValue: ConnectionDriver
  label?: string
  error?: string
  disabled?: boolean
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: ConnectionDriver): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Connection Type',
  disabled: false,
  required: false,
})

const emit = defineEmits<Emits>()

const driverOptions = [
  // Database connections
  { title: 'MySQL', value: 'mysql', group: 'Database' },

  // { title: 'PostgreSQL', value: 'postgresql', group: 'Database' },
  // { title: 'SQL Server', value: 'sqlserver', group: 'Database' },
  // { title: 'Oracle', value: 'oracle', group: 'Database' },
  // { title: 'SQLite', value: 'sqlite', group: 'Database' },

  // API connections
  { title: 'REST API', value: 'api', group: 'API' },

  // File connections
  // { title: 'File (CSV, Excel, JSON)', value: 'file', group: 'File' },
]

function updateValue(value: ConnectionDriver) {
  emit('update:modelValue', value)
}
</script>

<template>
  <VSelect
    :model-value="modelValue"
    :label="label"
    :error-messages="error"
    :disabled="disabled"
    :items="driverOptions"
    item-title="title"
    item-value="value"
    group-by="group"
    density="comfortable"
    hide-details="auto"
    :required="required"
    @update:model-value="updateValue"
  >
    <template #item="{ item, props: itemProps }">
      <VListItem v-bind="itemProps">
        <template #prepend>
          <VIcon
            :icon="item.raw.group === 'Database' ? 'tabler-database' : item.raw.group === 'API' ? 'tabler-api' : 'tabler-file-text'"
            size="small"
            class="me-2"
          />
        </template>
        <template #append>
          <VChip
            size="x-small"
            :color="item.raw.group === 'Database' ? 'primary' : item.raw.group === 'API' ? 'success' : 'warning'"
            variant="tonal"
          >
            {{ item.raw.group }}
          </VChip>
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>
