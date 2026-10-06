<!-- IconButtonAtom.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon: string
  tooltip?: string
  variant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'
  color?: string
  size?: string | number
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
}

interface Emits {
  click: [event: MouseEvent]
}

const props = withDefaults(defineProps<Props>(), {
  tooltip: '',
  variant: 'text',
  color: undefined,
  size: 'default',
  disabled: false,
  loading: false,
  ariaLabel: '',
})

const emit = defineEmits<Emits>()

const computedAriaLabel = computed(() =>
  props.ariaLabel || props.tooltip || 'Button',
)

const buttonSize = computed(() => {
  if (typeof props.size === 'number')
    return props.size

  switch (props.size) {
    case 'x-small':
      return 'x-small'
    case 'small':
      return 'small'
    case 'large':
      return 'large'
    case 'x-large':
      return 'x-large'
    default:
      return 'default'
  }
})

const iconSize = computed(() => {
  switch (buttonSize.value) {
    case 'x-small':
      return 16
    case 'small':
      return 18
    case 'large':
      return 28
    case 'x-large':
      return 32
    default:
      return 24
  }
})

const handleClick = (event: MouseEvent): void => {
  if (!props.disabled && !props.loading)
    emit('click', event)
}
</script>

<template>
  <VBtn
    :icon="icon"
    :variant="variant"
    :color="color"
    :size="buttonSize"
    :disabled="disabled"
    :loading="loading"
    :aria-label="computedAriaLabel"
    class="icon-button-atom"
    @click="handleClick"
  >
    <VIcon
      :icon="icon"
      :size="iconSize"
    />

    <!-- Tooltip -->
    <VTooltip
      v-if="tooltip && !disabled"
      activator="parent"
      location="bottom"
      :text="tooltip"
    />
  </VBtn>
</template>

<style scoped>
.icon-button-atom {
  border-radius: 50%;
  min-block-size: 44px;
  min-inline-size: 44px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-button-atom:hover {
  transform: scale(1.05);
}

.icon-button-atom:active {
  transform: scale(0.95);
}

/* Size variants */
.icon-button-atom.v-btn--size-x-small {
  min-block-size: 32px;
  min-inline-size: 32px;
}

.icon-button-atom.v-btn--size-small {
  min-block-size: 36px;
  min-inline-size: 36px;
}

.icon-button-atom.v-btn--size-large {
  min-block-size: 52px;
  min-inline-size: 52px;
}

.icon-button-atom.v-btn--size-x-large {
  min-block-size: 60px;
  min-inline-size: 60px;
}

/* Focus styles for accessibility */
.icon-button-atom:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
