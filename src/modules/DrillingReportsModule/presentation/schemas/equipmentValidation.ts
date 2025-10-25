import * as yup from 'yup'

/**
 * Schema de validación para el formulario de equipos
 * Incluye validaciones para crear y editar equipos
 */
export const equipmentValidationSchema = yup.object({
  equipment_code: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(50, 'El código no puede exceder 50 caracteres'),

  equipment_name: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  equipment_type: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .oneOf([
      'drill_rig',
      'core_drill',
      'rotary_drill',
      'pump',
      'generator',
      'compressor',
      'crane',
      'vehicle',
      'other',
    ], 'Tipo de equipo no válido'),

  manufacturer: yup
    .string()
    .trim()
    .nullable()
    .max(100, 'El fabricante no puede exceder 100 caracteres'),

  model: yup
    .string()
    .trim()
    .nullable()
    .max(100, 'El modelo no puede exceder 100 caracteres'),

  serial_number: yup
    .string()
    .trim()
    .required('Este campo es requerido')
    .min(3, 'El número de serie debe tener al menos 3 caracteres')
    .nullable()
    .max(100, 'El número de serie no puede exceder 100 caracteres'),

  year_manufactured: yup
    .number()
    .min(1900, 'El año debe ser mayor a 1900')
    .max(new Date().getFullYear() + 1, 'El año no puede ser mayor al actual + 1')
    .required('Este campo es requerido')
    .integer('El año debe ser un número entero'),

  purchase_date: yup
    .string()
    .nullable()
    .test('date-format', 'Formato de fecha inválido', value => {
      if (!value)
        return true // Permitir valores nulos
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/

      return dateRegex.test(value)
    }),

  service_interval_hours: yup
    .number()
    .min(0, 'El intervalo debe ser mayor o igual a 0')
    .max(10000, 'El intervalo no puede exceder 10,000 horas')
    .required('Este campo es requerido')
    .integer('El intervalo debe ser un número entero'),

  initial_operating_hours: yup
    .number()
    .min(0, 'Las horas iniciales deben ser mayor o igual a 0')
    .max(100000, 'Las horas iniciales no pueden exceder 100,000')
    .required('Este campo es requerido'),

  specifications: yup
    .object()
    .nullable()
    .test('specifications-format', 'Formato de especificaciones inválido', value => {
      if (!value)
        return true // Permitir valores nulos

      return typeof value === 'object' && !Array.isArray(value)
    }),
})

/**
 * Schema de validación para actualizar equipos (campos editables)
 */
export const equipmentUpdateValidationSchema = yup.object({
  equipment_name: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres'),

  manufacturer: yup
    .string()
    .trim()
    .nullable()
    .max(100, 'El fabricante no puede exceder 100 caracteres'),

  model: yup
    .string()
    .trim()
    .nullable()
    .max(100, 'El modelo no puede exceder 100 caracteres'),

  specifications: yup
    .object()
    .nullable()
    .test('specifications-format', 'Formato de especificaciones inválido', value => {
      if (!value)
        return true // Permitir valores nulos

      return typeof value === 'object' && !Array.isArray(value)
    }),

  service_interval_hours: yup
    .number()
    .min(0, 'El intervalo debe ser mayor o igual a 0')
    .max(10000, 'El intervalo no puede exceder 10,000 horas')
    .required('Este campo es requerido')
    .integer('El intervalo debe ser un número entero'),
})

/**
 * Función helper para validar datos de equipo
 * @param data - Datos a validar
 * @param isUpdate - Si es una actualización (usa schema diferente)
 * @returns Datos validados y limpiados
 */
export const validateEquipmentData = async (data: any, isUpdate = false) => {
  const schema = isUpdate ? equipmentUpdateValidationSchema : equipmentValidationSchema

  try {
    const validatedData = await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    })

    return {
      success: true,
      data: validatedData,
      errors: null,
    }
  }
  catch (error) {
    if (error instanceof yup.ValidationError) {
      return {
        success: false,
        data: null,
        errors: error.errors,
      }
    }

    throw error
  }
}
