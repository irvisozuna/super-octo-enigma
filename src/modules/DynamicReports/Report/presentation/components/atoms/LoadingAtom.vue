<!-- LoadingAtom.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: string | number
  color?: string
  indeterminate?: boolean
  modelValue?: number
  width?: string | number
  text?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 40,
  color: 'primary',
  indeterminate: true,
  modelValue: 0,
  width: 4,
  text: '',
  overlay: false,
})

const computedSize = computed(() => {
  if (typeof props.size === 'string') {
    switch (props.size) {
      case 'x-small': return 16
      case 'small': return 24
      case 'large': return 56
      case 'x-large': return 72
      default: return Number.parseInt(props.size) || 40
    }
  }

  return props.size
})

const computedWidth = computed(() => {
  if (typeof props.width === 'string')
    return Number.parseInt(props.width) || 4

  return props.width
})
</script>

<template>
  <div
    v-if="overlay"
    class="loading-atom-overlay d-flex align-center justify-center"
  >
    <div class="loading-atom-content text-center">
      <VProgressCircular
        :size="computedSize"
        :width="computedWidth"
        :color="color"
        :indeterminate="indeterminate"
        :model-value="indeterminate ? undefined : modelValue"
        class="loading-atom__spinner"
      />

      <div
        v-if="text"
        class="loading-atom__text mt-3"
      >
        {{ text }}
      </div>
    </div>
  </div>

  <VProgressCircular
    v-else
    :size="computedSize"
    :width="computedWidth"
    :color="color"
    :indeterminate="indeterminate"
    :model-value="indeterminate ? undefined : modelValue"
    class="loading-atom"
  />
</template>

<style scoped>
.loading-atom {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.loading-atom-overlay {
  position: absolute;
  z-index: 1000;
  border-radius: inherit;
  backdrop-filter: blur(2px);
  background-color: rgba(255, 255, 255, 80%);
  inset: 0;
}

.loading-atom-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.loading-atom__spinner {
  animation: pulse 2s ease-in-out infinite;
}

.loading-atom__text {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
  font-weight: 500;
  max-inline-size: 200px;
}

@keyframes pulse {
  0%,
 100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .loading-atom-overlay {
    background-color: rgba(0, 0, 0, 80%);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .loading-atom__spinner {
    animation: none;
  }
}
</style>
