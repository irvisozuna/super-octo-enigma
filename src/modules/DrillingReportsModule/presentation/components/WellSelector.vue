<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useWells } from '../composables/useWells'
import { formatWellDepth, getWellStatusIcon, getWellTypeLabel } from '../../shared/utils/WellUtils'

interface Props {
  modelValue?: string
  projectId?: string
  rules?: any[]
  errorMessages?: string[]
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'wellSelected', well: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  projectId: '',
  rules: () => [],
  errorMessages: () => [],
  required: false,
})

const emit = defineEmits<Emits>()

const { wells, loading, fetchWellsByProject } = useWells()

const selectedWell = ref<string>(props.modelValue)

const wellOptions = computed(() => {
  return wells.value.map(well => ({
    ...well,
    id: well.id,
    name: well.name,
    well_type: well.well_type,
    depth_actual: well.depth_actual,
    status: well.status,
  }))
})

const rules = computed(() => {
  const baseRules = [...props.rules]
  if (props.required)
    baseRules.push((value: string) => !!value || 'Debe seleccionar un pozo')

  return baseRules
})

const handleWellChange = (value: string) => {
  selectedWell.value = value
  emit('update:modelValue', value)

  if (value) {
    const well = wells.value.find(w => w.id === value)
    if (well)
      emit('wellSelected', well)
  }
}

onMounted(() => {
  if (props.projectId)
    fetchWellsByProject(props.projectId)
})

watch(() => props.projectId, newProjectId => {
  if (newProjectId) {
    fetchWellsByProject(newProjectId)
    selectedWell.value = ''
    emit('update:modelValue', '')
  }
})

watch(() => props.modelValue, newValue => {
  selectedWell.value = newValue
})
</script>

<template>
  <div class="well-selector">
    <VSelect
      v-model="selectedWell"
      :items="wellOptions"
      :label="$t('DrillingReportsModule.wells.title')"
      :placeholder="$t('DrillingReportsModule.wells.selectWell')"
      :loading="loading"
      :error-messages="errorMessages"
      :rules="rules"
      :disabled="!projectId"
      item-title="name"
      item-value="id"
      clearable
      @update:model-value="handleWellChange"
    >
      <template #item="{ props, item }">
        <VListItem v-bind="props">
          <template #prepend>
            <VIcon :icon="getWellStatusIcon(item.raw.status)" />
          </template>
          <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
          <VListItemSubtitle>
            {{ getWellTypeLabel(item.raw.well_type) }} - {{ formatWellDepth(item.raw.depth_actual) }}
          </VListItemSubtitle>
        </VListItem>
      </template>

      <template #selection="{ item }">
        <div class="d-flex align-center">
          <VIcon
            :icon="getWellStatusIcon(item.raw.status)"
            class="me-2"
          />
          <span>{{ item.raw.name }}</span>
        </div>
      </template>
    </VSelect>
  </div>
</template>

<style scoped>
.well-selector {
  inline-size: 100%;
}
</style>
