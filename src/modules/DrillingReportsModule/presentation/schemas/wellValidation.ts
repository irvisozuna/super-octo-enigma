import * as yup from 'yup'

/**
 * Schema de validación para el formulario de pozos
 * Incluye validaciones para crear pozos
 */
export const wellValidationSchema = yup.object({
  well_name: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(200, 'El nombre no puede exceder 200 caracteres'),

  well_code: yup
    .string()
    .trim()
    .nullable()
    .max(100, 'El código no puede exceder 100 caracteres'),

  location: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(300, 'La ubicación no puede exceder 300 caracteres'),

  surface_coordinates: yup.object({
    latitude: yup
      .number()
      .required('La latitud es requerida')
      .min(-90, 'La latitud debe estar entre -90 y 90')
      .max(90, 'La latitud debe estar entre -90 y 90'),

    longitude: yup
      .number()
      .required('La longitud es requerida')
      .min(-180, 'La longitud debe estar entre -180 y 180')
      .max(180, 'La longitud debe estar entre -180 y 180'),
  }).required('Las coordenadas son requeridas'),

  planned_depth_meters: yup
    .number()
    .required('Este campo es requerido')
    .min(0.1, 'La profundidad debe ser mayor a 0.1 metros')
    .max(50000, 'La profundidad no puede exceder 50,000 metros'),

  hole_diameter_inches: yup
    .number()
    .required('Este campo es requerido')
    .min(0.1, 'El diámetro debe ser mayor a 0.1 pulgadas')
    .max(100, 'El diámetro no puede exceder 100 pulgadas'),

  current_depth_meters: yup
    .number()
    .min(0, 'La profundidad actual debe ser mayor o igual a 0')
    .max(50000, 'La profundidad actual no puede exceder 50,000 metros')
    .default(0),

  status: yup
    .string()
    .required('Este campo es requerido')
    .oneOf(['planned', 'drilling', 'completed', 'suspended', 'abandoned'], 'Estado no válido'),

  drilling_type: yup
    .string()
    .nullable()
    .oneOf(['rotary', 'percussion', 'directional', 'horizontal', 'other'], 'Tipo de perforación no válido'),

  spud_date: yup
    .string()
    .required('Este campo es requerido')
    .test('date-format', 'Formato de fecha inválido', value => {
      if (!value)
        return false
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/

      return dateRegex.test(value)
    })
    .test('not-future', 'La fecha de inicio no puede ser futura', value => {
      if (!value)
        return false
      const inputDate = new Date(value)
      const today = new Date()

      today.setHours(23, 59, 59, 999) // End of today

      return inputDate <= today
    }),

  expected_end_date: yup
    .string()
    .nullable()
    .test('date-format', 'Formato de fecha inválido', value => {
      if (!value)
        return true // Permitir valores nulos
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/

      return dateRegex.test(value)
    })
    .test('after-spud', 'La fecha esperada de fin debe ser posterior a la fecha de inicio', function (value) {
      const { spud_date } = this.parent
      if (!value || !spud_date)
        return true

      return new Date(value) > new Date(spud_date)
    }),

  notes: yup
    .string()
    .trim()
    .nullable()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres'),

  project_id: yup
    .string()
    .required('El ID del proyecto es requerido')
    .trim()
    .min(1, 'El ID del proyecto no puede estar vacío'),
})

/**
 * Función helper para validar datos de pozo
 * @param data - Datos a validar
 * @returns Datos validados y limpiados
 */
export const validateWellData = async (data: any) => {
  try {
    const validatedData = await wellValidationSchema.validate(data, {
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
