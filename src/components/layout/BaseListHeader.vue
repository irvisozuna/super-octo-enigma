<script setup lang="ts">
import { computed } from 'vue'

/**
 * BaseListHeader - Componente de header para listas
 *
 * Uso:
 * <BaseListHeader
 *   title="Herramientas"
 *   :total="150"
 *   item-label="herramienta"
 *   item-label-plural="herramientas"
 *   @create="handleCreate"
 * >
 *   <template #actions>
 *     <BaseExportMenu @export="handleExport" />
 *   </template>
 * </BaseListHeader>
 */

interface Props {
  title?: string
  icon?: string
  total?: number
  itemLabel?: string
  itemLabelPlural?: string
  description?: string
  createButtonText?: string
  createButtonIcon?: string
  showCreateButton?: boolean
  canCreate?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  icon: '',
  total: 0,
  itemLabel: 'item',
  itemLabelPlural: 'items',
  description: '',
  createButtonText: 'Crear',
  createButtonIcon: 'tabler-plus',
  showCreateButton: true,
  canCreate: true,
  loading: false,
})

const emit = defineEmits<{
  'create': []
}>()

const handleCreate = () => {
  emit('create')
}

const itemText = computed(() => {
  return props.total === 1 ? props.itemLabel : props.itemLabelPlural
})
</script>

<template>
  <div class="base-list-header">
    <!-- Title Section -->
    <div
      v-if="title || $slots.title"
      class="d-flex align-center justify-space-between flex-wrap gap-4 mb-4"
    >
      <div>
        <slot name="title">
          <h4 class="text-h4 mb-1 d-flex align-center gap-2">
            <VIcon
              v-if="icon"
              :icon="icon"
              size="28"
            />
            {{ title }}
            <VChip
              v-if="total > 0"
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ total }}
            </VChip>
          </h4>
        </slot>
        <p
          v-if="description"
          class="text-body-2 text-medium-emphasis mb-0"
        >
          {{ description }}
        </p>
      </div>

      <!-- Actions Slot -->
      <div
        v-if="$slots.actions || showCreateButton"
        class="d-flex gap-3"
      >
        <slot name="actions" />

        <VBtn
          v-if="showCreateButton"
          color="primary"
          :prepend-icon="createButtonIcon"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          {{ createButtonText }}
        </VBtn>
      </div>
    </div>

    <!-- Stats Bar -->
    <div
      v-if="total !== undefined"
      class="d-flex justify-space-between align-center mb-4"
    >
      <div class="text-body-1">
        <VIcon
          icon="tabler-list"
          size="18"
          class="me-1"
        />
        <span class="font-weight-medium">{{ total }}</span>
        <span class="text-medium-emphasis ms-1">{{ itemText }}</span>
      </div>

      <!-- Additional stats slot -->
      <slot name="stats" />
    </div>

    <!-- Extra content slot -->
    <slot />
  </div>
</template>

<style scoped lang="scss">
.base-list-header {
  margin-block-end: 1.5rem;
}
</style>
