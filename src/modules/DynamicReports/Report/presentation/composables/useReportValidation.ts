import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as yup from 'yup'

export interface ValidationError {
  field: string
  message: string
  type: 'error' | 'warning' | 'info'
}

export interface ValidationRule {
  field: string
  rule: yup.Schema
  message?: string
}

export const useReportValidation = () => {
  const { t } = useI18n()

  // Estado de validación
  const validationErrors = ref<ValidationError[]>([])
  const isValidating = ref(false)

  // Esquemas de validación
  const basicInfoSchema = yup.object({
    name: yup
      .string()
      .required(t('validations.required', { field: t('DynamicReports.report.name') }))
      .min(3, t('validation.min_length', { field: t('DynamicReports.report.name'), min: 3 }))
      .max(255, t('validation.max_length', { field: t('DynamicReports.report.name'), max: 255 }))
      .matches(/^[\w\s\-]+$/, t('validation.alphanumeric', { field: t('DynamicReports.report.name') })),
    description: yup
      .string()
      .max(1000, t('validation.max_length', { field: t('DynamicReports.report.description'), max: 1000 })),
    dataSourceId: yup
      .string()
      .required(t('validations.required', { field: t('DynamicReports.report.data_source') })),
    isActive: yup
      .boolean(),
    isPublic: yup
      .boolean(),
  })

  const fieldSchema = yup.object({
    field: yup
      .string()
      .required(t('validations.required', { field: t('DynamicReports.report.field') })),
    alias: yup
      .string()
      .required(t('validations.required', { field: t('DynamicReports.report.alias') }))
      .min(1, t('validation.min_length', { field: t('DynamicReports.report.alias'), min: 1 }))
      .max(100, t('validation.max_length', { field: t('DynamicReports.report.alias'), max: 100 })),
    format: yup
      .string()
      .oneOf(['text', 'number', 'currency', 'date', 'datetime'], t('validation.invalid_format')),
    width: yup
      .number()
      .min(50, t('validation.min_value', { field: t('DynamicReports.report.width'), min: 50 }))
      .max(500, t('validation.max_value', { field: t('DynamicReports.report.width'), max: 500 })),
    sortable: yup
      .boolean(),
    filterable: yup
      .boolean(),
  })

  const filterSchema = yup.object({
    field: yup
      .string()
      .required(t('validations.required', { field: t('DynamicReports.report.filter_field') })),
    type: yup
      .string()
      .oneOf(['text', 'number', 'date', 'select', 'range', 'boolean'], t('validation.invalid_type')),
    operator: yup
      .string()
      .required(t('validations.required', { field: t('DynamicReports.report.operator') })),
    defaultValue: yup
      .mixed(),
    required: yup
      .boolean(),
    placeholder: yup
      .string()
      .max(200, t('validation.max_length', { field: t('DynamicReports.report.placeholder'), max: 200 })),
  })

  const sortingSchema = yup.object({
    primary: yup.object({
      field: yup
        .string()
        .required(t('validations.required', { field: t('DynamicReports.report.primary_sort') })),
      direction: yup
        .string()
        .oneOf(['ASC', 'DESC'], t('validation.invalid_direction')),
    }),
    secondary: yup.object({
      field: yup
        .string(),
      direction: yup
        .string()
        .oneOf(['ASC', 'DESC'], t('validation.invalid_direction')),
    }).nullable(),
    tertiary: yup.object({
      field: yup
        .string(),
      direction: yup
        .string()
        .oneOf(['ASC', 'DESC'], t('validation.invalid_direction')),
    }).nullable(),
  })

  const exportOptionsSchema = yup.object({
    excel: yup.object({
      enabled: yup.boolean(),
      includeCharts: yup.boolean(),
      autoFilter: yup.boolean(),
    }),
    pdf: yup.object({
      enabled: yup.boolean(),
      orientation: yup
        .string()
        .oneOf(['portrait', 'landscape'], t('validation.invalid_orientation')),
      pageSize: yup
        .string()
        .oneOf(['A4', 'A3', 'Letter'], t('validation.invalid_page_size')),
      margins: yup
        .number()
        .min(5, t('validation.min_value', { field: t('DynamicReports.report.margins'), min: 5 }))
        .max(50, t('validation.max_value', { field: t('DynamicReports.report.margins'), max: 50 })),
    }),
    csv: yup.object({
      enabled: yup.boolean(),
      delimiter: yup
        .string()
        .max(1, t('validation.max_length', { field: t('DynamicReports.report.delimiter'), max: 1 })),
      encoding: yup
        .string()
        .oneOf(['UTF-8', 'ISO-8859-1'], t('validation.invalid_encoding')),
    }),
  })

  const metadataSchema = yup.object({
    permissions: yup
      .array()
      .of(yup.string()),
    tags: yup
      .array()
      .of(yup.string().max(50, t('validation.max_length', { field: t('DynamicReports.report.tag'), max: 50 }))),
    department: yup
      .string()
      .max(100, t('validation.max_length', { field: t('DynamicReports.report.department'), max: 100 })),
    category: yup
      .string()
      .max(100, t('validation.max_length', { field: t('DynamicReports.report.category'), max: 100 })),
    cacheEnabled: yup
      .boolean(),
    cacheDuration: yup
      .number()
      .min(60, t('validation.min_value', { field: t('DynamicReports.report.cache_duration'), min: 60 }))
      .max(86400, t('validation.max_value', { field: t('DynamicReports.report.cache_duration'), max: 86400 })),
  })

  // Esquema completo del reporte
  const reportSchema = yup.object({
    basicInfo: basicInfoSchema,
    selectedFields: yup
      .array()
      .of(fieldSchema)
      .min(1, t('validation.min_fields', { min: 1 })),
    filters: yup
      .array()
      .of(filterSchema),
    sorting: sortingSchema,
    exportOptions: exportOptionsSchema,
    metadata: metadataSchema,
  })

  // Métodos de validación
  const validateBasicInfo = async (data: any): Promise<ValidationError[]> => {
    isValidating.value = true
    validationErrors.value = []

    try {
      await basicInfoSchema.validate(data, { abortEarly: false })

      return []
    }
    catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || '',
          message: err.message,
          type: 'error',
        }))

        validationErrors.value = errors

        return errors
      }

      return []
    }
    finally {
      isValidating.value = false
    }
  }

  const validateFields = async (fields: any[]): Promise<ValidationError[]> => {
    isValidating.value = true
    validationErrors.value = []

    try {
      await yup.array().of(fieldSchema).validate(fields, { abortEarly: false })

      return []
    }
    catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || '',
          message: err.message,
          type: 'error',
        }))

        validationErrors.value = errors

        return errors
      }

      return []
    }
    finally {
      isValidating.value = false
    }
  }

  const validateFilters = async (filters: any[]): Promise<ValidationError[]> => {
    isValidating.value = true
    validationErrors.value = []

    try {
      await yup.array().of(filterSchema).validate(filters, { abortEarly: false })

      return []
    }
    catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || '',
          message: err.message,
          type: 'error',
        }))

        validationErrors.value = errors

        return errors
      }

      return []
    }
    finally {
      isValidating.value = false
    }
  }

  const validateSorting = async (sorting: any): Promise<ValidationError[]> => {
    isValidating.value = true
    validationErrors.value = []

    try {
      await sortingSchema.validate(sorting, { abortEarly: false })

      return []
    }
    catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || '',
          message: err.message,
          type: 'error',
        }))

        validationErrors.value = errors

        return errors
      }

      return []
    }
    finally {
      isValidating.value = false
    }
  }

  const validateExportOptions = async (options: any): Promise<ValidationError[]> => {
    isValidating.value = true
    validationErrors.value = []

    try {
      await exportOptionsSchema.validate(options, { abortEarly: false })

      return []
    }
    catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || '',
          message: err.message,
          type: 'error',
        }))

        validationErrors.value = errors

        return errors
      }

      return []
    }
    finally {
      isValidating.value = false
    }
  }

  const validateMetadata = async (metadata: any): Promise<ValidationError[]> => {
    isValidating.value = true
    validationErrors.value = []

    try {
      await metadataSchema.validate(metadata, { abortEarly: false })

      return []
    }
    catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || '',
          message: err.message,
          type: 'error',
        }))

        validationErrors.value = errors

        return errors
      }

      return []
    }
    finally {
      isValidating.value = false
    }
  }

  const validateCompleteReport = async (reportData: any): Promise<ValidationError[]> => {
    isValidating.value = true
    validationErrors.value = []

    try {
      await reportSchema.validate(reportData, { abortEarly: false })

      return []
    }
    catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: ValidationError[] = error.inner.map(err => ({
          field: err.path || '',
          message: err.message,
          type: 'error',
        }))

        validationErrors.value = errors

        return errors
      }

      return []
    }
    finally {
      isValidating.value = false
    }
  }

  // Validaciones específicas
  const validateFieldName = (name: string): boolean => {
    return /^[\w\s\-]+$/.test(name)
  }

  const validateFieldAlias = (alias: string): boolean => {
    return alias.trim().length > 0 && alias.trim().length <= 100
  }

  const validateFieldWidth = (width: number): boolean => {
    return width >= 50 && width <= 500
  }

  const validateFilterOperator = (operator: string, type: string): boolean => {
    const validOperators = {
      text: ['=', '!=', 'LIKE', 'NOT_LIKE', 'STARTS_WITH', 'ENDS_WITH'],
      number: ['=', '!=', '>', '>=', '<', '<=', 'BETWEEN'],
      date: ['=', '!=', '>', '>=', '<', '<=', 'BETWEEN'],
      select: ['=', '!=', 'IN', 'NOT_IN'],
      boolean: ['=', '!='],
    }

    return validOperators[type as keyof typeof validOperators]?.includes(operator) || false
  }

  // Métodos de utilidad
  const clearErrors = () => {
    validationErrors.value = []
  }

  const getErrorsForField = (fieldPath: string): ValidationError[] => {
    return validationErrors.value.filter(error => error.field.startsWith(fieldPath))
  }

  const hasErrors = computed(() => validationErrors.value.length > 0)

  const getErrorCount = computed(() => validationErrors.value.length)

  return {
    // State
    validationErrors: readonly(validationErrors),
    isValidating: readonly(isValidating),

    // Computed
    hasErrors,
    getErrorCount,

    // Schemas
    basicInfoSchema,
    fieldSchema,
    filterSchema,
    sortingSchema,
    exportOptionsSchema,
    metadataSchema,
    reportSchema,

    // Methods
    validateBasicInfo,
    validateFields,
    validateFilters,
    validateSorting,
    validateExportOptions,
    validateMetadata,
    validateCompleteReport,
    validateFieldName,
    validateFieldAlias,
    validateFieldWidth,
    validateFilterOperator,
    clearErrors,
    getErrorsForField,
  }
}
