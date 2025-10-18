<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useTools } from '../composables/useTools'
import { getToolTypeIcon, getToolTypeLabel } from '../../shared/utils/ToolUtils'

interface Props {
  modelValue?: string
  rules?: any[]
  errorMessages?: string[]
  required?: boolean
  toolType?: string
  status?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'toolSelected', tool: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  rules: () => [],
  errorMessages: () => [],
  required: false,
  toolType: '',
  status: '',
})

const emit = defineEmits<Emits>()

const { tools, loading, fetchTools } = useTools()

const selectedTool = ref<string>(props.modelValue)

const toolOptions = computed(() => {
  let filteredTools = tools.value

  if (props.toolType)
    filteredTools = filteredTools.filter(tool => tool.tool_type === props.toolType)

  if (props.status)
    filteredTools = filteredTools.filter(tool => tool.status === props.status)

  return filteredTools.map(tool => ({
    ...tool,
    id: tool.id,
    name: tool.name,
    tool_type: tool.tool_type,
    manufacturer: tool.manufacturer,
    model: tool.model,
  }))
})

const rules = computed(() => {
  const baseRules = [...props.rules]
  if (props.required)
    baseRules.push((value: string) => !!value || 'Debe seleccionar una herramienta')

  return baseRules
})

const handleToolChange = (value: string) => {
  selectedTool.value = value
  emit('update:modelValue', value)

  if (value) {
    const tool = tools.value.find(t => t.id === value)
    if (tool)
      emit('toolSelected', tool)
  }
}

onMounted(() => {
  if (tools.value.length === 0)
    fetchTools()
})

watch(() => props.modelValue, newValue => {
  selectedTool.value = newValue
})
</script>

<template>
  <div class="tool-selector">
    <VSelect
      v-model="selectedTool"
      :items="toolOptions"
      :label="$t('DrillingReportsModule.tools.title')"
      :placeholder="$t('DrillingReportsModule.tools.selectTool')"
      :loading="loading"
      :error-messages="errorMessages"
      :rules="rules"
      item-title="name"
      item-value="id"
      clearable
      @update:model-value="handleToolChange"
    >
      <template #item="{ props, item }">
        <VListItem v-bind="props">
          <template #prepend>
            <VIcon :icon="getToolTypeIcon(item.raw.tool_type)" />
          </template>
          <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
          <VListItemSubtitle>
            {{ getToolTypeLabel(item.raw.tool_type) }} - {{ item.raw.manufacturer }} {{ item.raw.model }}
          </VListItemSubtitle>
        </VListItem>
      </template>

      <template #selection="{ item }">
        <div class="d-flex align-center">
          <VIcon
            :icon="getToolTypeIcon(item.raw.tool_type)"
            class="me-2"
          />
          <span>{{ item.raw.name }}</span>
        </div>
      </template>
    </VSelect>
  </div>
</template>

<style scoped>
.tool-selector {
  inline-size: 100%;
}
</style>
