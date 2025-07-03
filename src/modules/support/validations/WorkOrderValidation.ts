// WorkOrderValidation.ts
import { useI18n } from 'vue-i18n';
import * as yup from 'yup';

// En Vue 3, define una función que retorne el schema
export function useWorkOrderValidation() {
  // Aquí sí puedes usar useI18n() porque estás dentro de una función composable
  const { t } = useI18n();

  // Retorna el schema de Yup
  return yup.object({
    source_entity: yup
      .mixed()
      .required(t('validations.required', { field: 'Entidad' })),
    type_code: yup
      .mixed()
      .required(t('validations.required', { field: 'Tipo' })),
    severity_code: yup
      .string()
      .required(t('validations.required', { field: 'Prioridad' })),
    subject: yup
      .string()
      .required(t('validations.required', { field: 'Asunto' })),
    message: yup
      .string()
      .required(t('validations.required', { field: 'Mensaje' })),
    // ... y más validaciones si requieres
  });
}
