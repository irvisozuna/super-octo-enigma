<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WidgetInstanceConfig } from '../../domain/types/WidgetTypes'

interface Props {
  widget: WidgetInstanceConfig
  loading?: boolean
  error?: string | null
  isDraggable?: boolean
  isResizable?: boolean
  isSelected?: boolean
  showHeader?: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  isDraggable: true,
  isResizable: true,
  isSelected: false,
  showHeader: true,
  showActions: true,
})

const emit = defineEmits<{
  refresh: []
  edit: []
  delete: []
  clone: []
  fullscreen: []
  select: []
}>()

const isFullscreen = ref(false)
const menuOpen = ref(false)

const containerClasses = computed(() => ({
  'widget-container': true,
  'widget-container--selected': props.isSelected,
  'widget-container--fullscreen': isFullscreen.value,
  'widget-container--loading': props.loading,
  'widget-container--error': !!props.error,
}))

const gridStyle = computed(() => ({
  gridColumnStart: props.widget.position.x + 1,
  gridColumnEnd: `span ${props.widget.position.w}`,
  gridRowStart: props.widget.position.y + 1,
  gridRowEnd: `span ${props.widget.position.h}`,
}))

function handleRefresh() {
  emit('refresh')
}

function handleEdit() {
  emit('edit')
}

function handleDelete() {
  emit('delete')
}

function handleClone() {
  emit('clone')
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    emit('fullscreen')
  }
}

function handleSelect() {
  emit('select')
}
</script>

<template>
  <div
    :class="containerClasses"
    :style="gridStyle"
    @click="handleSelect"
  >
    <!-- Header -->
    <div
      v-if="showHeader"
      class="widget-header"
    >
      <div class="widget-header__title">
        <VIcon
          v-if="widget.widget?.props.type"
          :icon="widget.widget?.props.icon || 'tabler-widget'"
          size="20"
          class="mr-2"
        />
        <span class="text-sm font-medium">
          {{ widget.title || widget.widget?.props.name || 'Widget' }}
        </span>
      </div>

      <div
        v-if="showActions"
        class="widget-header__actions"
      >
        <VBtn
          icon
          variant="text"
          size="x-small"
          @click.stop="handleRefresh"
        >
          <VIcon icon="tabler-refresh" />
          <VTooltip
            activator="parent"
            location="top"
          >
            Refrescar
          </VTooltip>
        </VBtn>

        <VMenu
          v-model="menuOpen"
          location="bottom end"
        >
          <template #activator="{ props: menuProps }">
            <VBtn
              icon
              variant="text"
              size="x-small"
              v-bind="menuProps"
              @click.stop
            >
              <VIcon icon="tabler-dots-vertical" />
            </VBtn>
          </template>

          <VList density="compact">
            <VListItem @click="handleEdit">
              <template #prepend>
                <VIcon icon="tabler-edit" />
              </template>
              <VListItemTitle>Editar</VListItemTitle>
            </VListItem>

            <VListItem @click="handleClone">
              <template #prepend>
                <VIcon icon="tabler-copy" />
              </template>
              <VListItemTitle>Clonar</VListItemTitle>
            </VListItem>

            <VListItem @click="toggleFullscreen">
              <template #prepend>
                <VIcon :icon="isFullscreen ? 'tabler-minimize' : 'tabler-maximize'" />
              </template>
              <VListItemTitle>{{ isFullscreen ? 'Minimizar' : 'Pantalla completa' }}</VListItemTitle>
            </VListItem>

            <VDivider />

            <VListItem
              class="text-error"
              @click="handleDelete"
            >
              <template #prepend>
                <VIcon icon="tabler-trash" />
              </template>
              <VListItemTitle>Eliminar</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
      </div>
    </div>

    <!-- Content -->
    <div class="widget-content">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="widget-loading"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
        <p class="text-sm text-medium-emphasis mt-2">
          Cargando datos...
        </p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="widget-error"
      >
        <VIcon
          icon="tabler-alert-circle"
          size="48"
          color="error"
        />
        <p class="text-sm text-error mt-2">
          {{ error }}
        </p>
        <VBtn
          size="small"
          variant="outlined"
          color="error"
          class="mt-4"
          @click="handleRefresh"
        >
          Reintentar
        </VBtn>
      </div>

      <!-- Widget Content Slot -->
      <slot v-else />
    </div>

    <!-- Resize Handle -->
    <div
      v-if="isResizable && !isFullscreen"
      class="widget-resize-handle"
    >
      <VIcon
        icon="tabler-grip-horizontal"
        size="16"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.widget-container {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &--selected {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
  }

  &--fullscreen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    border-radius: 0;
    grid-column: 1 / -1 !important;
    grid-row: 1 / -1 !important;
  }

  &--loading {
    opacity: 0.7;
  }

  &--error {
    border-color: rgb(var(--v-theme-error));
  }
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-block-end: 1px solid rgb(var(--v-theme-border));
  background-color: rgb(var(--v-theme-surface));
  cursor: move;

  &__title {
    display: flex;
    align-items: center;
    font-weight: 500;
  }

  &__actions {
    display: flex;
    gap: 4px;
  }
}

.widget-content {
  position: relative;
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.widget-loading,
.widget-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  block-size: 100%;
  text-align: center;
}

.widget-resize-handle {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 24px;
  block-size: 24px;
  cursor: nwse-resize;
  opacity: 0;
  transition: opacity 0.2s ease;

  .widget-container:hover & {
    opacity: 0.5;
  }

  &:hover {
    opacity: 1 !important;
  }
}
</style>
