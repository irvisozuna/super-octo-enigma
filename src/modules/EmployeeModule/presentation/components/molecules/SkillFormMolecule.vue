<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EmployeeSkillEntity } from '../../../domain/entities/EmployeeEntity'

interface Props {
  skill?: EmployeeSkillEntity | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  skill: null,
  loading: false,
})

const emit = defineEmits<{
  submit: [data: Partial<EmployeeSkillEntity>]
  cancel: []
}>()

const { t } = useI18n()

const form = ref({
  skill_name: '',
  proficiency_level: 'intermediate',
  years_of_experience: 0,
  notes: '',
})

const proficiencyLevels = [
  { value: 'beginner', title: 'Principiante' },
  { value: 'intermediate', title: 'Intermedio' },
  { value: 'advanced', title: 'Avanzado' },
  { value: 'expert', title: 'Experto' },
]

watch(() => props.skill, newSkill => {
  if (newSkill) {
    form.value = {
      skill_name: newSkill.skill_name || '',
      proficiency_level: newSkill.proficiency_level || 'intermediate',
      years_of_experience: newSkill.years_of_experience || 0,
      notes: newSkill.notes || '',
    }
  }
  else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    skill_name: '',
    proficiency_level: 'intermediate',
    years_of_experience: 0,
    notes: '',
  }
}

function handleSubmit() {
  emit('submit', form.value)
}
</script>

<template>
  <VForm @submit.prevent="handleSubmit">
    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="form.skill_name"
          label="Nombre de la habilidad"
          placeholder="Ej: Manejo de montacargas"
          variant="outlined"
          required
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VSelect
          v-model="form.proficiency_level"
          label="Nivel de competencia"
          :items="proficiencyLevels"
          variant="outlined"
          required
        />
      </VCol>

      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model.number="form.years_of_experience"
          label="Años de experiencia"
          type="number"
          min="0"
          variant="outlined"
        />
      </VCol>

      <VCol cols="12">
        <VTextarea
          v-model="form.notes"
          label="Notas adicionales"
          variant="outlined"
          rows="3"
        />
      </VCol>

      <VCol
        cols="12"
        class="d-flex gap-2 justify-end"
      >
        <VBtn
          variant="outlined"
          @click="emit('cancel')"
        >
          Cancelar
        </VBtn>
        <VBtn
          type="submit"
          color="primary"
          :loading="loading"
        >
          {{ skill ? 'Actualizar' : 'Agregar' }}
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
