<!-- ExpandablePanelMolecule.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'

// Atoms
import IconButtonAtom from '../atoms/IconButtonAtom.vue'

interface Props {
  title: string
  subtitle?: string
  icon?: string
  defaultExpanded?: boolean
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'outlined' | 'elevated' | 'tonal'
  color?: string
  density?: 'default' | 'comfortable' | 'compact'
}

interface Emits {
  expand: []
  collapse: []
  toggle: [expanded: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: '',
  defaultExpanded: false,
  disabled: false,
  loading: false,
  variant: 'default',
  color: undefined,
  density: 'default',
})

const emit = defineEmits<Emits>()

const expanded = ref(props.defaultExpanded)

const toggleExpanded = (): void => {
  if (props.disabled || props.loading)
    return

  expanded.value = !expanded.value

  if (expanded.value)
    emit('expand')
  else
    emit('collapse')

  emit('toggle', expanded.value)
}

const chevronIcon = computed(() =>
  expanded.value ? 'tabler-chevron-up' : 'tabler-chevron-down',
)

const panelClass = computed(() => [
  'expandable-panel-molecule',
  `expandable-panel--${props.variant}`,
  `expandable-panel--${props.density}`,
  {
    'expandable-panel--expanded': expanded.value,
    'expandable-panel--disabled': props.disabled,
    'expandable-panel--loading': props.loading,
  },
])

const headerPadding = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'pa-2'
    case 'comfortable':
      return 'pa-4'
    default:
      return 'pa-3'
  }
})

const contentPadding = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'pa-2 pt-0'
    case 'comfortable':
      return 'pa-4 pt-0'
    default:
      return 'pa-3 pt-0'
  }
})
</script>

<template>
  <div :class="panelClass">
    <!-- Header -->
    <div
      class="expandable-panel__header"
      :class="[headerPadding]"
      role="button"
      :tabindex="disabled ? -1 : 0"
      :aria-expanded="expanded"
      :aria-disabled="disabled"
      @click="toggleExpanded"
      @keydown.enter="toggleExpanded"
      @keydown.space.prevent="toggleExpanded"
    >
      <div class="d-flex align-center">
        <!-- Expand/Collapse Button -->
        <IconButtonAtom
          :icon="chevronIcon"
          :disabled="disabled"
          :loading="loading"
          size="small"
          variant="text"
          class="expandable-panel__toggle me-2"
          @click.stop="toggleExpanded"
        />

        <!-- Icon -->
        <VIcon
          v-if="icon"
          :icon="icon"
          :color="color"
          size="20"
          class="me-2"
        />

        <!-- Title and Subtitle -->
        <div class="expandable-panel__content flex-grow-1">
          <div class="expandable-panel__title text-subtitle-2 font-weight-medium">
            {{ title }}
          </div>
          <div
            v-if="subtitle"
            class="expandable-panel__subtitle text-caption text-medium-emphasis mt-1"
          >
            {{ subtitle }}
          </div>
        </div>

        <!-- Header Actions Slot -->
        <div
          v-if="$slots.actions"
          class="expandable-panel__actions"
        >
          <slot name="actions" />
        </div>
      </div>
    </div>

    <!-- Expandable Content -->
    <VExpandTransition>
      <div
        v-show="expanded"
        class="expandable-panel__body"
        :class="[contentPadding]"
      >
        <slot />
      </div>
    </VExpandTransition>
  </div>
</template>

<style scoped>
.expandable-panel-molecule {
  overflow: hidden;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Variant styles */
.expandable-panel--default {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  background-color: rgb(var(--v-theme-surface));
}

.expandable-panel--outlined {
  border: 2px solid rgb(var(--v-theme-outline));
  background-color: transparent;
}

.expandable-panel--elevated {
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 10%);
}

.expandable-panel--tonal {
  border: 1px solid transparent;
  background-color: rgb(var(--v-theme-surface-variant));
}

/* Header styles */
.expandable-panel__header {
  border-block-end: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.expandable-panel__header:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.expandable-panel__header:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

/* Expanded state */
.expandable-panel--expanded .expandable-panel__header {
  border-block-end-color: rgb(var(--v-theme-outline-variant));
}

/* Disabled state */
.expandable-panel--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.expandable-panel--disabled .expandable-panel__header {
  cursor: not-allowed;
}

/* Loading state */
.expandable-panel--loading .expandable-panel__header {
  cursor: wait;
}

/* Toggle button */
.expandable-panel__toggle {
  transition: transform 0.2s ease;
}

.expandable-panel--expanded .expandable-panel__toggle {
  transform: rotate(180deg);
}

/* Title and subtitle */
.expandable-panel__title {
  line-height: 1.3;
}

.expandable-panel__subtitle {
  line-height: 1.4;
  max-inline-size: 300px;
}

/* Actions area */
.expandable-panel__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-inline-start: auto;
}

/* Body content */
.expandable-panel__body {
  background-color: rgb(var(--v-theme-background));
  border-block-start: 1px solid rgb(var(--v-theme-outline-variant));
}

/* Density variations */
.expandable-panel--compact .expandable-panel__title {
  font-size: 0.875rem;
}

.expandable-panel--compact .expandable-panel__subtitle {
  font-size: 0.75rem;
}

.expandable-panel--comfortable .expandable-panel__title {
  font-size: 1rem;
}

.expandable-panel--comfortable .expandable-panel__subtitle {
  font-size: 0.875rem;
}

/* Animation for content */
.expandable-panel__body {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .expandable-panel__header {
    padding-block: 12px;
    padding-inline: 16px;
  }

  .expandable-panel__body {
    padding-block: 12px;
    padding-inline: 16px;
  }

  .expandable-panel__subtitle {
    max-inline-size: 200px;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .expandable-panel--default,
  .expandable-panel--outlined {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .expandable-panel-molecule,
  .expandable-panel__header,
  .expandable-panel__toggle {
    transition: none;
  }
}
</style>
