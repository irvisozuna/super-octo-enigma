<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EmployeeSkillEntity } from '../../../domain/entities/EmployeeEntity'
import SkillChipAtom from '../atoms/SkillChipAtom.vue'
import SkillFormMolecule from '../molecules/SkillFormMolecule.vue'

interface Props {
  skills: EmployeeSkillEntity[]
  employeeId: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
})

const emit = defineEmits<{
  add: [data: Partial<EmployeeSkillEntity>]
  update: [id: string, data: Partial<EmployeeSkillEntity>]
  delete: [id: string]
}>()

const { t } = useI18n()

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const selectedSkill = ref<EmployeeSkillEntity | null>(null)
const loading = ref(false)

function handleAdd(data: Partial<EmployeeSkillEntity>) {
  emit('add', data)
  showAddDialog.value = false
}

function handleEdit(skill: EmployeeSkillEntity) {
  selectedSkill.value = skill
  showEditDialog.value = true
}

function handleUpdate(data: Partial<EmployeeSkillEntity>) {
  if (selectedSkill.value) {
    emit('update', selectedSkill.value.id!, data)
    showEditDialog.value = false
    selectedSkill.value = null
  }
}

function handleDelete(skill: EmployeeSkillEntity) {
  if (confirm(`¿Eliminar la habilidad "${skill.skill_name}"?`))
    emit('delete', skill.id!)
}
</script>

<template>
  <div>
    <!-- Header with Add Button -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h6 class="text-h6 mb-1">
          Habilidades y Competencias
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Gestiona las habilidades técnicas y competencias del empleado
        </p>
      </div>

      <VBtn
        v-if="editable"
        color="primary"
        variant="tonal"
        prepend-icon="tabler-plus"
        @click="showAddDialog = true"
      >
        Agregar Habilidad
      </VBtn>
    </div>

    <!-- Skills List -->
    <div
      v-if="skills.length > 0"
      class="d-flex flex-wrap gap-3"
    >
      <SkillChipAtom
        v-for="skill in skills"
        :key="skill.id"
        :skill="skill"
        :editable="editable"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Empty State -->
    <VAlert
      v-else
      color="info"
      variant="tonal"
      icon="tabler-certificate-off"
    >
      <div class="text-body-2">
        No hay habilidades registradas.
        <a
          v-if="editable"
          href="#"
          @click.prevent="showAddDialog = true"
        >Agregar la primera habilidad</a>
      </div>
    </VAlert>

    <!-- Add Dialog -->
    <VDialog
      v-model="showAddDialog"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle>
          <div class="d-flex align-center justify-space-between">
            <span>Agregar Nueva Habilidad</span>
            <VBtn
              icon
              variant="text"
              size="small"
              @click="showAddDialog = false"
            >
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pt-4">
          <SkillFormMolecule
            :loading="loading"
            @submit="handleAdd"
            @cancel="showAddDialog = false"
          />
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Edit Dialog -->
    <VDialog
      v-model="showEditDialog"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle>
          <div class="d-flex align-center justify-space-between">
            <span>Editar Habilidad</span>
            <VBtn
              icon
              variant="text"
              size="small"
              @click="showEditDialog = false; selectedSkill = null"
            >
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pt-4">
          <SkillFormMolecule
            :skill="selectedSkill"
            :loading="loading"
            @submit="handleUpdate"
            @cancel="showEditDialog = false; selectedSkill = null"
          />
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
