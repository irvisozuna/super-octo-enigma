/**
 * Drilling Reports Validations
 *
 * Comprehensive validation schemas using Yup
 */

import * as yup from 'yup'
import { VALIDATION_RULES } from '../constants/DrillingConstants'

// Base validation schemas
export const createReportSchema = yup.object({
  project_id: yup
    .string()
    .uuid('Formato de UUID inválido')
    .required('El proyecto es requerido'),

  well_id: yup
    .string()
    .uuid('Formato de UUID inválido')
    .required('El pozo es requerido')
    .test('belongs-to-project', 'El pozo no pertenece al proyecto', async function (wellId) {
      const { project_id } = this.parent
      if (!wellId || !project_id)
        return true

      // TODO: Implement actual validation
      return true
    }),

  report_date: yup
    .date()
    .required('La fecha es requerida')
    .max(new Date(), 'La fecha no puede ser futura')
    .typeError('Fecha inválida'),

  shift: yup
    .string()
    .oneOf(['day', 'night', 'mixed'], 'Turno inválido')
    .required('Debe seleccionar un turno'),

  equipment_id: yup
    .string()
    .uuid()
    .nullable(),

  // Personnel validations
  operator_day_id: yup
    .string()
    .uuid()
    .when('shift', {
      is: shift => shift === 'day' || shift === 'mixed',
      then: schema => schema.required('El operador del turno día es requerido'),
      otherwise: schema => schema.nullable(),
    }),

  operator_night_id: yup
    .string()
    .uuid()
    .when('shift', {
      is: shift => shift === 'night' || shift === 'mixed',
      then: schema => schema.required('El operador del turno noche es requerido'),
      otherwise: schema => schema.nullable(),
    }),

  helper1_day_id: yup
    .string()
    .uuid()
    .nullable(),

  helper2_day_id: yup
    .string()
    .uuid()
    .nullable(),

  helper1_night_id: yup
    .string()
    .uuid()
    .nullable(),

  helper2_night_id: yup
    .string()
    .uuid()
    .nullable(),

  // Horometer validations
  horometer_start_day: yup
    .number()
    .min(VALIDATION_RULES.MIN_HOROMETER, 'El horómetro no puede ser negativo')
    .max(VALIDATION_RULES.MAX_HOROMETER, 'Valor de horómetro inválido')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value,
    ),

  horometer_start_night: yup
    .number()
    .min(VALIDATION_RULES.MIN_HOROMETER, 'El horómetro no puede ser negativo')
    .max(VALIDATION_RULES.MAX_HOROMETER, 'Valor de horómetro inválido')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value,
    ),

  horometer_end_day: yup
    .number()
    .min(VALIDATION_RULES.MIN_HOROMETER, 'El horómetro no puede ser negativo')
    .max(VALIDATION_RULES.MAX_HOROMETER, 'Valor de horómetro inválido')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value,
    ),

  horometer_end_night: yup
    .number()
    .min(VALIDATION_RULES.MIN_HOROMETER, 'El horómetro no puede ser negativo')
    .max(VALIDATION_RULES.MAX_HOROMETER, 'Valor de horómetro inválido')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value,
    ),

  // RPM validations
  rpm_pull_down: yup
    .number()
    .min(VALIDATION_RULES.MIN_RPM, 'RPM no puede ser negativo')
    .max(VALIDATION_RULES.MAX_RPM, 'RPM parece irreal')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value,
    ),

  rpm_rotation: yup
    .number()
    .min(VALIDATION_RULES.MIN_RPM, 'RPM no puede ser negativo')
    .max(VALIDATION_RULES.MAX_RPM, 'RPM parece irreal')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value,
    ),

  // Observations
  observations: yup
    .string()
    .max(VALIDATION_RULES.MAX_OBSERVATIONS, 'Las observaciones no pueden exceder 1000 caracteres')
    .nullable(),
})

export const addActivitySchema = yup.object({
  activity_type: yup
    .string()
    .oneOf([
      'drilling',
      'maintenance',
      'installation',
      'testing',
      'waiting',
      'mobilization',
      'demobilization',
      'otros',
    ], 'Tipo de actividad inválido')
    .required('Debe seleccionar un tipo de actividad'),

  shift: yup
    .string()
    .oneOf(['day', 'night', 'mixed'])
    .required('Debe seleccionar un turno'),

  hours: yup
    .number()
    .min(VALIDATION_RULES.MIN_HOURS, 'Mínimo 0.1 horas')
    .max(VALIDATION_RULES.MAX_HOURS, 'Máximo 24 horas')
    .required('Las horas son requeridas')
    .test('total-hours', 'Excede el máximo de 24 horas por turno', async function (hours) {
      const { shift } = this.parent
      const reportId = this.options.context?.reportId

      if (!reportId || !shift)
        return true

      // TODO: Implement actual validation with current report data
      return true
    }),

  start_time: yup
    .string()
    .matches(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:mm)')
    .nullable(),

  end_time: yup
    .string()
    .matches(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:mm)')
    .nullable()
    .test('is-after-start', 'La hora de fin debe ser después de la hora de inicio', function (endTime) {
      const { start_time } = this.parent
      if (!start_time || !endTime)
        return true

      return endTime > start_time
    }),

  description: yup
    .string()
    .max(VALIDATION_RULES.MAX_DESCRIPTION, 'La descripción no puede exceder 500 caracteres')
    .nullable(),
})

export const recordConsumptionSchema = yup.object({
  consumable_type: yup
    .string()
    .required('Debe seleccionar un tipo de consumible'),

  shift: yup
    .string()
    .oneOf(['day', 'night', 'mixed'])
    .required('Debe seleccionar un turno'),

  quantity: yup
    .number()
    .min(VALIDATION_RULES.MIN_QUANTITY, 'La cantidad debe ser mayor a 0')
    .max(VALIDATION_RULES.MAX_QUANTITY, 'Cantidad inválida')
    .required('La cantidad es requerida'),

  unit: yup
    .string()
    .oneOf(['kg', 'bags', 'liters', 'gallons', 'units'])
    .required('Debe seleccionar una unidad'),
})

export const assignToolSchema = yup.object({
  tool_id: yup
    .string()
    .uuid()
    .required('Debe seleccionar una herramienta')
    .test('is-available', 'La herramienta no está disponible', async toolId => {
      if (!toolId)
        return true

      // TODO: Implement actual validation
      return true
    })
    .test('has-capacity', 'La herramienta no tiene capacidad suficiente', async toolId => {
      if (!toolId)
        return true

      // TODO: Implement actual validation
      return true
    }),

  shift: yup
    .string()
    .oneOf(['day', 'night', 'mixed'])
    .required('Debe seleccionar un turno'),

  tool_category: yup
    .string()
    .required('Debe seleccionar una categoría'),

  start_depth_meters: yup
    .number()
    .min(VALIDATION_RULES.MIN_DEPTH, 'La profundidad no puede ser negativa')
    .max(VALIDATION_RULES.MAX_DEPTH, 'Profundidad inválida')
    .required('La profundidad inicial es requerida'),

  end_depth_meters: yup
    .number()
    .min(VALIDATION_RULES.MIN_DEPTH, 'La profundidad no puede ser negativa')
    .max(VALIDATION_RULES.MAX_DEPTH, 'Profundidad inválida')
    .required('La profundidad final es requerida')
    .test('is-greater', 'La profundidad final debe ser mayor que la inicial', function (endDepth) {
      const { start_depth_meters } = this.parent
      if (!start_depth_meters)
        return true

      return endDepth > start_depth_meters
    }),

  wear_pattern: yup
    .string()
    .oneOf(['uniform', 'centered', 'eccentric', 'one_sided'])
    .nullable(),

  matrix: yup
    .string()
    .oneOf(['good_condition', 'moderate_wear', 'severe_wear', 'needs_replacement'])
    .nullable(),
})

export const completeReportSchema = yup.object({
  horometer_end_day: yup
    .number()
    .min(VALIDATION_RULES.MIN_HOROMETER, 'El horómetro no puede ser negativo')
    .max(VALIDATION_RULES.MAX_HOROMETER, 'Valor de horómetro inválido')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value,
    ),

  horometer_end_night: yup
    .number()
    .min(VALIDATION_RULES.MIN_HOROMETER, 'El horómetro no puede ser negativo')
    .max(VALIDATION_RULES.MAX_HOROMETER, 'Valor de horómetro inválido')
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' ? null : value,
    ),
})

export const rejectReportSchema = yup.object({
  reason: yup
    .string()
    .min(VALIDATION_RULES.MIN_REJECTION_REASON, 'El motivo debe tener al menos 10 caracteres')
    .max(VALIDATION_RULES.MAX_REJECTION_REASON, 'El motivo no puede exceder 500 caracteres')
    .required('Debe proporcionar un motivo de rechazo'),
})

export const signReportSchema = yup.object({
  signature_type: yup
    .string()
    .oneOf(['operator', 'supervisor', 'client'])
    .required('Debe seleccionar un tipo de firma'),

  signature_method: yup
    .string()
    .oneOf(['digital', 'physical', 'electronic'])
    .required('Debe seleccionar un método de firma'),

  signature_data: yup
    .string()
    .nullable(),
})

// Casing validations
export const casingSchema = yup.object({
  diameter_inches: yup
    .number()
    .min(1, 'El diámetro debe ser mayor a 0')
    .max(100, 'Diámetro inválido')
    .required('El diámetro es requerido'),

  depth_range: yup.object({
    start_meters: yup
      .number()
      .min(0, 'La profundidad inicial debe ser mayor o igual a 0')
      .required('La profundidad inicial es requerida'),

    end_meters: yup
      .number()
      .min(0, 'La profundidad final debe ser mayor o igual a 0')
      .required('La profundidad final es requerida')
      .test('is-greater', 'La profundidad final debe ser mayor que la inicial', function (endMeters) {
        const { start_meters } = this.parent
        if (!start_meters)
          return true

        return endMeters > start_meters
      }),
  }).required('El rango de profundidad es requerido'),

  quantity: yup
    .number()
    .min(1, 'La cantidad debe ser mayor a 0')
    .required('La cantidad es requerida'),

  description: yup
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .required('La descripción es requerida'),

  material: yup
    .string()
    .max(100, 'El material no puede exceder 100 caracteres')
    .nullable(),

  thickness: yup
    .number()
    .min(0, 'El espesor no puede ser negativo')
    .max(100, 'Espesor inválido')
    .nullable(),

  grade: yup
    .string()
    .max(50, 'El grado no puede exceder 50 caracteres')
    .nullable(),
})

// Additive validations
export const additiveSchema = yup.object({
  additive_type: yup
    .string()
    .min(1, 'El tipo de aditivo es requerido')
    .max(100, 'El tipo de aditivo no puede exceder 100 caracteres')
    .required('El tipo de aditivo es requerido'),

  quantity: yup
    .number()
    .min(VALIDATION_RULES.MIN_QUANTITY, 'La cantidad debe ser mayor a 0')
    .max(VALIDATION_RULES.MAX_QUANTITY, 'Cantidad inválida')
    .required('La cantidad es requerida'),

  unit: yup
    .string()
    .oneOf(['kg', 'bags', 'liters', 'gallons', 'units'])
    .required('La unidad es requerida'),

  description: yup
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .nullable(),

  concentration: yup
    .number()
    .min(0, 'La concentración no puede ser negativa')
    .max(100, 'La concentración no puede exceder 100%')
    .nullable(),

  supplier: yup
    .string()
    .max(100, 'El proveedor no puede exceder 100 caracteres')
    .nullable(),

  batch_number: yup
    .string()
    .max(50, 'El número de lote no puede exceder 50 caracteres')
    .nullable(),

  expiry_date: yup
    .date()
    .min(new Date(), 'La fecha de vencimiento no puede ser pasada')
    .nullable()
    .typeError('Fecha de vencimiento inválida'),
})

// Accessory validations
export const accessorySchema = yup.object({
  accessory_type: yup
    .string()
    .min(1, 'El tipo de accesorio es requerido')
    .max(100, 'El tipo de accesorio no puede exceder 100 caracteres')
    .required('El tipo de accesorio es requerido'),

  quantity: yup
    .number()
    .min(1, 'La cantidad debe ser mayor a 0')
    .max(VALIDATION_RULES.MAX_QUANTITY, 'Cantidad inválida')
    .required('La cantidad es requerida'),

  unit: yup
    .string()
    .oneOf(['units', 'kg', 'meters', 'pieces'])
    .required('La unidad es requerida'),

  supplier: yup
    .string()
    .max(100, 'El proveedor no puede exceder 100 caracteres')
    .nullable(),

  observations: yup
    .string()
    .max(500, 'Las observaciones no pueden exceder 500 caracteres')
    .nullable(),

  serial_number: yup
    .string()
    .max(50, 'El número de serie no puede exceder 50 caracteres')
    .nullable(),

  model: yup
    .string()
    .max(50, 'El modelo no puede exceder 50 caracteres')
    .nullable(),

  manufacturer: yup
    .string()
    .max(100, 'El fabricante no puede exceder 100 caracteres')
    .nullable(),
})

// Export all schemas
export const drillingValidations = {
  createReport: createReportSchema,
  addActivity: addActivitySchema,
  recordConsumption: recordConsumptionSchema,
  assignTool: assignToolSchema,
  completeReport: completeReportSchema,
  rejectReport: rejectReportSchema,
  signReport: signReportSchema,
  casing: casingSchema,
  additive: additiveSchema,
  accessory: accessorySchema,
}
