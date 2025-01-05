import { useI18n } from 'vue-i18n';
import * as yup from 'yup';

export const useProfileValidation = () => {
  const { t } = useI18n(); // Accede a la función de traducción

  return yup.object({
    first_name: yup
      .string()
      .required(t('validations.required', { field: t('fields.first_name') })),
    last_name: yup
      .string()
      .required(t('validations.required', { field: t('fields.last_name') })),
    email: yup
      .string()
      .email(t('validations.invalidEmail'))
      .required(t('validations.required', { field: t('email') })),
    phone: yup
      .string()
      .nullable(),
    address: yup
      .string()
      .nullable()
      .max(255, t('validations.maxLength', { field: t('address'), length: 255 })),
    state: yup.string().nullable(),
    zip: yup
      .string()
      .nullable()
      .matches(/^\d{5}$/, t('validations.invalidZip')),
    country: yup
      .string()
      .required(t('validations.required', { field: t('country') })),
    timezone: yup
      .string()
      .required(t('validations.required', { field: t('timezone') })),
    currency: yup
      .string()
      .required(t('validations.required', { field: t('currency') })),
  });
};
