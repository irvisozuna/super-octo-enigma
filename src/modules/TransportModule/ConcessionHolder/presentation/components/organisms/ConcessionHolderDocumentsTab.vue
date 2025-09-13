<script setup lang="ts">
import type { ConcessionHolderEntity } from '../../../domain/entities/ConcessionHolderEntity'
import DocumentManagerTab from '../../../../shared/presentation/components/organisms/DocumentManagerTab.vue'

interface Props {
  holder: ConcessionHolderEntity
}

const props = defineProps<Props>()
</script>

<template>
  <DocumentManagerTab
    v-if="props.holder?.id"
    :entity-id="props.holder.id"
    entity-type="holder"
    title="Documentos del Concesionario"
  />
  <div
    v-else
    class="d-flex justify-center align-center pa-8"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
    <span class="ms-4">Cargando datos del concesionario...</span>
  </div>
</template>
