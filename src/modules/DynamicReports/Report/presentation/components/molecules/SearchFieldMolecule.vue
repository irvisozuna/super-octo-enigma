<!-- SearchFieldMolecule.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  density?: 'default' | 'compact' | 'comfortable'
  clearable?: boolean
  prependIcon?: string
  appendIcon?: string
}

interface Emits {
  'update:modelValue': [value: string]
  search: [query: string]
  clear: []
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search...',
  density: 'default',
  clearable: true,
  prependIcon: 'tabler-search',
})

const emit = defineEmits<Emits>()

const searchValue = ref(props.modelValue)

watch(() => props.modelValue, newValue => {
  searchValue.value = newValue
})

const handleInput = (value: string): void => {
  searchValue.value = value
  emit('update:modelValue', value)
}

const handleClear = (): void => {
  searchValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
}

const handleSearch = (): void => {
  emit('search', searchValue.value)
}
</script>

<template>
  <VTextField
    v-model="searchValue"
    :placeholder="placeholder"
    :density="density"
    :clearable="clearable"
    :prepend-inner-icon="prependIcon"
    :append-inner-icon="appendIcon"
    variant="outlined"
    hide-details
    single-line
    @update:model-value="handleInput"
    @click:clear="handleClear"
    @keyup.enter="handleSearch"
  />
</template>

<style scoped>
.v-text-field {
  max-inline-size: 300px;
}
</style>
