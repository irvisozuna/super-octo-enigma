// modules/DynamicReports/Report/infrastructure/transformers/ReportDataTransformer.ts

import type { ReportWizardData } from '../../domain/types/ReportWizardTypes'

export class ReportDataTransformer {
  /**
   * Transforma los datos del backend al formato del wizard
   */
  static fromBackendToWizard(backendData: any): ReportWizardData {
    console.log('🔄 Transforming backend data to wizard format:', backendData)

    // Extraer basicInfo directamente si existe, o construirlo desde los campos del root
    const basicInfo = backendData.basicInfo || {
      name: backendData.name,
      description: backendData.description,
      dataSourceId: backendData.data_source_id || backendData.dataSourceId,
      isActive: backendData.is_active ?? backendData.isActive ?? true,
      isPublic: backendData.is_public ?? backendData.isPublic ?? false,
      categoryId: backendData.category_id || backendData.categoryId,
      tags: backendData.tags || [],
      priority: backendData.priority || 'medium',
      departmentId: backendData.department_id || backendData.departmentId,
      permissions: backendData.permissions || {
        type: 'private',
        users: [],
        roles: [],
        departments: [],
        allowGuests: false,
        requireAuth: true,
        inheritFromCategory: false,
      },
      performance: backendData.performance || {
        refreshInterval: 60,
        autoRefresh: false,
        cacheEnabled: true,
        cacheTtl: 300,
        maxExecutionTime: 300,
        maxRows: 10000,
        timeout: 60,
      },
      notifications: backendData.notifications || {
        enabled: false,
        onError: true,
        onSuccess: false,
        onSchedule: false,
        channels: ['email'],
        recipients: [],
      },
      audit: backendData.audit || {
        enabled: true,
        retentionDays: 90,
        trackViews: true,
        trackExports: true,
        trackModifications: true,
        anonymizeData: false,
      },
      advanced: backendData.advanced || {
        locale: 'es-ES',
        version: '1.0.0',
        timezone: 'America/Mexico_City',
      },
    }

    // Procesar filtros - mantener la estructura con el grupo root
    const filters = backendData.filters || []

    // Procesar sorting - ya viene en el formato correcto
    const sorting = backendData.sorting || {
      primary: { field: '', direction: 'ASC' },
      secondary: undefined,
      tertiary: undefined,
      nullsHandling: 'LAST',
      caseSensitive: false,
    }

    // Procesar exportOptions
    const exportOptions = this.transformExportOptions(backendData.exportOptions || backendData.export_options)

    // Procesar campos seleccionados
    const selectedFields = backendData.selectedFields || backendData.selected_fields || []

    // Procesar configuración avanzada
    const advanced = backendData.advanced || {
      columns: [],
      footer: {
        enabled: true,
        showTotals: true,
        showSubtotals: false,
        showCount: true,
        showAverage: false,
        showMin: false,
        showMax: false,
        customText: '',
      },
      display: {
        showGridLines: true,
        showAlternateRows: true,
        alternateRowColor: '#f5f5f5',
        headerStyle: 'default',
        rowHeight: 40,
        maxRowsPerPage: 50,
        enablePagination: true,
      },
      grouping: {
        enabled: false,
        showGroupHeaders: true,
        showGroupFooters: true,
        collapseGroups: false,
        groupByFields: [],
      },
      styling: {
        theme: 'default',
        primaryColor: '#1976d2',
        secondaryColor: '#424242',
        fontFamily: 'Arial',
        fontSize: 12,
      },
      templates: {
        selected: 'default',
        custom: [],
      },
      calculatedFields: [],
      conditionalFormats: [],
      interactive: {
        filters: {
          enabled: true,
          showFilterBar: true,
          quickFilters: [],
          allowCustomFilters: true,
        },
        actions: {
          enabled: true,
          allowExport: true,
          allowPrint: true,
          allowShare: true,
          customActions: [],
        },
        drillDown: {
          enabled: false,
          levels: [],
        },
      },
      performance: {
        enableCache: true,
        cacheTimeout: 300,
        enableLazyLoading: true,
        enableVirtualScrolling: false,
        maxRowsToRender: 1000,
      },
      security: {
        enableFieldLevelSecurity: false,
        hiddenFields: [],
        restrictedFields: [],
        enableRowLevelSecurity: false,
        securityFilters: [],
      },
    }

    const wizardData: ReportWizardData = {
      basicInfo,
      selectedFields,
      filters,
      sorting,
      exportOptions,
      advanced,
    }

    console.log('✅ Transformed wizard data:', wizardData)

    return wizardData
  }

  /**
   * Transforma las opciones de exportación
   */
  private static transformExportOptions(exportOptions: any): any {
    if (!exportOptions) {
      return {
        excel: {
          enabled: true,
          includeCharts: false,
          autoFilter: true,
          includeHeaders: true,
          includeTotals: true,
        },
        pdf: {
          enabled: true,
          orientation: 'portrait',
          pageSize: 'A4',
          margins: 10,
          includeHeaders: true,
          includeTotals: true,
        },
        csv: {
          enabled: true,
          delimiter: ',',
          encoding: 'UTF-8',
          includeHeaders: true,
        },
        general: {
          filenameTemplate: 'report_{date}_{time}',
          compressionLevel: 'medium',
        },
      }
    }

    // Si tiene el formato nuevo con 'formats', usarlo
    if (exportOptions.formats)
      return exportOptions

    // Si no, convertir del formato antiguo
    return {
      excel: exportOptions.excel || {
        enabled: true,
        includeCharts: false,
        autoFilter: true,
        includeHeaders: true,
        includeTotals: true,
      },
      pdf: exportOptions.pdf || {
        enabled: true,
        orientation: 'portrait',
        pageSize: 'A4',
        margins: 10,
        includeHeaders: true,
        includeTotals: true,
      },
      csv: exportOptions.csv || {
        enabled: true,
        delimiter: ',',
        encoding: 'UTF-8',
        includeHeaders: true,
      },
      formats: exportOptions.formats || [],
      general: exportOptions.general || {
        filenameTemplate: 'report_{date}_{time}',
        compressionLevel: 'medium',
      },
      delivery: exportOptions.delivery || {
        method: 'download',
      },
      schedule: exportOptions.schedule,
    }
  }

  /**
   * Transforma los datos del wizard al formato del backend
   */
  static fromWizardToBackend(wizardData: ReportWizardData): any {
    // Para el backend, incluimos todos los campos necesarios
    const backendData = {
      // Campos de basicInfo en el root para compatibilidad
      name: wizardData.basicInfo.name,
      description: wizardData.basicInfo.description,
      data_source_id: wizardData.basicInfo.dataSourceId,
      is_active: wizardData.basicInfo.isActive,
      is_public: wizardData.basicInfo.isPublic,
      category_id: wizardData.basicInfo.categoryId,
      department_id: wizardData.basicInfo.departmentId,
      tags: wizardData.basicInfo.tags || [],

      // Incluir también el objeto completo de basicInfo
      basicInfo: wizardData.basicInfo,

      // Campos en snake_case y camelCase para compatibilidad
      selected_fields: wizardData.selectedFields,
      selectedFields: wizardData.selectedFields,

      filters: wizardData.filters,
      sorting: wizardData.sorting,

      export_options: wizardData.exportOptions,
      exportOptions: wizardData.exportOptions,

      advanced: wizardData.advanced,

      // Campos adicionales del basicInfo
      permissions: wizardData.basicInfo.permissions,
      performance: wizardData.basicInfo.performance,
      notifications: wizardData.basicInfo.notifications,
      audit: wizardData.basicInfo.audit,
    }

    console.log('🔄 Transformed backend data:', backendData)

    return backendData
  }
}
