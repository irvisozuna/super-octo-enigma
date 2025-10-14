<script setup lang="ts">
import type { EmployeeSkillEntity } from '../../../domain/entities/EmployeeEntity'

interface Props {
  skill: EmployeeSkillEntity
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
})

const emit = defineEmits<{
  edit: [skill: EmployeeSkillEntity]
  delete: [skill: EmployeeSkillEntity]
}>()

function getProficiencyColor(level: string) {
  const colors = {
    beginner: 'info',
    intermediate: 'primary',
    advanced: 'success',
    expert: 'warning',
  }

  return colors[level?.toLowerCase()] || 'default'
}
</script>

<template>
  <VChip
    :color="getProficiencyColor(skill.proficiency_level)"
    variant="tonal"
    size="default"
    label
  >
    <div class="d-flex align-center gap-2">
      <span class="font-weight-medium">{{ skill.skill_name }}</span>
      <VDivider
        v-if="skill.years_of_experience"
        vertical
        class="mx-1"
      />
      <span
        v-if="skill.years_of_experience"
        class="text-caption"
      >
        {{ skill.years_of_experience }} años
      </span>

      <template v-if="editable">
        <VDivider vertical />
        <VBtn
          icon
          variant="text"
          size="x-small"
          @click.stop="emit('edit', skill)"
        >
          <VIcon size="16">
            tabler-pencil
          </VIcon>
        </VBtn>
        <VBtn
          icon
          variant="text"
          size="x-small"
          color="error"
          @click.stop="emit('delete', skill)"
        >
          <VIcon size="16">
            tabler-trash
          </VIcon>
        </VBtn>
      </template>
    </div>
  </VChip>
</template>
