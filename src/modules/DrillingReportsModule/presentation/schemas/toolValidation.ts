import * as yup from 'yup'

/**
 * Schema de validación para el formulario de herramientas
 * Incluye validaciones para crear y editar herramientas
 */
export const toolValidationSchema = yup.object({
  type: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .oneOf([
      'drill_bit_pdc',
      'drill_bit_tricone',
      'drill_bit_diamond',
      'casing',
      'drill_pipe',
      'stabilizer',
      'reamer',
      'jar',
      'motor',
      'sub',
      'mud',
      'pump',
    ], 'Tipo de herramienta no válido'),
  
  serial_number: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(50, 'El número de serie no puede exceder 50 caracteres'),
  
  capacity_meters: yup
    .number()
    .min(0.1, 'La capacidad debe ser mayor a 0.1 metros')
    .max(10000, 'La capacidad no puede exceder 10,000 metros')
    .required('Este campo es requerido'),
  
  acquired_at: yup
    .string()
    .required('Este campo es requerido')
    .test('date-format', 'Formato de fecha inválido', value => {
      if (!value)
        return false
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      return dateRegex.test(value)
    }),
  
  brand: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(100, 'La marca no puede exceder 100 caracteres'),
  
  diameter: yup
    .number()
    .min(0.1, 'El diámetro debe ser mayor a 0.1mm')
    .max(1000, 'El diámetro no puede exceder 1000mm')
    .required('Este campo es requerido'),
  
  matrix: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(50, 'La matriz no puede exceder 50 caracteres'),
})

/**
 * Schema de validación para actualizar herramientas (campos editables)
 */
export const toolUpdateValidationSchema = yup.object({
  type: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .oneOf([
      'drill_bit_pdc',
      'drill_bit_tricone',
      'drill_bit_diamond',
      'casing',
      'drill_pipe',
      'stabilizer',
      'reamer',
      'jar',
      'motor',
      'sub',
      'mud',
      'pump',
    ], 'Tipo de herramienta no válido'),
  
  serial_number: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(50, 'El número de serie no puede exceder 50 caracteres'),
  
  capacity_meters: yup
    .number()
    .min(0.1, 'La capacidad debe ser mayor a 0.1 metros')
    .max(10000, 'La capacidad no puede exceder 10,000 metros')
    .required('Este campo es requerido'),
  
  acquired_at: yup
    .string()
    .required('Este campo es requerido')
    .test('date-format', 'Formato de fecha inválido', value => {
      if (!value)
        return false
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      return dateRegex.test(value)
    }),
  
  brand: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(100, 'La marca no puede exceder 100 caracteres'),
  
  diameter: yup
    .number()
    .min(0.1, 'El diámetro debe ser mayor a 0.1mm')
    .max(1000, 'El diámetro no puede exceder 1000mm')
    .required('Este campo es requerido'),
  
  matrix: yup
    .string()
    .required('Este campo es requerido')
    .trim()
    .min(1, 'Este campo no puede estar vacío')
    .max(50, 'La matriz no puede exceder 50 caracteres'),
})

/**
 * Función helper para validar datos de herramienta
 * @param data - Datos a validar
 * @param isUpdate - Si es una actualización (usa schema diferente)
 * @returns Datos validados y limpiados
 */
export const validateToolData = async (data: any, isUpdate = false) => {
  const schema = isUpdate ? toolUpdateValidationSchema : toolValidationSchema

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
