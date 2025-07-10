<!-- TabsHeaderMolecule.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Tab {
  value: string
  label: string
  icon: string
}

interface Props {
  modelValue: string
  tabs: Tab[]
  density?: 'default' | 'compact' | 'comfortable'
  color?: string
  variant?: 'text' | 'outlined' | 'elevated' | 'tonal' | 'flat'
}

interface Emits {
  'update:modelValue': [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  density: 'default',
  color: 'primary',
  variant: 'text',
})

const emit = defineEmits<Emits>()

const handleTabClick = (tab: Tab): void => {
  emit('update:modelValue', tab.value)
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
    :color="color"
    :variant="variant"
    :density="buttonDensity"
    mandatory
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <VBtn
      v-for="tab in tabs"
      :key="tab.value"
      :value="tab.value"
      :density="buttonDensity"
    >
      <VIcon
        :icon="tab.icon"
        start
        size="small"
      />
      {{ tab.label }}
    </VBtn>
  </VBtnToggle>
</template>

<style scoped>
.v-btn-toggle {
  border-radius: 8px;
}
</style>
