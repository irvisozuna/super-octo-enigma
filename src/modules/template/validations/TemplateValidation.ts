import { useI18n } from 'vue-i18n'; // Importamos i18n para traducir mensajes
import * as yup from 'yup';

// Requerimos la función de traducción
const { t } = useI18n();

// Validación común para el modelo Template
export const templateBaseValidation = yup.object({
  first_name: yup
    .string()
    .required(t('validations.required', { field: t('fields.first_name') })), // Traducción dinámica
  last_name: yup
    .string()
    .required(t('validations.required', { field: t('fields.last_name') })),
  email: yup
    .string()
    .email(t('validations.invalidEmail'))
    .required(t('validations.required', { field: t('fields.email') })),
  password: yup
    .string()
    .min(6, t('validations.minLength', { field: t('fields.password'), length: 6 }))
    .required(t('validations.required', { field: t('fields.password') })),
  role: yup
    .array()
    .nullable()
    .min(1, t('validations.minItems', { field: t('fields.role'), count: 1 })),
});

// Validación extendida para crear un usuario
export const templateCreateValidation = templateBaseValidation.shape({
  role: yup
    .array()
    .nullable()
    .min(1, t('validations.minItems', { field: t('fields.role'), count: 1 })),
});

// Validación para editar un usuario
export const templateEditValidation = templateBaseValidation.shape({
  password: yup.string().notRequired(), // Password no es obligatorio al editar
});
