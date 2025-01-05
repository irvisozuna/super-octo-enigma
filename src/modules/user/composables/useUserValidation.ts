// useUserValidation.ts
import { useI18n } from 'vue-i18n';
import * as yup from 'yup';

export function useUserValidation() {
  const { t } = useI18n();
  
  const userBaseValidation = yup.object({
    first_name: yup.string()
      .required(t('validations.required', { field: t('fields.first_name') })),
    last_name: yup.string()
      .required(t('validations.required', { field: t('fields.last_name') })),
    email: yup.string()
      .email(t('validations.invalidEmail'))
      .required(t('validations.required', { field: t('fields.email') })),
    password: yup.string()
      .min(6, t('validations.minLength', { field: t('fields.password'), length: 6 }))
      .required(t('validations.required', { field: t('fields.password') })),
    role: yup.array()
      .nullable()
      .min(1, t('validations.minItems', { field: t('fields.role'), count: 1 })),
  });

  const userCreateValidation = userBaseValidation.shape({
    role: yup.array()
      .required(t('validations.required', { field: t('fields.role') }))
      .min(1, t('validations.minItems', { field: t('fields.role'), count: 1 })),
  });

  const userEditValidation = userBaseValidation.shape({
    password: yup.string().notRequired(),
    first_name: yup.string().notRequired(),
    last_name: yup.string().notRequired(),
    name: yup.string().required(t('validations.required', { field: t('fields.name') }))
  });

  return {
    userBaseValidation,
    userCreateValidation,
    userEditValidation,
  };
}
