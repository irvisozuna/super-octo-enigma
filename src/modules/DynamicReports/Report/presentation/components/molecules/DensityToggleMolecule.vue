<!-- DensityToggleMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'

// Atoms
import IconButtonAtom from '../atoms/IconButtonAtom.vue'

interface DensityOption {
  value: string
  icon: string
  tooltip: string
}

interface Props {
  modelValue: string
  options: DensityOption[]
  color?: string
  variant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined'
  mandatory?: boolean
  multiple?: boolean
  density?: 'default' | 'comfortable' | 'compact'
}

interface Emits {
  'update:modelValue': [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'outlined',
  mandatory: true,
  multiple: false,
  density: 'compact',
})

const emit = defineEmits<Emits>()

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})

const buttonSize = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'small'
    case 'comfortable':
      return 'large'
    default:
      return 'default'
  }
})

const handleOptionClick = (option: DensityOption): void => {
  if (props.mandatory && selectedValue.value === option.value)
    return // Don't allow deselecting if mandatory

  selectedValue.value = option.value
}

const isSelected = (option: DensityOption): boolean => {
  return selectedValue.value === option.value
}

const getButtonVariant = (option: DensityOption): string => {
  return isSelected(option) ? 'tonal' : 'text'
}

const getButtonColor = (option: DensityOption): string | undefined => {
  return isSelected(option) ? props.color : undefined
}
</script>

<template>
  <div class="density-toggle-molecule">
    <VBtnToggle
      v-model="selectedValue"
      :mandatory="mandatory"
      :multiple="multiple"
      :color="color"
      :variant="variant"
      :density="density"
      class="density-toggle"
    >
      <IconButtonAtom
        v-for="option in options"
        :key="option.value"
        :icon="option.icon"
        :tooltip="option.tooltip"
        :variant="getButtonVariant(option)"
        :color="getButtonColor(option)"
        :size="buttonSize"
        :aria-pressed="isSelected(option)"
        class="density-toggle__button"
        @click="handleOptionClick(option)"
      />
    </VBtnToggle>
  </div>
</template>

<style scoped>
.density-toggle-molecule {
  display: inline-flex;
  align-items: center;
}

.density-toggle {
  overflow: hidden;
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 8px;
}

.density-toggle__button {
  border-radius: 0 !important;
  border-inline-end: 1px solid rgb(var(--v-theme-outline-variant));
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.density-toggle__button:last-child {
  border-inline-end: none;
}

.density-toggle__button:hover {
  z-index: 1;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

/* Selected state */
.density-toggle__button[aria-pressed="true"] {
  z-index: 2;
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

/* Focus management */
.density-toggle__button:focus-visible {
  z-index: 3;
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

/* Animation for selection change */
.density-toggle__button {
  position: relative;
  overflow: hidden;
}

.density-toggle__button::before {
  position: absolute;
  background-color: currentcolor;
  content: "";
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.density-toggle__button[aria-pressed="true"]::before {
  opacity: 0.12;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .density-toggle {
    border: none;
    background: transparent;
  }

  .density-toggle__button {
    border: 1px solid rgb(var(--v-theme-outline-variant));
    border-radius: 4px !important;
    margin-block: 0;
    margin-inline: 2px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .density-toggle {
    border-width: 2px;
  }

  .density-toggle__button[aria-pressed="true"] {
    outline: 2px solid currentcolor;
    outline-offset: -2px;
  }
}
</style>
