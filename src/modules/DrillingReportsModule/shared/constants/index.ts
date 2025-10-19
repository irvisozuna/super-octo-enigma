// Export all constants from a central location
export * from './ProjectConstants'
export * from './ToolConstants'
export * from './EquipmentConstants'
export * from './ConsumableConstants'
export * from './ReportWizardConstants'

// Re-export commonly used constants with shorter names
export {
  PROJECT_STATUS,
  PROJECT_PRIORITY,
  PROJECT_TYPES,
  PROJECT_PHASES,
  ACTIVITY_TYPES,
  SHIFT_OPTIONS,
} from './ProjectConstants'

export {
  TOOL_TYPES,
  TOOL_STATUS,
  TOOL_CATEGORIES,
  TOOL_MATERIALS,
  TOOL_CONDITIONS,
  TOOL_WIZARD_CATEGORIES,
} from './ToolConstants'

export {
  EQUIPMENT_TYPES,
  EQUIPMENT_STATUS,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
} from './EquipmentConstants'

export {
  CONSUMABLE_TYPES,
  CONSUMABLE_UNITS,
  CONSUMABLE_CATEGORIES,
} from './ConsumableConstants'

export {
  REPORT_WIZARD_STEPS,
  ACTIVITY_TEMPLATES,
  REPORT_VALIDATION_RULES,
  REPORT_WIZARD_CONFIG,
  REPORT_WIZARD_MESSAGES,
} from './ReportWizardConstants'
