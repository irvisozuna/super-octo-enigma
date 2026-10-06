<!-- ChipAtom.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label: string
  icon?: string
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
  color?: string
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  closable?: boolean
  disabled?: boolean
  clickable?: boolean
}

interface Emits {
  click: [event: MouseEvent]
  close: [event: MouseEvent]
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  variant: 'tonal',
  color: undefined,
  size: 'default',
  closable: false,
  disabled: false,
  clickable: false,
})

const emit = defineEmits<Emits>()

const iconSize = computed(() => {
  switch (props.size) {
    case 'x-small':
      return 12
    case 'small':
      return 14
    case 'large':
      return 20
    case 'x-large':
      return 24
    default:
      return 16
  }
})

const handleClick = (event: MouseEvent): void => {
  if (!props.disabled && props.clickable)
    emit('click', event)
}

const handleClose = (event: MouseEvent): void => {
  if (!props.disabled) {
    event.stopPropagation()
    emit('close', event)
  }
}
</script>

<template>
  <VChip
    :variant="variant"
    :color="color"
    :size="size"
    :closable="closable"
    :disabled="disabled"
    class="chip-atom"
    :class="[
      { 'chip-atom--clickable': clickable && !disabled },
    ]"
    @click="handleClick"
    @click:close="handleClose"
  >
    <!-- Start Icon -->
    <VIcon
      v-if="icon"
      :icon="icon"
      :size="iconSize"
      start
    />

    <!-- Label -->
    <span class="chip-atom__label">{{ label }}</span>
  </VChip>
</template>

<style scoped>
.chip-atom {
  font-weight: 500;
  max-inline-size: 100%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.chip-atom__label {
  overflow: hidden;
  max-inline-size: 200px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-atom--clickable {
  cursor: pointer;
}

.chip-atom--clickable:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 10%);
  transform: translateY(-1px);
}

.chip-atom--clickable:active {
  transform: translateY(0);
}

/* Size-specific label constraints */
.chip-atom.v-chip--size-x-small .chip-atom__label {
  font-size: 0.75rem;
  max-inline-size: 120px;
}

.chip-atom.v-chip--size-small .chip-atom__label {
  font-size: 0.8rem;
  max-inline-size: 150px;
}

.chip-atom.v-chip--size-large .chip-atom__label {
  font-size: 1rem;
  max-inline-size: 250px;
}

.chip-atom.v-chip--size-x-large .chip-atom__label {
  font-size: 1.1rem;
  max-inline-size: 300px;
}

/* Focus styles for accessibility */
.chip-atom:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
