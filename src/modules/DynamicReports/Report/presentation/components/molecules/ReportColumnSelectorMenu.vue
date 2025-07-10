<script setup lang="ts">
defineProps<{
  fields: any[]
  visibleColumns: string[]
  frozenColumns: string[]
}>()

defineEmits<{
  (e: 'toggle-column-visibility', field: string): void
  (e: 'freeze-column', field: string): void
}>()
</script>

<template>
  <VMenu :close-on-content-click="false">
    <template #activator="{ props }">
      <VBtn
        icon
        variant="text"
        v-bind="props"
      >
        <VIcon icon="tabler-columns" />
        <VTooltip activator="parent">
          Configurar columnas
        </VTooltip>
      </VBtn>
    </template>
    <VList
      min-width="200"
      class="pa-2"
    >
      <VListItem
        v-for="field in fields"
        :key="field.field"
        class="py-1 px-2"
        style="min-block-size: 36px;"
      >
        <div
          class="d-flex align-center gap-2"
          style="inline-size: 100%;"
        >
          <VCheckbox
            :model-value="visibleColumns.includes(field.field)"
            hide-details
            density="compact"
            class="me-1"
            style="margin-block-end: 0;"
            @update:model-value="$emit('toggle-column-visibility', field.field)"
          />
          <VListItemTitle
            class="text-body-2"
            style="flex: 1; min-inline-size: 80px;"
          >
            {{ field.alias || field.field }}
          </VListItemTitle>
          <VBtn
            icon
            size="x-small"
            variant="text"
            @click.stop="$emit('freeze-column', field.field)"
          >
            <VIcon
              :icon="frozenColumns.includes(field.field) ? 'tabler-pin' : 'tabler-pin-filled'"
              size="16"
              :color="frozenColumns.includes(field.field) ? 'primary' : undefined"
            />
          </VBtn>
        </div>
      </VListItem>
    </VList>
  </VMenu>
</template>
