<!-- AlertAtom.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  variant: 'tonal',
  title: '',
  text: '',
  icon: '',
  closable: false,
  dense: false,
})

const emit = defineEmits<Emits>()

// State Colors from design system
const StateColors = {
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#2563EB',
} as const

interface Props {
  type: 'success' | 'warning' | 'error' | 'info'
  variant?: 'flat' | 'tonal' | 'outlined' | 'text'
  title?: string
  text?: string
  icon?: string
  closable?: boolean
  dense?: boolean
}

interface Emits {
  close: []
}

const defaultIcons = {
  success: 'tabler-check-circle',
  warning: 'tabler-alert-triangle',
  error: 'tabler-alert-circle',
  info: 'tabler-info-circle',
}

const computedIcon = computed(() =>
  props.icon || defaultIcons[props.type],
)

const computedColor = computed(() => props.type)

const handleClose = (): void => {
  emit('close')
}
</script>

<template>
  <VAlert
    :type="type"
    :variant="variant"
    :color="computedColor"
    :closable="closable"
    :density="dense ? 'compact' : 'default'"
    class="alert-atom"
    @click:close="handleClose"
  >
    <!-- Custom Icon -->
    <template
      v-if="computedIcon"
      #prepend
    >
      <VIcon :icon="computedIcon" />
    </template>

    <!-- Title -->
    <div
      v-if="title"
      class="alert-atom__title font-weight-medium mb-1"
    >
      {{ title }}
    </div>

    <!-- Content -->
    <div
      v-if="text"
      class="alert-atom__text"
    >
      {{ text }}
    </div>

    <!-- Slot for custom content -->
    <slot v-if="!text" />
  </VAlert>
</template>

<style scoped>
.alert-atom {
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-atom__title {
  line-height: 1.3;
}

.alert-atom__text {
  line-height: 1.5;
  opacity: 0.9;
}

/* Type-specific styling */
.alert-atom :deep(.v-alert--variant-tonal) {
  border-inline-start: 4px solid currentcolor;
}

.alert-atom :deep(.v-alert--variant-outlined) {
  border-width: 2px;
}

/* Animation for enter/leave */
.alert-atom {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
