<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useProjects } from '../composables/useProjects'
import { formatProjectBudget, getProjectStatusIcon } from '../../shared/utils/ProjectUtils'

interface Props {
  modelValue?: string
  rules?: any[]
  errorMessages?: string[]
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'projectSelected', project: any): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  rules: () => [],
  errorMessages: () => [],
  required: false,
})

const emit = defineEmits<Emits>()

const { projects, loading, fetchProjectsSimple: fetchProjects } = useProjects()

const selectedProject = ref<string>(props.modelValue)

const projectOptions = computed(() => {
  return projects.value.map(project => ({
    ...project,
    id: project.id,
    name: project.name,
    client_name: project.client_name,
    budget: project.budget,
    status: project.status,
  }))
})

const rules = computed(() => {
  const baseRules = [...props.rules]
  if (props.required)
    baseRules.push((value: string) => !!value || 'Debe seleccionar un proyecto')

  return baseRules
})

const handleProjectChange = (value: string) => {
  selectedProject.value = value
  emit('update:modelValue', value)

  if (value) {
    const project = projects.value.find(p => p.id === value)
    if (project)
      emit('projectSelected', project)
  }
}

onMounted(() => {
  if (projects.value.length === 0)
    fetchProjects()
})

watch(() => props.modelValue, newValue => {
  selectedProject.value = newValue
})
</script>

<template>
  <div class="project-selector">
    <VSelect
      v-model="selectedProject"
      :items="projectOptions"
      :label="$t('DrillingReportsModule.projects.title')"
      :placeholder="$t('DrillingReportsModule.projects.selectProject')"
      :loading="loading"
      :error-messages="errorMessages"
      :rules="rules"
      item-title="name"
      item-value="id"
      clearable
      @update:model-value="handleProjectChange"
    >
      <template #item="{ props, item }">
        <VListItem v-bind="props">
          <template #prepend>
            <VIcon :icon="getProjectStatusIcon(item.raw.status)" />
          </template>
          <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
          <VListItemSubtitle>
            {{ item.raw.client_name }} - {{ formatProjectBudget(item.raw.budget) }}
          </VListItemSubtitle>
        </VListItem>
      </template>

      <template #selection="{ item }">
        <div class="d-flex align-center">
          <VIcon
            :icon="getProjectStatusIcon(item.raw.status)"
            class="me-2"
          />
          <span>{{ item.raw.name }}</span>
        </div>
      </template>
    </VSelect>
  </div>
</template>

<style scoped>
.project-selector {
  inline-size: 100%;
}
</style>
