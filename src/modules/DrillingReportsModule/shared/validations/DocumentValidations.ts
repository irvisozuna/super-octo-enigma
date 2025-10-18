import * as yup from 'yup'
import i18n from '@/plugins/i18n'

const { t } = i18n.global

export const documentSchema = yup.object().shape({
  name: yup.string()
    .required(t('validation.document.nameRequired'))
    .min(3, t('validation.document.nameMinLength'))
    .max(100, t('validation.document.nameMaxLength')),
  description: yup.string()
    .max(500, t('validation.document.descriptionMaxLength')),
  document_type: yup.string()
    .oneOf(['report', 'permit', 'certificate', 'manual', 'other'], t('validation.document.typeInvalid'))
    .required(t('validation.document.typeRequired')),
  related_entity_type: yup.string()
    .oneOf(['project', 'well', 'report', 'tool', 'employee'], t('validation.document.relatedEntityTypeInvalid'))
    .required(t('validation.document.relatedEntityTypeRequired')),
  related_entity_id: yup.string()
    .uuid(t('validation.document.relatedEntityIdInvalid'))
    .required(t('validation.document.relatedEntityIdRequired')),
})

export const documentCreateSchema = documentSchema.shape({
  file: yup.mixed()
    .required(t('validation.document.fileRequired'))
    .test('fileSize', t('validation.document.fileSizeMax'), value => {
      if (!value)
        return true

      return value.size <= 10 * 1024 * 1024 // 10MB max
    })
    .test('fileType', t('validation.document.fileTypeInvalid'), value => {
      if (!value)
        return true

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed',
      ]

      return allowedTypes.includes(value.type)
    }),
})

export const documentUpdateSchema = yup.object().shape({
  name: yup.string()
    .min(3, t('validation.document.nameMinLength'))
    .max(100, t('validation.document.nameMaxLength')),
  description: yup.string()
    .max(500, t('validation.document.descriptionMaxLength')),
  document_type: yup.string()
    .oneOf(['report', 'permit', 'certificate', 'manual', 'other'], t('validation.document.typeInvalid')),
})

export const documentFiltersSchema = yup.object().shape({
  search: yup.string().max(100, t('validation.document.searchMaxLength')),
  document_type: yup.string().oneOf(['report', 'permit', 'certificate', 'manual', 'other'], t('validation.document.typeInvalid')),
  related_entity_type: yup.string().oneOf(['project', 'well', 'report', 'tool', 'employee'], t('validation.document.relatedEntityTypeInvalid')),
  related_entity_id: yup.string().uuid(t('validation.document.relatedEntityIdInvalid')),
  date_from: yup.date(),
  date_to: yup.date().min(yup.ref('date_from'), t('validation.document.dateToAfterFrom')),
  page: yup.number().min(1, t('validation.document.pageMin')),
  per_page: yup.number().min(1, t('validation.document.perPageMin')).max(100, t('validation.document.perPageMax')),
})

export const documentUploadSchema = yup.object().shape({
  file: yup.mixed()
    .required(t('validation.document.fileRequired'))
    .test('fileSize', t('validation.document.fileSizeMax'), value => {
      if (!value)
        return true

      return value.size <= 10 * 1024 * 1024 // 10MB max
    })
    .test('fileType', t('validation.document.fileTypeInvalid'), value => {
      if (!value)
        return true

      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed',
      ]

      return allowedTypes.includes(value.type)
    }),
  name: yup.string()
    .required(t('validation.document.nameRequired'))
    .min(3, t('validation.document.nameMinLength'))
    .max(100, t('validation.document.nameMaxLength')),
  description: yup.string()
    .max(500, t('validation.document.descriptionMaxLength')),
  document_type: yup.string()
    .oneOf(['report', 'permit', 'certificate', 'manual', 'other'], t('validation.document.typeInvalid'))
    .required(t('validation.document.typeRequired')),
  related_entity_type: yup.string()
    .oneOf(['project', 'well', 'report', 'tool', 'employee'], t('validation.document.relatedEntityTypeInvalid'))
    .required(t('validation.document.relatedEntityTypeRequired')),
  related_entity_id: yup.string()
    .uuid(t('validation.document.relatedEntityIdInvalid'))
    .required(t('validation.document.relatedEntityIdRequired')),
})
