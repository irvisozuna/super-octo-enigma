import * as yup from 'yup'
import i18n from '@/plugins/i18n'

const { t } = i18n.global

export const toolSchema = yup.object().shape({
  name: yup.string()
    .required(t('validation.tool.nameRequired'))
    .min(3, t('validation.tool.nameMinLength'))
    .max(100, t('validation.tool.nameMaxLength')),
  tool_type: yup.string()
    .oneOf(['drill_bit', 'casing', 'cement', 'mud', 'pump', 'other'], t('validation.tool.typeInvalid'))
    .required(t('validation.tool.typeRequired')),
  manufacturer: yup.string()
    .required(t('validation.tool.manufacturerRequired'))
    .min(2, t('validation.tool.manufacturerMinLength'))
    .max(100, t('validation.tool.manufacturerMaxLength')),
  model: yup.string()
    .required(t('validation.tool.modelRequired'))
    .min(2, t('validation.tool.modelMinLength'))
    .max(100, t('validation.tool.modelMaxLength')),
  serial_number: yup.string()
    .required(t('validation.tool.serialNumberRequired'))
    .min(3, t('validation.tool.serialNumberMinLength'))
    .max(50, t('validation.tool.serialNumberMaxLength')),
  specifications: yup.object().shape({
    diameter: yup.number().min(0.1, t('validation.tool.diameterMin')).max(100, t('validation.tool.diameterMax')),
    length: yup.number().min(0.1, t('validation.tool.lengthMin')).max(1000, t('validation.tool.lengthMax')),
    weight: yup.number().min(0.1, t('validation.tool.weightMin')).max(10000, t('validation.tool.weightMax')),
    material: yup.string().max(100, t('validation.tool.materialMaxLength')),
  }).required(t('validation.tool.specificationsRequired')),
  location: yup.string()
    .required(t('validation.tool.locationRequired'))
    .min(5, t('validation.tool.locationMinLength'))
    .max(200, t('validation.tool.locationMaxLength')),
  purchase_date: yup.date()
    .required(t('validation.tool.purchaseDateRequired'))
    .max(new Date(), t('validation.tool.purchaseDateFuture')),
  warranty_expiry: yup.date()
    .min(yup.ref('purchase_date'), t('validation.tool.warrantyExpiryAfterPurchase')),
})

export const toolCreateSchema = toolSchema

export const toolUpdateSchema = yup.object().shape({
  name: yup.string()
    .min(3, t('validation.tool.nameMinLength'))
    .max(100, t('validation.tool.nameMaxLength')),
  tool_type: yup.string()
    .oneOf(['drill_bit', 'casing', 'cement', 'mud', 'pump', 'other'], t('validation.tool.typeInvalid')),
  manufacturer: yup.string()
    .min(2, t('validation.tool.manufacturerMinLength'))
    .max(100, t('validation.tool.manufacturerMaxLength')),
  model: yup.string()
    .min(2, t('validation.tool.modelMinLength'))
    .max(100, t('validation.tool.modelMaxLength')),
  serial_number: yup.string()
    .min(3, t('validation.tool.serialNumberMinLength'))
    .max(50, t('validation.tool.serialNumberMaxLength')),
  specifications: yup.object().shape({
    diameter: yup.number().min(0.1, t('validation.tool.diameterMin')).max(100, t('validation.tool.diameterMax')),
    length: yup.number().min(0.1, t('validation.tool.lengthMin')).max(1000, t('validation.tool.lengthMax')),
    weight: yup.number().min(0.1, t('validation.tool.weightMin')).max(10000, t('validation.tool.weightMax')),
    material: yup.string().max(100, t('validation.tool.materialMaxLength')),
  }),
  status: yup.string()
    .oneOf(['available', 'in_use', 'maintenance', 'retired'], t('validation.tool.statusInvalid')),
  location: yup.string()
    .min(5, t('validation.tool.locationMinLength'))
    .max(200, t('validation.tool.locationMaxLength')),
  purchase_date: yup.date()
    .max(new Date(), t('validation.tool.purchaseDateFuture')),
  warranty_expiry: yup.date()
    .min(yup.ref('purchase_date'), t('validation.tool.warrantyExpiryAfterPurchase')),
})

export const toolFiltersSchema = yup.object().shape({
  search: yup.string().max(100, t('validation.tool.searchMaxLength')),
  tool_type: yup.string().oneOf(['drill_bit', 'casing', 'cement', 'mud', 'pump', 'other'], t('validation.tool.typeInvalid')),
  status: yup.string().oneOf(['available', 'in_use', 'maintenance', 'retired'], t('validation.tool.statusInvalid')),
  manufacturer: yup.string().max(100, t('validation.tool.manufacturerMaxLength')),
  page: yup.number().min(1, t('validation.tool.pageMin')),
  per_page: yup.number().min(1, t('validation.tool.perPageMin')).max(100, t('validation.tool.perPageMax')),
})
