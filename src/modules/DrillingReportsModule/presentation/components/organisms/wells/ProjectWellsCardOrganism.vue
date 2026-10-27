<script setup lang="ts">
import { computed, ref } from 'vue'
import ProjectProgressBarAtom from '../../atoms/ProjectProgressBarAtom.vue'

/**
 * Pozos (barrenos) de un proyecto: cuánto lleva cada uno y sus acciones.
 * Un pozo en stand-by no recibe reportes hasta reactivarlo; uno con reportes no se elimina.
 */
export interface ProjectWell {
  id: string
  name: string
  well_number?: string
  status: string
  status_reason?: string | null
  depth_planned: number
  depth_actual: number
}

const props = withDefaults(defineProps<{
  wells: ProjectWell[]
  loading?: boolean
  canEdit?: boolean
}>(), {
  loading: false,
  canEdit: false,
})

const emit = defineEmits<{
  'add': []
  'edit': [well: ProjectWell]
  'standby': [well: ProjectWell, reason: string]
  'resume': [well: ProjectWell]
  'complete': [well: ProjectWell]
  'delete': [well: ProjectWell]
  'qr-labels': []
}>()

const STATUS: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planeado', color: 'secondary' },
  drilling: { label: 'Perforando', color: 'primary' },
  active: { label: 'Perforando', color: 'primary' },
  suspended: { label: 'Stand-by', color: 'warning' },
  completed: { label: 'Terminado', color: 'success' },
  abandoned: { label: 'Abandonado', color: 'error' },
}
const statusOf = (well: ProjectWell) => STATUS[well.status] ?? { label: well.status, color: 'secondary' }

const canStandby = (well: ProjectWell) => ['drilling', 'active'].includes(well.status)
const canComplete = (well: ProjectWell) => ['drilling', 'active'].includes(well.status)

const totalDrilled = computed(() => props.wells.reduce((sum, well) => sum + (well.depth_actual || 0), 0))

const standbyWell = ref<ProjectWell | null>(null)
const standbyReason = ref('')

function askStandby(well: ProjectWell) {
  standbyWell.value = well
  standbyReason.value = ''
}

function confirmStandby() {
  if (!standbyWell.value || !standbyReason.value.trim())
    return
  emit('standby', standbyWell.value, standbyReason.value.trim())
  standbyWell.value = null
}

const formatMeters = (value: number) => `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(value || 0)} m`
</script>

<template>
  <VCard variant="outlined">
    <VCardTitle class="d-flex align-center flex-wrap gap-2 pa-4">
      <VIcon
        icon="tabler-droplet"
        color="primary"
      />
      <span>Pozos del proyecto</span>
      <VChip
        size="small"
        variant="tonal"
      >
        {{ wells.length }} · {{ formatMeters(totalDrilled) }} perforados
      </VChip>
      <VSpacer />
      <VBtn
        v-if="wells.length"
        variant="text"
        size="small"
        prepend-icon="tabler-qrcode"
        @click="emit('qr-labels')"
      >
        Etiquetas QR
      </VBtn>
      <VBtn
        v-if="canEdit"
        color="primary"
        size="small"
        prepend-icon="tabler-plus"
        @click="emit('add')"
      >
        Agregar pozo
      </VBtn>
    </VCardTitle>

    <VDivider />

    <VProgressLinear
      v-if="loading"
      indeterminate
    />

    <VCardText
      v-if="!wells.length && !loading"
      class="text-center text-medium-emphasis py-8"
    >
      Este proyecto no tiene pozos. Agrega cada barreno con el número que lleva en la hoja (ej. «LR-01») para que la captura con IA ubique cada reporte en su pozo.
    </VCardText>

    <VTable
      v-else-if="wells.length"
      density="comfortable"
    >
      <thead>
        <tr>
          <th>Pozo</th>
          <th>Estado</th>
          <th class="text-end">
            Perforado / planeado
          </th>
          <th style="min-inline-size: 160px;">
            Avance
          </th>
          <th v-if="canEdit" />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="well in wells"
          :key="well.id"
        >
          <td>
            <div class="font-weight-medium">
              {{ well.well_number || '—' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ well.name }}
            </div>
          </td>
          <td>
            <VChip
              size="small"
              :color="statusOf(well).color"
              variant="tonal"
            >
              {{ statusOf(well).label }}
            </VChip>
            <div
              v-if="well.status_reason"
              class="text-caption text-medium-emphasis mt-1"
            >
              {{ well.status_reason }}
            </div>
          </td>
          <td class="text-end text-no-wrap">
            {{ formatMeters(well.depth_actual) }} / {{ formatMeters(well.depth_planned) }}
          </td>
          <td>
            <ProjectProgressBarAtom
              :current="well.depth_actual || 0"
              :total="well.depth_planned || 0"
              :show-details="false"
              :height="8"
              :color-threshold="{ warning: 101, danger: 101 }"
            />
          </td>
          <td
            v-if="canEdit"
            class="text-end"
          >
            <VMenu>
              <template #activator="{ props: menuProps }">
                <VBtn
                  v-bind="menuProps"
                  icon="tabler-dots-vertical"
                  variant="text"
                  size="small"
                  :aria-label="`Acciones del pozo ${well.well_number || well.name}`"
                />
              </template>
              <VList density="compact">
                <VListItem
                  prepend-icon="tabler-edit"
                  title="Editar"
                  @click="emit('edit', well)"
                />
                <VListItem
                  v-if="canStandby(well)"
                  prepend-icon="tabler-player-pause"
                  title="Poner en stand-by"
                  @click="askStandby(well)"
                />
                <VListItem
                  v-if="well.status === 'suspended'"
                  prepend-icon="tabler-player-play"
                  title="Reactivar"
                  @click="emit('resume', well)"
                />
                <VListItem
                  v-if="canComplete(well)"
                  prepend-icon="tabler-flag-check"
                  title="Terminar pozo"
                  @click="emit('complete', well)"
                />
                <VListItem
                  prepend-icon="tabler-trash"
                  title="Eliminar"
                  base-color="error"
                  @click="emit('delete', well)"
                />
              </VList>
            </VMenu>
          </td>
        </tr>
      </tbody>
    </VTable>

    <VDialog
      :model-value="!!standbyWell"
      max-width="460"
      @update:model-value="value => { if (!value) standbyWell = null }"
    >
      <VCard v-if="standbyWell">
        <VCardTitle class="pa-4">
          Poner en stand-by el pozo {{ standbyWell.well_number || standbyWell.name }}
        </VCardTitle>
        <VCardText>
          <p class="text-body-2 mb-4">
            Mientras esté en stand-by no se le pueden cargar ni aprobar reportes. Se reactiva desde este mismo menú.
          </p>
          <VTextarea
            v-model="standbyReason"
            label="Motivo *"
            rows="2"
            auto-grow
            autofocus
            counter="500"
            maxlength="500"
          />
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="text"
            @click="standbyWell = null"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="warning"
            :disabled="!standbyReason.trim()"
            @click="confirmStandby"
          >
            Poner en stand-by
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCard>
</template>
