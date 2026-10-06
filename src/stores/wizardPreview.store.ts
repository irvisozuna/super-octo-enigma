import { defineStore } from 'pinia'
import type { WizardData } from '@/modules/DynamicReports/domain/wizardData'

export const useWizardPreviewStore = defineStore('wizardPreview', {
  state: (): { wizardData: WizardData } => ({
    wizardData: {
      connection_id: null,
      connection_name: '',
      name: '',
      table: '',
      tableColumns: [],
      joins: [],
      joinColumns: {},
      selectedFields: [],
      fieldAliases: {},
      type: 'table',
      procedureColumns: [],
      filters: [],
      sorting: [],
      groupBy: [],
      description: '',
      pagination: { enabled: false, pageSize: 50 },
      cacheConfig: { enabled: false, ttl: 300 },
      isActive: true,
      custom_sql: '',
      procedure: '',
      procedureParams: {},
      sql_generated: '',

      // Puedes agregar aquí otros campos que uses en el wizard
    },
  }),
  actions: {
    updateWizardData(data: Partial<WizardData>) {
      this.wizardData = { ...this.wizardData, ...data }
    },
    resetWizardData() {
      this.wizardData = {
        connection_id: null,
        connection_name: '',
        name: '',
        table: '',
        tableColumns: [],
        joins: [],
        joinColumns: {},
        selectedFields: [],
        fieldAliases: {},
        type: 'table',
        procedureColumns: [],
        filters: [],
        sorting: [],
        groupBy: [],
        description: '',
        pagination: { enabled: false, pageSize: 50 },
        cacheConfig: { enabled: false, ttl: 300 },
        isActive: true,
        custom_sql: '',
        procedure: '',
        procedureParams: {},
        sql_generated: '',

        // Otros campos si los necesitas
      }
    },
  },
})
