import * as yup from 'yup'

// Esquema de validación para crear contrato
export const contractRegistryCreateSchema = yup.object({
  controlNumber: yup
    .number()
    .required('El número de control es requerido')
    .integer('El número de control debe ser un número entero')
    .min(1, 'El número de control debe ser mayor a 0'),

  contractNumber: yup
    .number()
    .required('El número de contrato es requerido')
    .integer('El número de contrato debe ser un número entero')
    .min(1, 'El número de contrato debe ser mayor a 0'),

  name: yup
    .string()
    .required('El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),

  cardNumber: yup
    .string()
    .required('El número de tarjeta es requerido')
    .max(20, 'El número de tarjeta no puede exceder 20 caracteres')
    .min(13, 'El número de tarjeta debe tener al menos 13 dígitos')
    .matches(/^[\d\s]+$/, 'El número de tarjeta solo puede contener dígitos y espacios'),

  maxAmount: yup
    .number()
    .required('El monto máximo es requerido')
    .min(0.01, 'El monto máximo debe ser mayor a 0')
    .max(999999.99, 'El monto máximo no puede exceder 999,999.99'),

  expirationDate: yup
    .string()
    .required('La fecha de expiración es requerida')
    .max(5, 'La fecha de expiración no puede exceder 5 caracteres')
    .min(4, 'La fecha de expiración debe tener al menos 4 caracteres')
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Formato de fecha inválido (MM/YY)'),

  bank: yup
    .string()
    .required('El banco es requerido')
    .min(1, 'El banco es requerido'),

  accountType: yup
    .string()
    .required('El tipo de cuenta es requerido')
    .oneOf(['Débito', 'Crédito'], 'Tipo de cuenta inválido'),

  registrationDate: yup
    .string()
    .required('La fecha de registro es requerida')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),

  chargeFrequency: yup
    .number()
    .required('La frecuencia de cobro es requerida')
    .integer('La frecuencia de cobro debe ser un número entero')
    .min(1, 'La frecuencia de cobro debe ser mayor a 0')
    .max(365, 'La frecuencia de cobro no puede exceder 365 días'),

  phone: yup
    .string()
    .required('El teléfono es requerido')
    .matches(/^[\d\s\-+()]+$/, 'Formato de teléfono inválido')
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
})

// Esquema de validación para actualizar contrato (todos los campos opcionales)
export const contractRegistryUpdateSchema = yup.object({
  controlNumber: yup
    .number()
    .integer('El número de control debe ser un número entero')
    .min(1, 'El número de control debe ser mayor a 0')
    .optional(),

  contractNumber: yup
    .number()
    .integer('El número de contrato debe ser un número entero')
    .min(1, 'El número de contrato debe ser mayor a 0')
    .optional(),

  name: yup
    .string()
    .max(200, 'El nombre no puede exceder 200 caracteres')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .optional(),

  cardNumber: yup
    .string()
    .max(20, 'El número de tarjeta no puede exceder 20 caracteres')
    .matches(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, 'Formato de tarjeta inválido')
    .optional(),

  maxAmount: yup
    .number()
    .min(0.01, 'El monto máximo debe ser mayor a 0')
    .max(999999.99, 'El monto máximo no puede exceder 999,999.99')
    .optional(),

  expirationDate: yup
    .string()
    .max(5, 'La fecha de expiración no puede exceder 5 caracteres')
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Formato de fecha inválido (MM/YY)')
    .optional(),

  bank: yup
    .string()
    .min(1, 'El banco es requerido')
    .optional(),

  accountType: yup
    .string()
    .oneOf(['Débito', 'Crédito'], 'Tipo de cuenta inválido')
    .optional(),

  registrationDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional(),

  chargeFrequency: yup
    .number()
    .integer('La frecuencia de cobro debe ser un número entero')
    .min(1, 'La frecuencia de cobro debe ser mayor a 0')
    .max(365, 'La frecuencia de cobro no puede exceder 365 días')
    .optional(),

  phone: yup
    .string()
    .matches(/^[\d\s\-+()]+$/, 'Formato de teléfono inválido')
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional(),
})

// Validación general que se adapta según el contexto
export const contractRegistryValidation = {
  create: contractRegistryCreateSchema,
  update: contractRegistryUpdateSchema,

  // Método de validación general
  isValidSync: (data: any, type: 'create' | 'update' = 'create') => {
    try {
      const schema = type === 'create' ? contractRegistryCreateSchema : contractRegistryUpdateSchema

      schema.validateSync(data, { abortEarly: false })

      return true
    }
    catch (error) {
      return false
    }
  },

  // Método de validación asíncrono
  validate: async (data: any, type: 'create' | 'update' = 'create') => {
    try {
      const schema = type === 'create' ? contractRegistryCreateSchema : contractRegistryUpdateSchema

      await schema.validate(data, { abortEarly: false })

      return { isValid: true, errors: {} }
    }
    catch (error: any) {
      const errors: Record<string, string[]> = {}
      if (error.inner) {
        error.inner.forEach((err: any) => {
          if (err.path)
            errors[err.path] = [err.message]
        })
      }

      return { isValid: false, errors }
    }
  },
}
