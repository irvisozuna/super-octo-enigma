/**
 * useProjectDisplay - Composable para lógica de visualización de proyectos
 * Centraliza las funciones de color, labels e iconos
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useProjectDisplay() {
  const { t } = useI18n()

  // Status helpers
  const statusOptions = computed(() => [
    {
      title: t('DrillingReportsModule.common.planned'),
      value: 'planned',
      color: 'info',
      icon: 'tabler-calendar',
    },
    {
      title: t('DrillingReportsModule.common.active'),
      value: 'active',
      color: 'success',
      icon: 'tabler-player-play',
    },
    {
      title: t('DrillingReportsModule.common.completed'),
      value: 'completed',
      color: 'success',
      icon: 'tabler-circle-check',
    },
    {
      title: t('DrillingReportsModule.common.suspended'),
      value: 'suspended',
      color: 'warning',
      icon: 'tabler-player-pause',
    },
    {
      title: t('DrillingReportsModule.common.cancelled'),
      value: 'cancelled',
      color: 'error',
      icon: 'tabler-x',
    },
  ])

  const getStatusLabel = (status: string) => {
    const option = statusOptions.value.find(opt => opt.value === status)

    return option ? option.title : status
  }

  const getStatusColor = (status: string) => {
    const option = statusOptions.value.find(opt => opt.value === status)

    return option?.color || 'grey'
  }

  const getStatusIcon = (status: string) => {
    const option = statusOptions.value.find(opt => opt.value === status)

    return option?.icon || 'tabler-circle'
  }

  return {
    // Options
    statusOptions,

    // Status helpers
    getStatusLabel,
    getStatusColor,
    getStatusIcon,
  }
}
