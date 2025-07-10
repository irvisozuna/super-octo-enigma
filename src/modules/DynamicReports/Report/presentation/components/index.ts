/**
 * Component Index - Atomic Design Structure
 * Clean Architecture Export System
 */

// ================================
// ATOMS - Basic building blocks
// ================================
export { default as IconButtonAtom } from './atoms/IconButtonAtom.vue'
export { default as ChipAtom } from './atoms/ChipAtom.vue'
export { default as TypographyAtom } from './atoms/TypographyAtom.vue'
export { default as AlertAtom } from './atoms/AlertAtom.vue'
export { default as LoadingAtom } from './atoms/LoadingAtom.vue'

// ================================
// MOLECULES - Simple combinations
// ================================
export { default as HeaderBarMolecule } from './molecules/HeaderBarMolecule.vue'
export { default as ActionButtonGroupMolecule } from './molecules/ActionButtonGroupMolecule.vue'
export { default as TabsHeaderMolecule } from './molecules/TabsHeaderMolecule.vue'
export { default as SearchFieldMolecule } from './molecules/SearchFieldMolecule.vue'
export { default as DensityToggleMolecule } from './molecules/DensityToggleMolecule.vue'
export { default as ColumnConfigMolecule } from './molecules/ColumnConfigMolecule.vue'
export { default as FilterControlMolecule } from './molecules/FilterControlMolecule.vue'
export { default as ExpandablePanelMolecule } from './molecules/ExpandablePanelMolecule.vue'
export { default as DataTableHeaderMolecule } from './molecules/DataTableHeaderMolecule.vue'
export { default as DataTableRowMolecule } from './molecules/DataTableRowMolecule.vue'
export { default as PaginationMolecule } from './molecules/PaginationMolecule.vue'
export { default as EmptyStateMolecule } from './molecules/EmptyStateMolecule.vue'

// ================================
// ORGANISMS - Complex components
// ================================
export { default as ReportHeaderOrganism } from './organisms/ReportHeaderOrganism.vue'
export { default as ReportToolbarOrganism } from './organisms/ReportToolbarOrganism.vue'
export { default as ReportFiltersOrganism } from './organisms/ReportFiltersOrganism.vue'
export { default as ReportDataTableOrganism } from './organisms/ReportDataTableOrganism.vue'

// ================================
// TEMPLATES - Layout structures
// ================================
export { default as DefaultTemplate } from './templates/DefaultTemplate.vue'

// ================================
// PAGES - Complete views
// ================================
export { default as ReportViewerPage } from './pages/ReportViewerPage.vue'

// ================================
// TYPE DEFINITIONS
// ================================

// Re-export types for convenience
export type {
  ReportConfigDTO,
  FilterValueDTO,
  SortingRuleDTO,
  ExportFormatDTO,
  ViewModeType,
  DensityType,
  FieldConfigDTO,
  FilterConfigDTO,
  ReportDataResponseDTO,
  GetReportDataRequestDTO,
  ExportReportRequestDTO,
  ExportReportResponseDTO,
  ShareReportRequestDTO,
  ShareReportResponseDTO,
  Result,
} from '../../application/dtos/ReportDtos'

// ================================
// USE CASES
// ================================
export { GetReportDataUseCase, createGetReportDataUseCase } from '../../application/useCases/GetReportDataUseCase'
export { ExportReportUseCase, createExportReportUseCase } from '../../application/useCases/ExportReportUseCase'
export { ShareReportUseCase, createShareReportUseCase } from '../../application/useCases/ShareReportUseCase'

// ================================
// INTERFACES
// ================================
export type {
  ReportRepositoryInterface,
  ReportDataServiceInterface,
  CacheServiceInterface,
  ExportServiceInterface,
  ShareServiceInterface,
  NotificationServiceInterface,
} from '../../domain/contracts/repositories/ReportRepositoryInterface'

// ================================
// COMPONENT GROUPS BY FUNCTION
// ================================

// Form & Input Components
export const FormComponents = {
  IconButtonAtom,
  SearchFieldMolecule,
  FilterControlMolecule,
  DensityToggleMolecule,
  ColumnConfigMolecule,
} as const

// Display Components
export const DisplayComponents = {
  TypographyAtom,
  ChipAtom,
  AlertAtom,
  LoadingAtom,
  EmptyStateMolecule,
} as const

// Layout Components
export const LayoutComponents = {
  HeaderBarMolecule,
  TabsHeaderMolecule,
  ExpandablePanelMolecule,
  DefaultTemplate,
} as const

// Data Components
export const DataComponents = {
  DataTableHeaderMolecule,
  DataTableRowMolecule,
  PaginationMolecule,
  ReportDataTableOrganism,
} as const

// Report Components
export const ReportComponents = {
  ReportHeaderOrganism,
  ReportToolbarOrganism,
  ReportFiltersOrganism,
  ReportDataTableOrganism,
  ReportViewerPage,
} as const

// ================================
// DESIGN SYSTEM CONSTANTS
// ================================

// State Colors (from design system)
export const StateColors = {
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#2563EB',
} as const

// Size Variants
export const SizeVariants = {
  'x-small': 'x-small',
  'small': 'small',
  'default': 'default',
  'large': 'large',
  'x-large': 'x-large',
} as const

// Density Options
export const DensityOptions = {
  comfortable: 'comfortable',
  compact: 'compact',
  default: 'default',
} as const

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Format currency value according to locale
 */
export const formatCurrency = (
  value: number,
  locale: string = 'es-MX',
  currency: string = 'MXN',
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Format number with thousands separator
 */
export const formatNumber = (
  value: number,
  locale: string = 'es-MX',
  decimals: number = 0,
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format date according to locale
 */
export const formatDate = (
  date: Date | string,
  locale: string = 'es-MX',
  options?: Intl.DateTimeFormatOptions,
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return dateObj.toLocaleDateString(locale, options)
}

/**
 * Generate unique ID for components
 */
export const generateId = (prefix: string = 'component'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout)
      clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined)
    return true
  if (typeof value === 'string')
    return value.trim() === ''
  if (Array.isArray(value))
    return value.length === 0
  if (typeof value === 'object')
    return Object.keys(value).length === 0

  return false
}

// ================================
// PLUGIN INSTALLATION
// ================================

/**
 * Vue plugin for registering all components globally
 */
export const ReportViewerPlugin = {
  install(app: any) {
    // Register all atoms
    app.component('IconButtonAtom', IconButtonAtom)
    app.component('ChipAtom', ChipAtom)
    app.component('TypographyAtom', TypographyAtom)
    app.component('AlertAtom', AlertAtom)
    app.component('LoadingAtom', LoadingAtom)

    // Register all molecules
    app.component('HeaderBarMolecule', HeaderBarMolecule)
    app.component('ActionButtonGroupMolecule', ActionButtonGroupMolecule)
    app.component('TabsHeaderMolecule', TabsHeaderMolecule)
    app.component('SearchFieldMolecule', SearchFieldMolecule)
    app.component('DensityToggleMolecule', DensityToggleMolecule)
    app.component('ColumnConfigMolecule', ColumnConfigMolecule)
    app.component('FilterControlMolecule', FilterControlMolecule)
    app.component('ExpandablePanelMolecule', ExpandablePanelMolecule)
    app.component('DataTableHeaderMolecule', DataTableHeaderMolecule)
    app.component('DataTableRowMolecule', DataTableRowMolecule)
    app.component('PaginationMolecule', PaginationMolecule)
    app.component('EmptyStateMolecule', EmptyStateMolecule)

    // Register all organisms
    app.component('ReportHeaderOrganism', ReportHeaderOrganism)
    app.component('ReportToolbarOrganism', ReportToolbarOrganism)
    app.component('ReportFiltersOrganism', ReportFiltersOrganism)
    app.component('ReportDataTableOrganism', ReportDataTableOrganism)

    // Register templates
    app.component('DefaultTemplate', DefaultTemplate)

    // Register pages
    app.component('ReportViewerPage', ReportViewerPage)
  },
}

// ================================
// COMPOSABLES
// ================================

/**
 * Composable for managing report state
 */
export const useReportState = () => {
  // This would contain shared report state logic
  // Implementation would go here
  return {
    // State management functions
  }
}

/**
 * Composable for formatting values
 */
export const useFormatters = () => {
  return {
    formatCurrency,
    formatNumber,
    formatDate,
  }
}

// Default export for convenience
export default {
  // Components
  ...FormComponents,
  ...DisplayComponents,
  ...LayoutComponents,
  ...DataComponents,
  ...ReportComponents,

  // Templates
  DefaultTemplate,

  // Pages
  ReportViewerPage,

  // Constants
  StateColors,
  SizeVariants,
  DensityOptions,

  // Utilities
  formatCurrency,
  formatNumber,
  formatDate,
  generateId,
  debounce,
  isEmpty,

  // Plugin
  install: ReportViewerPlugin.install,
}
