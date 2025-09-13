<script setup lang="ts">
import type { ConcessionHolderEntity } from '../../../domain/entities/ConcessionHolderEntity'

interface Props {
  holder: ConcessionHolderEntity
}

const props = defineProps<Props>()
</script>

<template>
  <VCard>
    <VCardTitle class="d-flex align-center justify-space-between">
      <span>
        <VIcon class="me-2">tabler-license</VIcon>
        Concesiones del Titular
      </span>
      <VBtn
        color="primary"
        size="small"
        prepend-icon="tabler-plus"
      >
        Nueva Concesión
      </VBtn>
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
        Aquí se mostrarán todas las concesiones asociadas a este titular
      </VAlert>

      <VDataTable
        :headers="[
          { title: 'Número', key: 'number' },
          { title: 'Tipo', key: 'type' },
          { title: 'Estado', key: 'status' },
          { title: 'Fecha Emisión', key: 'issue_date' },
          { title: 'Vencimiento', key: 'expiry_date' },
          { title: 'Acciones', key: 'actions', sortable: false },
        ]"
        :items="[]"
        no-data-text="No hay concesiones registradas"
      >
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
