/**
 * Schemas de validación para el módulo DrillingReportsModule
 *
 * Este archivo centraliza todas las exportaciones de schemas de validación
 * para facilitar su importación y mantenimiento.
 */

// Equipment schemas
export {
  equipmentValidationSchema,
  equipmentUpdateValidationSchema,
  validateEquipmentData,
} from './equipmentValidation'

// Tool schemas
export {
  toolValidationSchema,
  toolUpdateValidationSchema,
  validateToolData,
} from './toolValidation'

// Well schemas
export {
  wellValidationSchema,
  validateWellData,
} from './wellValidation'

export {
  EQUIPMENT_TYPES,
} from '../../shared/constants/EquipmentConstants'

// Aquí se pueden agregar más schemas en el futuro:
// export { projectValidationSchema } from './projectValidation'
// export { wellValidationSchema } from './wellValidation'
// export { toolValidationSchema } from './toolValidation'
