<!-- ReportHeaderOrganism.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Molecules
import HeaderBarMolecule from '../molecules/HeaderBarMolecule.vue'
import ActionButtonGroupMolecule from '../molecules/ActionButtonGroupMolecule.vue'

// Atoms
import IconButtonAtom from '../atoms/IconButtonAtom.vue'
import ChipAtom from '../atoms/ChipAtom.vue'

import type { ExportFormatDTO } from '../../../application/dtos/ReportDtos'

interface Props {
  title: string
  description?: string
  lastUpdated: Date
  loading?: boolean
  availableExportFormats: ExportFormatDTO[]
  isFullscreen?: boolean
}

interface Emits {
  back: []
  refresh: []
  export: [format: ExportFormatDTO]
  share: []
  edit: []
  fullscreenToggle: []
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  loading: false,
  isFullscreen: false,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

const formattedLastUpdated = computed(() =>
  props.lastUpdated.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }),
)

const actionButtons = computed(() => [
  {
    icon: 'tabler-refresh',
    tooltip: t('reports.actions.refresh'),
    loading: props.loading,
    action: () => emit('refresh'),
  },
  {
    icon: 'tabler-download',
    tooltip: t('reports.actions.export'),
    disabled: props.availableExportFormats.length === 0,
    menu: props.availableExportFormats.map(format => ({
      icon: format.icon,
      label: format.name,
      color: format.color,
      action: () => emit('export', format),
    })),
  },
  {
    icon: 'tabler-share',
    tooltip: t('reports.actions.share'),
    action: () => emit('share'),
  },
  {
    icon: 'tabler-edit',
    tooltip: t('reports.actions.edit'),
    action: () => emit('edit'),
  },
  {
    icon: props.isFullscreen ? 'tabler-minimize' : 'tabler-maximize',
    tooltip: props.isFullscreen
      ? t('reports.actions.exitFullscreen')
      : t('reports.actions.enterFullscreen'),
    action: () => emit('fullscreenToggle'),
  },
])
</script>

<template>
  <VCard
    class="report-header mb-4"
    elevation="1"
  >
    <VCardText class="pa-4">
      <div class="d-flex align-center justify-space-between">
        <!-- Left Section: Back button + Title -->
        <div class="d-flex align-center">
          <IconButtonAtom
            icon="tabler-arrow-left"
            :tooltip="t('reports.actions.backToList')"
            @click="emit('back')"
          />

          <div class="ms-3">
            <HeaderBarMolecule
              :title="title"
              :subtitle="description"
              variant="h5"
            />
          </div>
        </div>

        <!-- Right Section: Status + Actions -->
        <div class="d-flex align-center gap-3">
          <!-- Last Updated Chip -->
          <ChipAtom
            :label="`${t('reports.lastUpdated')}: ${formattedLastUpdated}`"
            icon="tabler-clock"
            variant="tonal"
            size="small"
          />

          <!-- Action Buttons -->
          <ActionButtonGroupMolecule
            :buttons="actionButtons"
            density="comfortable"
          />
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.report-header {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  transition: all 0.2s ease-in-out;
}

.report-header:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 10%);
}

@media (max-width: 768px) {
  .report-header .d-flex {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .report-header .d-flex > div:first-child {
    justify-content: center;
  }

  .report-header .d-flex > div:last-child {
    justify-content: center;
  }
}
</style>
