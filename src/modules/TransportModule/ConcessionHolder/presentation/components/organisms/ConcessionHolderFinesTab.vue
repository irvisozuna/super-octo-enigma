<script setup lang="ts">
import type { ConcessionHolderEntity } from '../../../domain/entities/ConcessionHolderEntity'

interface Props {
  holder: ConcessionHolderEntity
}

const props = defineProps<Props>()
</script>

<template>
  <VCard>
    <VCardTitle>
      <VIcon class="me-2">
        tabler-alert-triangle
      </VIcon>
      Multas y Sanciones
    </VCardTitle>
    <VCardText>
      <VAlert
        type="info"
        variant="tonal"
        class="mb-4"
      >
        <VIcon start>
          tabler-info-circle
        </VIcon>
        Aquí se mostrarán todas las multas asociadas a este titular
      </VAlert>

      <VDataTable
        :headers="[
          { title: 'Folio', key: 'folio' },
          { title: 'Tipo', key: 'type' },
          { title: 'Monto', key: 'amount' },
          { title: 'Estado', key: 'status' },
          { title: 'Fecha', key: 'date' },
          { title: 'Acciones', key: 'actions', sortable: false },
        ]"
        :items="[]"
        no-data-text="No hay multas registradas"
      >
        <template #[`item.status`]>
          <VChip
            size="small"
            color="error"
          >
            Pendiente
          </VChip>
        </template>
        <template #[`item.actions`]>
          <VBtn
            icon
            variant="text"
            size="small"
            color="primary"
          >
            <VIcon>tabler-eye</VIcon>
          </VBtn>
        </template>
      </VDataTable>
    </VCardText>
  </VCard>
</template>
