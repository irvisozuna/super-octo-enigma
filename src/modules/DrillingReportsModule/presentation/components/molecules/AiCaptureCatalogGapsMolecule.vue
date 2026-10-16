<script setup lang="ts">
/**
 * En la revisión de una hoja capturada con IA: personal, equipo y aceros que la hoja menciona y no están
 * en los catálogos (con "Dar de alta" precargado), y los encontrados que falta poner en el reporte o en el proyecto.
 */
import { computed, onMounted, ref } from 'vue'
import type { CatalogGap, CatalogMatch } from '../../../infrastructure/api/services/AiCaptureCatalogApiService'
import type { AssignableItem } from '../../composables/useAiCaptureCatalog'
import { useAiCaptureCatalog } from '../../composables/useAiCaptureCatalog'
import AiCaptureCatalogEntryDialogMolecule from './AiCaptureCatalogEntryDialogMolecule.vue'

const props = defineProps<{ importId: string; projectId: string }>()

/** El asistente debe recargar sus listas: se dio de alta o se agregó algo al proyecto. */
const emit = defineEmits<{ catalogChanged: [] }>()

const catalog = useAiCaptureCatalog(() => props.importId, () => props.projectId)
const dialogOpen = ref(false)
const dialogGap = ref<CatalogGap | null>(null)
const busy = ref<string | null>(null)
const actionError = ref<string | null>(null)

const LABELS: Record<string, string> = { operator: 'Operador', helper: 'Ayudante', broca: 'Broca', tricono: 'Tricono', escareador: 'Escareador' }
const labelOf = (item: CatalogGap | CatalogMatch) =>
  item.kind === 'equipment' ? 'Equipo' : LABELS[(item.kind === 'employee' ? item.position : item.section) ?? ''] ?? 'Acero'

const gaps = computed(() => catalog.status.value.gaps)

/** Encontrados que no están en el reporte, o que están pero el proyecto no los tiene (el asistente no los mostraría). */
const pending = computed(() => catalog.status.value.matches.filter(match => !catalog.isAssigned(match) || match.in_project === false))

onMounted(catalog.load)

async function use(key: string, item: AssignableItem & { in_project?: boolean }) {
  busy.value = key
  actionError.value = null
  try {
    await catalog.ensureInProject(item)
    if (item.in_project === false)
      emit('catalogChanged')
    catalog.assignToReport(item)
    await catalog.load()
  }
  catch (err: any) {
    actionError.value = err?.message || 'No se pudo asignar'
  }
  finally {
    busy.value = null
  }
}

function openCreate(gap: CatalogGap) {
  dialogGap.value = gap
  dialogOpen.value = true
}

/** Lo recién creado no está en el proyecto: se agrega, se avisa al asistente y se pone en el reporte. */
async function onCreated(id: string) {
  const gap = dialogGap.value!

  await use(`created-${gap.field}`, { kind: gap.kind, id, position: gap.position, section: gap.section, from: gap.from, to: gap.to, in_project: gap.kind === 'tool' ? undefined : false })
  emit('catalogChanged')
}
</script>

<template>
  <div
    v-if="gaps.length || pending.length || catalog.error.value"
    class="d-flex flex-column gap-2"
  >
    <VAlert
      v-if="catalog.error.value || actionError"
      type="error"
      variant="tonal"
      density="compact"
    >
      {{ actionError || catalog.error.value }}
    </VAlert>

    <div
      v-for="gap in gaps"
      :key="gap.field"
      class="d-flex flex-wrap align-center gap-2 py-1"
    >
      <VIcon
        icon="tabler-user-question"
        size="18"
        color="warning"
      />
      <span class="text-body-2 flex-grow-1">
        {{ labelOf(gap) }} "{{ gap.written }}" no está en el catálogo
      </span>
      <VBtn
        v-for="candidate in gap.candidates"
        :key="candidate.id"
        size="small"
        variant="tonal"
        :loading="busy === `${gap.field}-${candidate.id}`"
        @click="use(`${gap.field}-${candidate.id}`, { ...gap, ...candidate })"
      >
        Usar {{ candidate.label }}
      </VBtn>
      <VBtn
        size="small"
        color="primary"
        variant="elevated"
        prepend-icon="tabler-plus"
        :loading="busy === `created-${gap.field}`"
        @click="openCreate(gap)"
      >
        Dar de alta
      </VBtn>
    </div>

    <div
      v-for="match in pending"
      :key="`${match.field}-${match.id}`"
      class="d-flex flex-wrap align-center gap-2 py-1"
    >
      <VIcon
        icon="tabler-circle-check"
        size="18"
        color="success"
      />
      <span class="text-body-2 flex-grow-1">
        {{ labelOf(match) }} "{{ match.written }}" → {{ match.label }}
        <span
          v-if="match.in_project === false"
          class="text-medium-emphasis"
        >(no está en el proyecto)</span>
      </span>
      <VBtn
        size="small"
        variant="tonal"
        color="success"
        :loading="busy === match.field"
        @click="use(match.field, match)"
      >
        {{ match.in_project === false ? 'Agregar al proyecto y asignar' : 'Asignar al reporte' }}
      </VBtn>
    </div>

    <AiCaptureCatalogEntryDialogMolecule
      v-model="dialogOpen"
      :gap="dialogGap"
      @created="onCreated"
    />
  </div>
</template>
