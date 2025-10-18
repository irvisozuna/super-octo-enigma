import * as yup from 'yup'
import i18n from '@/plugins/i18n'

const { t } = i18n.global

export const equipmentSchema = yup.object().shape({
  name: yup.string()
    .required(t('validation.equipment.nameRequired'))
    .min(3, t('validation.equipment.nameMinLength'))
    .max(100, t('validation.equipment.nameMaxLength')),
  equipment_type: yup.string()
    .oneOf(['drill_rig', 'pump', 'generator', 'compressor', 'crane', 'other'], t('validation.equipment.typeInvalid'))
    .required(t('validation.equipment.typeRequired')),
  manufacturer: yup.string()
    .required(t('validation.equipment.manufacturerRequired'))
    .min(2, t('validation.equipment.manufacturerMinLength'))
    .max(100, t('validation.equipment.manufacturerMaxLength')),
  model: yup.string()
    .required(t('validation.equipment.modelRequired'))
    .min(2, t('validation.equipment.modelMinLength'))
    .max(100, t('validation.equipment.modelMaxLength')),
  serial_number: yup.string()
    .required(t('validation.equipment.serialNumberRequired'))
    .min(3, t('validation.equipment.serialNumberMinLength'))
    .max(50, t('validation.equipment.serialNumberMaxLength')),
  specifications: yup.object().shape({
    capacity: yup.number().min(0.1, t('validation.equipment.capacityMin')).max(10000, t('validation.equipment.capacityMax')),
    power: yup.number().min(0.1, t('validation.equipment.powerMin')).max(10000, t('validation.equipment.powerMax')),
    weight: yup.number().min(0.1, t('validation.equipment.weightMin')).max(100000, t('validation.equipment.weightMax')),
    dimensions: yup.object().shape({
      length: yup.number().min(0.1, t('validation.equipment.lengthMin')).max(1000, t('validation.equipment.lengthMax')),
      width: yup.number().min(0.1, t('validation.equipment.widthMin')).max(1000, t('validation.equipment.widthMax')),
      height: yup.number().min(0.1, t('validation.equipment.heightMin')).max(1000, t('validation.equipment.heightMax')),
    }),
  }).required(t('validation.equipment.specificationsRequired')),
  location: yup.string()
    .required(t('validation.equipment.locationRequired'))
    .min(5, t('validation.equipment.locationMinLength'))
    .max(200, t('validation.equipment.locationMaxLength')),
  purchase_date: yup.date()
    .required(t('validation.equipment.purchaseDateRequired'))
    .max(new Date(), t('validation.equipment.purchaseDateFuture')),
  warranty_expiry: yup.date()
    .min(yup.ref('purchase_date'), t('validation.equipment.warrantyExpiryAfterPurchase')),
})

export const equipmentCreateSchema = equipmentSchema

export const equipmentUpdateSchema = yup.object().shape({
  name: yup.string()
    .min(3, t('validation.equipment.nameMinLength'))
    .max(100, t('validation.equipment.nameMaxLength')),
  equipment_type: yup.string()
    .oneOf(['drill_rig', 'pump', 'generator', 'compressor', 'crane', 'other'], t('validation.equipment.typeInvalid')),
  manufacturer: yup.string()
    .min(2, t('validation.equipment.manufacturerMinLength'))
    .max(100, t('validation.equipment.manufacturerMaxLength')),
  model: yup.string()
    .min(2, t('validation.equipment.modelMinLength'))
    .max(100, t('validation.equipment.modelMaxLength')),
  serial_number: yup.string()
    .min(3, t('validation.equipment.serialNumberMinLength'))
    .max(50, t('validation.equipment.serialNumberMaxLength')),
  specifications: yup.object().shape({
    capacity: yup.number().min(0.1, t('validation.equipment.capacityMin')).max(10000, t('validation.equipment.capacityMax')),
    power: yup.number().min(0.1, t('validation.equipment.powerMin')).max(10000, t('validation.equipment.powerMax')),
    weight: yup.number().min(0.1, t('validation.equipment.weightMin')).max(100000, t('validation.equipment.weightMax')),
    dimensions: yup.object().shape({
      length: yup.number().min(0.1, t('validation.equipment.lengthMin')).max(1000, t('validation.equipment.lengthMax')),
      width: yup.number().min(0.1, t('validation.equipment.widthMin')).max(1000, t('validation.equipment.widthMax')),
      height: yup.number().min(0.1, t('validation.equipment.heightMin')).max(1000, t('validation.equipment.heightMax')),
    }),
  }),
  status: yup.string()
    .oneOf(['available', 'in_use', 'maintenance', 'retired'], t('validation.equipment.statusInvalid')),
  location: yup.string()
    .min(5, t('validation.equipment.locationMinLength'))
    .max(200, t('validation.equipment.locationMaxLength')),
  purchase_date: yup.date()
    .max(new Date(), t('validation.equipment.purchaseDateFuture')),
  warranty_expiry: yup.date()
    .min(yup.ref('purchase_date'), t('validation.equipment.warrantyExpiryAfterPurchase')),
})

export const equipmentFiltersSchema = yup.object().shape({
  search: yup.string().max(100, t('validation.equipment.searchMaxLength')),
  equipment_type: yup.string().oneOf(['drill_rig', 'pump', 'generator', 'compressor', 'crane', 'other'], t('validation.equipment.typeInvalid')),
  status: yup.string().oneOf(['available', 'in_use', 'maintenance', 'retired'], t('validation.equipment.statusInvalid')),
  manufacturer: yup.string().max(100, t('validation.equipment.manufacturerMaxLength')),
  page: yup.number().min(1, t('validation.equipment.pageMin')),
  per_page: yup.number().min(1, t('validation.equipment.perPageMin')).max(100, t('validation.equipment.perPageMax')),
})
