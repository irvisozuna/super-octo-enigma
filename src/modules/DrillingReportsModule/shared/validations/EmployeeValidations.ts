import * as yup from 'yup'
import i18n from '@/plugins/i18n'

const { t } = i18n.global

export const employeeSchema = yup.object().shape({
  employee_number: yup.string()
    .required(t('validation.employee.employeeNumberRequired'))
    .min(3, t('validation.employee.employeeNumberMinLength'))
    .max(20, t('validation.employee.employeeNumberMaxLength')),
  first_name: yup.string()
    .required(t('validation.employee.firstNameRequired'))
    .min(2, t('validation.employee.firstNameMinLength'))
    .max(50, t('validation.employee.firstNameMaxLength')),
  last_name: yup.string()
    .required(t('validation.employee.lastNameRequired'))
    .min(2, t('validation.employee.lastNameMinLength'))
    .max(50, t('validation.employee.lastNameMaxLength')),
  email: yup.string()
    .email(t('validation.employee.emailInvalid'))
    .required(t('validation.employee.emailRequired')),
  phone: yup.string()
    .matches(/^\+?[1-9]\d{0,15}$/, t('validation.employee.phoneInvalid'))
    .max(20, t('validation.employee.phoneMaxLength')),
  position: yup.string()
    .required(t('validation.employee.positionRequired'))
    .min(3, t('validation.employee.positionMinLength'))
    .max(100, t('validation.employee.positionMaxLength')),
  department: yup.string()
    .required(t('validation.employee.departmentRequired'))
    .min(3, t('validation.employee.departmentMinLength'))
    .max(100, t('validation.employee.departmentMaxLength')),
  hire_date: yup.date()
    .required(t('validation.employee.hireDateRequired'))
    .max(new Date(), t('validation.employee.hireDateFuture')),
  skills: yup.array()
    .of(yup.string().min(2, t('validation.employee.skillMinLength')).max(50, t('validation.employee.skillMaxLength')))
    .min(1, t('validation.employee.skillsRequired'))
    .max(20, t('validation.employee.skillsMaxCount')),
  certifications: yup.array().of(
    yup.object().shape({
      name: yup.string()
        .required(t('validation.employee.certificationNameRequired'))
        .min(3, t('validation.employee.certificationNameMinLength'))
        .max(100, t('validation.employee.certificationNameMaxLength')),
      issued_by: yup.string()
        .required(t('validation.employee.certificationIssuerRequired'))
        .min(3, t('validation.employee.certificationIssuerMinLength'))
        .max(100, t('validation.employee.certificationIssuerMaxLength')),
      issued_date: yup.date()
        .required(t('validation.employee.certificationIssuedDateRequired'))
        .max(new Date(), t('validation.employee.certificationIssuedDateFuture')),
      expiry_date: yup.date()
        .min(yup.ref('issued_date'), t('validation.employee.certificationExpiryAfterIssued')),
    }),
  ).max(10, t('validation.employee.certificationsMaxCount')),
})

export const employeeCreateSchema = employeeSchema

export const employeeUpdateSchema = yup.object().shape({
  employee_number: yup.string()
    .min(3, t('validation.employee.employeeNumberMinLength'))
    .max(20, t('validation.employee.employeeNumberMaxLength')),
  first_name: yup.string()
    .min(2, t('validation.employee.firstNameMinLength'))
    .max(50, t('validation.employee.firstNameMaxLength')),
  last_name: yup.string()
    .min(2, t('validation.employee.lastNameMinLength'))
    .max(50, t('validation.employee.lastNameMaxLength')),
  email: yup.string()
    .email(t('validation.employee.emailInvalid')),
  phone: yup.string()
    .matches(/^\+?[1-9]\d{0,15}$/, t('validation.employee.phoneInvalid'))
    .max(20, t('validation.employee.phoneMaxLength')),
  position: yup.string()
    .min(3, t('validation.employee.positionMinLength'))
    .max(100, t('validation.employee.positionMaxLength')),
  department: yup.string()
    .min(3, t('validation.employee.departmentMinLength'))
    .max(100, t('validation.employee.departmentMaxLength')),
  hire_date: yup.date()
    .max(new Date(), t('validation.employee.hireDateFuture')),
  status: yup.string()
    .oneOf(['active', 'inactive', 'terminated'], t('validation.employee.statusInvalid')),
  skills: yup.array()
    .of(yup.string().min(2, t('validation.employee.skillMinLength')).max(50, t('validation.employee.skillMaxLength')))
    .max(20, t('validation.employee.skillsMaxCount')),
  certifications: yup.array().of(
    yup.object().shape({
      name: yup.string()
        .min(3, t('validation.employee.certificationNameMinLength'))
        .max(100, t('validation.employee.certificationNameMaxLength')),
      issued_by: yup.string()
        .min(3, t('validation.employee.certificationIssuerMinLength'))
        .max(100, t('validation.employee.certificationIssuerMaxLength')),
      issued_date: yup.date()
        .max(new Date(), t('validation.employee.certificationIssuedDateFuture')),
      expiry_date: yup.date()
        .min(yup.ref('issued_date'), t('validation.employee.certificationExpiryAfterIssued')),
    }),
  ).max(10, t('validation.employee.certificationsMaxCount')),
})

export const employeeFiltersSchema = yup.object().shape({
  search: yup.string().max(100, t('validation.employee.searchMaxLength')),
  department: yup.string().max(100, t('validation.employee.departmentMaxLength')),
  position: yup.string().max(100, t('validation.employee.positionMaxLength')),
  status: yup.string().oneOf(['active', 'inactive', 'terminated'], t('validation.employee.statusInvalid')),
  page: yup.number().min(1, t('validation.employee.pageMin')),
  per_page: yup.number().min(1, t('validation.employee.perPageMin')).max(100, t('validation.employee.perPageMax')),
})
