<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useEquipment } from '../composables/useEquipment'
import { getEquipmentTypeIcon, getEquipmentTypeLabel } from '../../shared/utils/EquipmentUtils'

interface Props {
  modelValue?: string
  rules?: any[]
  errorMessages?: string[]
  required?: boolean
  equipmentType?: string
  status?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'equipmentSelected', equipment: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  rules: () => [],
  errorMessages: () => [],
  required: false,
  equipmentType: '',
  status: '',
})

const emit = defineEmits<Emits>()

const { equipment, loading, fetchEquipment } = useEquipment()

const selectedEquipment = ref<string>(props.modelValue)

const equipmentOptions = computed(() => {
  let filteredEquipment = equipment.value

  if (props.equipmentType)
    filteredEquipment = filteredEquipment.filter(eq => eq.equipment_type === props.equipmentType)

  if (props.status)
    filteredEquipment = filteredEquipment.filter(eq => eq.status === props.status)

  return filteredEquipment.map(eq => ({
    ...eq,
    id: eq.id,
    name: eq.name,
    equipment_type: eq.equipment_type,
    manufacturer: eq.manufacturer,
    model: eq.model,
  }))
})

const rules = computed(() => {
  const baseRules = [...props.rules]
  if (props.required)
    baseRules.push((value: string) => !!value || 'Debe seleccionar un equipo')

  return baseRules
})

const handleEquipmentChange = (value: string) => {
  selectedEquipment.value = value
  emit('update:modelValue', value)

  if (value) {
    const equipment = equipment.value.find(e => e.id === value)
    if (equipment)
      emit('equipmentSelected', equipment)
  }
}

onMounted(() => {
  if (equipment.value.length === 0)
    fetchEquipment()
})

watch(() => props.modelValue, newValue => {
  selectedEquipment.value = newValue
})
</script>

<template>
  <div class="equipment-selector">
    <VSelect
      v-model="selectedEquipment"
      :items="equipmentOptions"
      :label="$t('DrillingReportsModule.equipment.title')"
      :placeholder="$t('DrillingReportsModule.equipment.selectEquipment')"
      :loading="loading"
      :error-messages="errorMessages"
      :rules="rules"
      item-title="name"
      item-value="id"
      clearable
      @update:model-value="handleEquipmentChange"
    >
      <template #item="{ props, item }">
        <VListItem v-bind="props">
          <template #prepend>
            <VIcon :icon="getEquipmentTypeIcon(item.raw.equipment_type)" />
          </template>
          <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
          <VListItemSubtitle>
            {{ getEquipmentTypeLabel(item.raw.equipment_type) }} - {{ item.raw.manufacturer }} {{ item.raw.model }}
          </VListItemSubtitle>
        </VListItem>
      </template>

      <template #selection="{ item }">
        <div class="d-flex align-center">
          <VIcon
            :icon="getEquipmentTypeIcon(item.raw.equipment_type)"
            class="me-2"
          />
          <span>{{ item.raw.name }}</span>
        </div>
      </template>
    </VSelect>
  </div>
</template>

<style scoped>
.equipment-selector {
  inline-size: 100%;
}
</style>
