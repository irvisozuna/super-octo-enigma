import * as yup from 'yup'
import i18n from '@/plugins/i18n'

const { t } = i18n.global

export const projectSchema = yup.object().shape({
  name: yup.string()
    .required(t('validation.project.nameRequired'))
    .min(3, t('validation.project.nameMinLength'))
    .max(100, t('validation.project.nameMaxLength')),
  description: yup.string()
    .required(t('validation.project.descriptionRequired'))
    .min(10, t('validation.project.descriptionMinLength'))
    .max(500, t('validation.project.descriptionMaxLength')),
  start_date: yup.date()
    .required(t('validation.project.startDateRequired'))
    .min(new Date(), t('validation.project.startDateFuture')),
  end_date: yup.date()
    .required(t('validation.project.endDateRequired'))
    .min(yup.ref('start_date'), t('validation.project.endDateAfterStart')),
  client_id: yup.string()
    .uuid(t('validation.project.clientIdInvalid'))
    .required(t('validation.project.clientRequired')),
  location: yup.string()
    .required(t('validation.project.locationRequired'))
    .min(5, t('validation.project.locationMinLength'))
    .max(200, t('validation.project.locationMaxLength')),
  coordinates: yup.object().shape({
    latitude: yup.number()
      .min(-90, t('validation.project.latitudeMin'))
      .max(90, t('validation.project.latitudeMax'))
      .required(t('validation.project.latitudeRequired')),
    longitude: yup.number()
      .min(-180, t('validation.project.longitudeMin'))
      .max(180, t('validation.project.longitudeMax'))
      .required(t('validation.project.longitudeRequired')),
  }).optional(),
})

export const projectCreateSchema = projectSchema

export const projectUpdateSchema = yup.object().shape({
  name: yup.string()
    .min(3, t('validation.project.nameMinLength'))
    .max(100, t('validation.project.nameMaxLength')),
  description: yup.string()
    .min(10, t('validation.project.descriptionMinLength'))
    .max(500, t('validation.project.descriptionMaxLength')),
  start_date: yup.date()
    .min(new Date(), t('validation.project.startDateFuture')),
  end_date: yup.date()
    .min(yup.ref('start_date'), t('validation.project.endDateAfterStart')),
  status: yup.string()
    .oneOf(['active', 'completed', 'cancelled', 'on_hold'], t('validation.project.statusInvalid')),
  location: yup.string()
    .min(5, t('validation.project.locationMinLength'))
    .max(200, t('validation.project.locationMaxLength')),
  coordinates: yup.object().shape({
    latitude: yup.number()
      .min(-90, t('validation.project.latitudeMin'))
      .max(90, t('validation.project.latitudeMax')),
    longitude: yup.number()
      .min(-180, t('validation.project.longitudeMin'))
      .max(180, t('validation.project.longitudeMax')),
  }).optional(),
})

export const projectFiltersSchema = yup.object().shape({
  search: yup.string().max(100, t('validation.project.searchMaxLength')),
  status: yup.string().oneOf(['active', 'completed', 'cancelled', 'on_hold'], t('validation.project.statusInvalid')),
  client_id: yup.string().uuid(t('validation.project.clientIdInvalid')),
  date_from: yup.date(),
  date_to: yup.date().min(yup.ref('date_from'), t('validation.project.dateToAfterFrom')),
  page: yup.number().min(1, t('validation.project.pageMin')),
  per_page: yup.number().min(1, t('validation.project.perPageMin')).max(100, t('validation.project.perPageMax')),
})
