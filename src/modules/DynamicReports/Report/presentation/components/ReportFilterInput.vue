<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps({
  filter: { type: Object, required: true },
  value: { type: [String, Number, Array, Boolean, Object], default: null },
})

const emit = defineEmits(['update:value', 'apply'])

const localValue = ref(props.value)

watch(() => props.value, v => { localValue.value = v })
watch(localValue, v => emit('update:value', v))

const isSelect = computed(() => props.filter.type === 'selection')
const isText = computed(() => props.filter.type === 'text')
const isNumber = computed(() => props.filter.type === 'number')
const isDate = computed(() => props.filter.type === 'date')
const isBoolean = computed(() => props.filter.type === 'boolean')
const isRange = computed(() => props.filter.type === 'range')

const options = computed(() => props.filter.options || [])

function updateRange(key, val) {
  if (!localValue.value || typeof localValue.value !== 'object')
    localValue.value = { min: null, max: null }

  localValue.value[key] = val
  emit('update:value', localValue.value)
}
</script>

<template>
  <div class="filter-input-advanced">
    <label class="text-caption font-weight-medium mb-1 d-block">{{ filter.alias || filter.field }}</label>
    <VTextField
      v-if="isText"
      v-model="localValue"
      :placeholder="filter.placeholder"
      density="compact"
      variant="outlined"
      @keyup.enter="emit('apply', localValue)"
    />
    <VTextField
      v-if="isNumber"
      v-model.number="localValue"
      type="number"
      :placeholder="filter.placeholder"
      density="compact"
      variant="outlined"
      @keyup.enter="emit('apply', localValue)"
    />
    <VDatePicker
      v-if="isDate"
      v-model="localValue"
      :placeholder="filter.placeholder"
      density="compact"
      @change="emit('apply', localValue)"
    />
    <VSelect
      v-if="isSelect"
      v-model="localValue"
      :items="options"
      :placeholder="filter.placeholder"
      density="compact"
      variant="outlined"
      :multiple="filter.multiple"
      item-title="label"
      item-value="value"
      @change="emit('apply', localValue)"
    />
    <VSwitch
      v-if="isBoolean"
      v-model="localValue"
      :label="filter.alias"
      density="compact"
      @change="emit('apply', localValue)"
    />
    <div
      v-if="isRange"
      class="d-flex gap-2 align-center"
    >
      <VTextField
        :model-value="localValue?.min"
        type="number"
        label="Mínimo"
        density="compact"
        variant="outlined"
        style="max-inline-size: 100px;"
        @update:model-value="val => updateRange('min', val)"
      />
      <span class="mx-1">-</span>
      <VTextField
        :model-value="localValue?.max"
        type="number"
        label="Máximo"
        density="compact"
        variant="outlined"
        style="max-inline-size: 100px;"
        @update:model-value="val => updateRange('max', val)"
        @keyup.enter="emit('apply', localValue)"
      />
      <VBtn
        size="small"
        color="primary"
        @click="emit('apply', localValue)"
      >
        <VIcon
          icon="tabler-check"
          size="16"
        />
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.filter-input-advanced {
  margin-block-end: 20px;
}
</style>
