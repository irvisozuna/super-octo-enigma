<script setup lang="ts">
import type { ConcessionHolderEntity } from '../../../domain/entities/ConcessionHolderEntity'

interface Props {
  holder: ConcessionHolderEntity
}

const props = defineProps<Props>()

function formatDate(dateString: string) {
  if (!dateString)
    return '-'

  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}
</script>

<template>
  <VCard>
    <VCardTitle>
      <VIcon class="me-2">
        tabler-history
      </VIcon>
      Historial de Actividades
    </VCardTitle>
    <VCardText>
      <VTimeline
        side="end"
        density="compact"
      >
        <VTimelineItem
          dot-color="success"
          size="small"
        >
          <template #opposite>
            <div class="text-caption">
              {{ formatDate(holder.createdAt || '') }}
            </div>
          </template>
          <div class="text-body-2">
            <strong>Registro creado</strong>
            <p class="text-caption text-medium-emphasis mb-0">
              Se creó el registro del concesionario en el sistema
            </p>
          </div>
        </VTimelineItem>

        <VTimelineItem
          v-if="holder.verifiedAt"
          dot-color="primary"
          size="small"
        >
          <template #opposite>
            <div class="text-caption">
              {{ formatDate(holder.verifiedAt || '') }}
            </div>
          </template>
          <div class="text-body-2">
            <strong>Verificación completada</strong>
            <p class="text-caption text-medium-emphasis mb-0">
              El concesionario fue verificado exitosamente
            </p>
          </div>
        </VTimelineItem>

        <VTimelineItem
          dot-color="info"
          size="small"
        >
          <template #opposite>
            <div class="text-caption">
              {{ formatDate(holder.updatedAt || '') }}
            </div>
          </template>
          <div class="text-body-2">
            <strong>Última actualización</strong>
            <p class="text-caption text-medium-emphasis mb-0">
              Última modificación de los datos del concesionario
            </p>
          </div>
        </VTimelineItem>
      </VTimeline>
    </VCardText>
  </VCard>
</template>
