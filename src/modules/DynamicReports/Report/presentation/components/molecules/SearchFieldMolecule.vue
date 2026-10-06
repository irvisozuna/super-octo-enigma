<!-- SearchFieldMolecule.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string
  placeholder?: string
  density?: 'default' | 'comfortable' | 'compact'
  variant?: 'filled' | 'outlined' | 'plain' | 'underlined' | 'solo' | 'solo-inverted' | 'solo-filled'
  clearable?: boolean
  loading?: boolean
  disabled?: boolean
  debounce?: number
  minLength?: number
  maxLength?: number
  prependIcon?: string
  appendIcon?: string
}

interface Emits {
  'update:modelValue': [value: string]
  search: [query: string]
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Buscar...',
  density: 'default',
  variant: 'outlined',
  clearable: true,
  loading: false,
  disabled: false,
  debounce: 300,
  minLength: 0,
  maxLength: 255,
  prependIcon: 'tabler-search',
  appendIcon: '',
})

const emit = defineEmits<Emits>()

const inputValue = ref(props.modelValue)
const isFocused = ref(false)
let debounceTimer: NodeJS.Timeout | null = null

// Watch for external changes
watch(() => props.modelValue, newValue => {
  inputValue.value = newValue
})

// Watch for input changes with debounce
watch(inputValue, newValue => {
  // Clear existing timer
  if (debounceTimer)
    clearTimeout(debounceTimer)

  // Emit immediate update for v-model
  emit('update:modelValue', newValue)

  // Debounce search emission
  if (props.debounce > 0) {
    debounceTimer = setTimeout(() => {
      handleSearch(newValue)
    }, props.debounce)
  }
  else {
    handleSearch(newValue)
  }
})

const handleSearch = (query: string): void => {
  if (query.length >= props.minLength)
    emit('search', query)
}

const handleClear = (): void => {
  inputValue.value = ''
  emit('clear')
  emit('search', '')
}

const handleFocus = (event: FocusEvent): void => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent): void => {
  isFocused.value = false
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleSearch(inputValue.value)
  }
  else if (event.key === 'Escape') {
    event.preventDefault()
    handleClear()
  }
}
</script>

<template>
  <div class="search-field-molecule">
    <VTextField
      v-model="inputValue"
      :placeholder="placeholder"
      :density="density"
      :variant="variant"
      :clearable="clearable"
      :loading="loading"
      :disabled="disabled"
      :maxlength="maxLength"
      hide-details
      class="search-field"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
      @click:clear="handleClear"
    >
      <!-- Prepend Icon -->
      <template
        v-if="prependIcon"
        #prepend-inner
      >
        <VIcon
          :icon="prependIcon"
          :color="isFocused ? 'primary' : 'default'"
          size="18"
          class="search-field__icon"
        />
      </template>

      <!-- Append Icon -->
      <template
        v-if="appendIcon"
        #append-inner
      >
        <VIcon
          :icon="appendIcon"
          size="18"
          class="search-field__icon"
        />
      </template>

      <!-- Loading indicator -->
      <template
        v-if="loading"
        #append-inner
      >
        <VProgressCircular
          indeterminate
          size="16"
          width="2"
          color="primary"
        />
      </template>
    </VTextField>
  </div>
</template>

<style scoped>
.search-field-molecule {
  position: relative;
  inline-size: 100%;
}

.search-field {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-field__icon {
  transition: color 0.2s ease;
}

/* Focus state */
.search-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.1);
}

/* Custom styling for different variants */
.search-field :deep(.v-field--variant-outlined) {
  border-radius: 8px;
}

.search-field :deep(.v-field--variant-filled) {
  border-radius: 8px 8px 0 0;
}

/* Loading state */
.search-field :deep(.v-field--loading) {
  position: relative;
}

/* Clear button styling */
.search-field :deep(.v-field__clearable) {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.search-field :deep(.v-field__clearable:hover) {
  opacity: 1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .search-field-molecule {
    min-inline-size: 140px;
  }

  .search-field :deep(.v-field__input) {
    font-size: 0.875rem;
  }
}

/* Accessibility improvements */
.search-field :deep(.v-field__input) {
  caret-color: rgb(var(--v-theme-primary));
}

/* Animation for focus */
@keyframes focusGlow {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.1);
  }

  100% {
    box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.1);
  }
}

.search-field :deep(.v-field--focused .v-field__outline) {
  animation: focusGlow 0.3s ease-out;
}
</style>
