import * as yup from 'yup'
import i18n from '@/plugins/i18n'

const { t } = i18n.global

export const wellSchema = yup.object().shape({
  name: yup.string()
    .required(t('validation.well.nameRequired'))
    .min(3, t('validation.well.nameMinLength'))
    .max(100, t('validation.well.nameMaxLength')),
  project_id: yup.string()
    .uuid(t('validation.well.projectIdInvalid'))
    .required(t('validation.well.projectRequired')),
  well_type: yup.string()
    .oneOf(['exploration', 'production', 'injection', 'monitoring'], t('validation.well.typeInvalid'))
    .required(t('validation.well.typeRequired')),
  depth_planned: yup.number()
    .required(t('validation.well.depthPlannedRequired'))
    .min(1, t('validation.well.depthPlannedMin'))
    .max(10000, t('validation.well.depthPlannedMax')),
  depth_actual: yup.number()
    .min(0, t('validation.well.depthActualMin'))
    .max(10000, t('validation.well.depthActualMax')),
  diameter: yup.number()
    .required(t('validation.well.diameterRequired'))
    .min(0.1, t('validation.well.diameterMin'))
    .max(50, t('validation.well.diameterMax')),
  coordinates: yup.object().shape({
    latitude: yup.number()
      .min(-90, t('validation.well.latitudeMin'))
      .max(90, t('validation.well.latitudeMax'))
      .required(t('validation.well.latitudeRequired')),
    longitude: yup.number()
      .min(-180, t('validation.well.longitudeMin'))
      .max(180, t('validation.well.longitudeMax'))
      .required(t('validation.well.longitudeRequired')),
  }).required(t('validation.well.coordinatesRequired')),
  start_date: yup.date(),
  completion_date: yup.date().min(yup.ref('start_date'), t('validation.well.completionDateAfterStart')),
})

export const wellCreateSchema = wellSchema

export const wellUpdateSchema = yup.object().shape({
  name: yup.string()
    .min(3, t('validation.well.nameMinLength'))
    .max(100, t('validation.well.nameMaxLength')),
  well_type: yup.string()
    .oneOf(['exploration', 'production', 'injection', 'monitoring'], t('validation.well.typeInvalid')),
  depth_planned: yup.number()
    .min(1, t('validation.well.depthPlannedMin'))
    .max(10000, t('validation.well.depthPlannedMax')),
  depth_actual: yup.number()
    .min(0, t('validation.well.depthActualMin'))
    .max(10000, t('validation.well.depthActualMax')),
  diameter: yup.number()
    .min(0.1, t('validation.well.diameterMin'))
    .max(50, t('validation.well.diameterMax')),
  coordinates: yup.object().shape({
    latitude: yup.number()
      .min(-90, t('validation.well.latitudeMin'))
      .max(90, t('validation.well.latitudeMax')),
    longitude: yup.number()
      .min(-180, t('validation.well.longitudeMin'))
      .max(180, t('validation.well.longitudeMax')),
  }),
  status: yup.string()
    .oneOf(['planned', 'drilling', 'completed', 'abandoned'], t('validation.well.statusInvalid')),
  start_date: yup.date(),
  completion_date: yup.date().min(yup.ref('start_date'), t('validation.well.completionDateAfterStart')),
})

export const wellFiltersSchema = yup.object().shape({
  search: yup.string().max(100, t('validation.well.searchMaxLength')),
  project_id: yup.string().uuid(t('validation.well.projectIdInvalid')),
  well_type: yup.string().oneOf(['exploration', 'production', 'injection', 'monitoring'], t('validation.well.typeInvalid')),
  status: yup.string().oneOf(['planned', 'drilling', 'completed', 'abandoned'], t('validation.well.statusInvalid')),
  page: yup.number().min(1, t('validation.well.pageMin')),
  per_page: yup.number().min(1, t('validation.well.perPageMin')).max(100, t('validation.well.perPageMax')),
})
