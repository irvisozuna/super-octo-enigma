/**
 * useToolDisplay - Composable para lógica de visualización de herramientas
 * Centraliza las funciones de color, labels e iconos
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TOOL_CONDITIONS, TOOL_MATERIALS, TOOL_STATUS } from '../../shared/constants/ToolConstants'

export function useToolDisplay() {
  const { t } = useI18n()

  // Tool type helpers
  const toolTypeOptions = computed(() =>
    TOOL_MATERIALS.map(type => ({
      title: t(type.translationKey),
      value: type.value,
    })),
  )

  const getToolTypeLabel = (type: string) => {
    const option = toolTypeOptions.value.find(opt => opt.value === type)

    return option ? option.title : type
  }

  const getToolTypeIcon = (type: string) => {
    const option = toolTypeOptions.value.find(opt => opt.value === type)

    return option?.icon || 'tabler-tool'
  }

  // Status helpers
  const statusOptions = computed(() =>
    TOOL_STATUS.map(status => ({
      title: t(status.translationKey),
      value: status.value,
      color: status.color,
      bgColor: status.bgColor,
      icon: status.icon,
    })),
  )

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

  // Wear level helpers
  const wearLevelOptions = computed(() =>
    TOOL_CONDITIONS.map(condition => ({
      title: t(condition.translationKey),
      value: condition.value,
      color: condition.color,
      icon: condition.icon,
    })),
  )

  const getWearLevelLabel = (wearLevel: string) => {
    const option = wearLevelOptions.value.find(opt => opt.value === wearLevel)

    return option ? option.title : wearLevel
  }

  const getWearLevelColor = (wearLevel: string) => {
    const option = wearLevelOptions.value.find(opt => opt.value === wearLevel)

    return option?.color || 'grey'
  }

  const getWearLevelIcon = (wearLevel: string) => {
    const option = wearLevelOptions.value.find(opt => opt.value === wearLevel)

    return option?.icon || 'tabler-circle'
  }

  // Usage color helper
  const getUsageColor = (usagePercentage: number) => {
    if (usagePercentage >= 80)
      return 'error'
    if (usagePercentage >= 50)
      return 'warning'

    return 'success'
  }

  return {
    // Options
    toolTypeOptions,
    statusOptions,
    wearLevelOptions,

    // Type helpers
    getToolTypeLabel,
    getToolTypeIcon,

    // Status helpers
    getStatusLabel,
    getStatusColor,
    getStatusIcon,

    // Wear level helpers
    getWearLevelLabel,
    getWearLevelColor,
    getWearLevelIcon,

    // Usage helpers
    getUsageColor,
  }
}
