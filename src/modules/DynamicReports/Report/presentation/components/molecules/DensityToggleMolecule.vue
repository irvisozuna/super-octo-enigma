<!-- DensityToggleMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface DensityOption {
  value: string
  icon: string
  tooltip: string
}

interface Props {
  modelValue: string
  options: DensityOption[]
  density?: 'default' | 'compact' | 'comfortable'
  variant?: 'text' | 'outlined' | 'elevated' | 'tonal' | 'flat'
}

interface Emits {
  'update:modelValue': [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  density: 'compact',
  variant: 'text',
})

const emit = defineEmits<Emits>()

const handleDensityChange = (value: string): void => {
  emit('update:modelValue', value)
}

const buttonDensity = computed(() => {
  switch (props.density) {
    case 'compact':
      return 'compact'
    case 'comfortable':
      return 'comfortable'
    default:
      return 'default'
  }
})
</script>

<template>
  <VBtnToggle
    :model-value="modelValue"
    :variant="variant"
    :density="buttonDensity"
    mandatory
    @update:model-value="handleDensityChange"
  >
    <VBtn
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :density="buttonDensity"
    >
      <VTooltip
        :text="option.tooltip"
        location="bottom"
      >
        <template #activator="{ props: tooltipProps }">
          <VIcon
            :icon="option.icon"
            v-bind="tooltipProps"
            size="small"
          />
        </template>
      </VTooltip>
    </VBtn>
  </VBtnToggle>
</template>

<style scoped>
.v-btn-toggle {
  border-radius: 8px;
}
</style>
