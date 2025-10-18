<script setup lang="ts">
export interface ProjectStatusActionsProps {
  status: 'planned' | 'in_progress' | 'suspended' | 'completed' | 'cancelled'
  loading?: boolean
}

defineProps<ProjectStatusActionsProps>()

defineEmits<{
  'start': []
  'suspend': []
  'resume': []
  'complete': []
  'cancel': []
}>()
</script>

<template>
  <div class="project-status-actions">
    <!-- Start Project -->
    <VBtn
      v-if="status === 'planned'"
      color="success"
      variant="tonal"
      prepend-icon="tabler-player-play"
      :loading="loading"
      @click="$emit('start')"
    >
      Iniciar Proyecto
    </VBtn>

    <!-- Suspend Project -->
    <VBtn
      v-if="status === 'in_progress'"
      color="warning"
      variant="outlined"
      prepend-icon="tabler-pause"
      :loading="loading"
      @click="$emit('suspend')"
    >
      Suspender
    </VBtn>

    <!-- Resume Project -->
    <VBtn
      v-if="status === 'suspended'"
      color="success"
      variant="tonal"
      prepend-icon="tabler-player-play"
      :loading="loading"
      @click="$emit('resume')"
    >
      Reanudar
    </VBtn>

    <!-- Complete Project -->
    <VBtn
      v-if="status === 'in_progress'"
      color="success"
      prepend-icon="tabler-check"
      :loading="loading"
      @click="$emit('complete')"
    >
      Completar
    </VBtn>

    <!-- Cancel Project -->
    <VBtn
      v-if="['planned', 'in_progress', 'suspended'].includes(status)"
      color="error"
      variant="outlined"
      prepend-icon="tabler-x"
      :loading="loading"
      @click="$emit('cancel')"
    >
      Cancelar
    </VBtn>

    <!-- Project already completed -->
    <VChip
      v-if="status === 'completed'"
      color="success"
      variant="tonal"
      prepend-icon="tabler-check"
    >
      Proyecto Completado
    </VChip>

    <!-- Project cancelled -->
    <VChip
      v-if="status === 'cancelled'"
      color="error"
      variant="tonal"
      prepend-icon="tabler-x"
    >
      Proyecto Cancelado
    </VChip>
  </div>
</template>

<style scoped lang="scss">
.project-status-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
