<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useProjectsStore } from '../../stores/projectsStore'

interface Props {
  modelValue: boolean
  projectId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'assign-new'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const projectsStore = useProjectsStore()
const showConfirmDialog = ref(false)
const personnelToRemove = ref<any>(null)

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const headers = [
  { title: 'Nombre', key: 'employee.full_name', sortable: true },
  { title: 'Rol', key: 'role', sortable: true },
  { title: 'Fecha Asignación', key: 'assigned_at', sortable: true },
  { title: 'Estado', key: 'is_active', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' as const },
]

// Load personnel when dialog opens
watch(() => props.modelValue, async newValue => {
  if (newValue && props.projectId)
    await projectsStore.fetchProjectPersonnel(props.projectId)
})

const getRoleLabel = (role: string): string => {
  const roleMap: Record<string, string> = {
    project_manager: 'Gerente de Proyecto',
    operator: 'Operador',
    supervisor: 'Supervisor',
    helper: 'Ayudante',
  }

  return roleMap[role] || role || 'Sin rol'
}

const close = () => {
  emit('update:modelValue', false)
}

const confirmRemove = (item: any) => {
  personnelToRemove.value = item
  showConfirmDialog.value = true
}

const handleRemove = async () => {
  if (!personnelToRemove.value)
    return

  try {
    await projectsStore.removePersonnelFromProject(props.projectId, personnelToRemove.value.employee_id)
    showConfirmDialog.value = false
    personnelToRemove.value = null
  }
  catch (error) {
    console.error('Error removing personnel:', error)
  }
}

const handleAssignNew = () => {
  close()
  emit('assign-new')
}
</script>

<template>
  <VDialog
    v-model="isOpen"
    max-width="900"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-users"
            color="primary"
            size="20"
          />
          <span class="text-h6">Personal Asignado</span>
          <VChip
            size="small"
            variant="tonal"
            color="primary"
          >
            {{ projectsStore.projectPersonnel.length }}
          </VChip>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="close"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <VDataTable
          :headers="headers"
          :items="projectsStore.projectPersonnel"
          :loading="projectsStore.loadingPersonnel"
          density="compact"
          items-per-page="10"
        >
          <!-- Name Column -->
          <template #item.employee.full_name="{ item }">
            <div class="d-flex align-center gap-2">
              <VAvatar
                size="32"
                :color="item.role === 'project_manager' ? 'warning' : 'primary'"
                variant="tonal"
              >
                <VIcon
                  :icon="item.role === 'project_manager' ? 'tabler-crown' : 'tabler-user'"
                  size="18"
                />
              </VAvatar>
              <div>
                <p class="text-body-2 font-weight-medium mb-0">
                  {{ item.employee?.full_name || 'N/A' }}
                </p>
                <p class="text-caption text-medium-emphasis mb-0">
                  {{ item.employee?.employee_code }}
                </p>
                <p
                  v-if="item.role === 'project_manager'"
                  class="text-caption text-warning mb-0"
                >
                  Gerente de Proyecto
                </p>
              </div>
            </div>
          </template>

          <!-- Role Column -->
          <template #item.role="{ item }">
            <VChip
              size="small"
              variant="tonal"
            >
              {{ getRoleLabel(item.role) }}
            </VChip>
          </template>

          <!-- Assignment Date Column -->
          <template #item.assigned_at="{ item }">
            <span class="text-body-2">
              {{ item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : '-' }}
            </span>
          </template>

          <!-- Status Column -->
          <template #item.is_active="{ item }">
            <VChip
              :color="item.is_active ? 'success' : 'error'"
              size="x-small"
              variant="tonal"
            >
              {{ item.is_active ? 'Activo' : 'Inactivo' }}
            </VChip>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <VBtn
              icon="tabler-trash"
              variant="text"
              size="small"
              color="error"
              @click="confirmRemove(item)"
            >
              <VIcon
                icon="tabler-trash"
                size="18"
              />
              <VTooltip
                activator="parent"
                location="top"
              >
                Remover del proyecto
              </VTooltip>
            </VBtn>
          </template>

          <!-- Empty State -->
          <template #no-data>
            <VAlert
              type="info"
              variant="tonal"
              class="ma-4"
            >
              No hay personal asignado a este proyecto
            </VAlert>
          </template>
        </VDataTable>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VBtn
          color="primary"
          variant="tonal"
          prepend-icon="tabler-user-plus"
          @click="handleAssignNew"
        >
          Asignar Personal
        </VBtn>
        <VSpacer />
        <VBtn
          variant="text"
          @click="close"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- Confirmation Dialog -->
    <VDialog
      v-model="showConfirmDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="d-flex align-center gap-2 pa-4">
          <VIcon
            icon="tabler-alert-triangle"
            color="warning"
            size="24"
          />
          <span>Confirmar Eliminación</span>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-4">
          <p class="text-body-1 mb-3">
            ¿Estás seguro de que deseas remover a <strong>{{ personnelToRemove?.employee?.full_name }}</strong> del proyecto?
          </p>
          <p class="text-body-2 text-medium-emphasis mb-0">
            Esta acción no se puede deshacer.
          </p>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="text"
            @click="showConfirmDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            prepend-icon="tabler-trash"
            :loading="projectsStore.loadingPersonnel"
            @click="handleRemove"
          >
            Remover
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VDialog>
</template>

<style scoped lang="scss">
// Empty - styling handled by Vuetify
</style>
