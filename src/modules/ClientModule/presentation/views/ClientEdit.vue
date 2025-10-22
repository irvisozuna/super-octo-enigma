<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useClientStore } from '../stores/clientStore'
import type { UpdateClientRequest } from '../../domain/entities/ClientEntity'
import { useNotification } from '@/helpers/notificationHelper'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const clientStore = useClientStore()
const { showSuccess, showError } = useNotification()

// Validation schema
const schema = yup.object({
  business_type: yup
    .string()
    .required('El tipo de negocio es requerido'),
  business_name: yup
    .string()
    .required('El nombre del negocio es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre no puede exceder 255 caracteres'),
  trade_name: yup
    .string()
    .notRequired()
    .max(255, 'El nombre comercial no puede exceder 255 caracteres'),
  industry: yup
    .string()
    .required('La industria es requerida')
    .max(100, 'La industria no puede exceder 100 caracteres'),
  website: yup
    .string()
    .notRequired()
    .url('Debe ser una URL válida')
    .max(255, 'El sitio web no puede exceder 255 caracteres'),
  logo_url: yup
    .string()
    .notRequired()
    .url('Debe ser una URL válida')
    .max(500, 'La URL del logo no puede exceder 500 caracteres'),
  primary_email: yup
    .string()
    .required('El email principal es requerido')
    .email('Formato de email inválido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  secondary_email: yup
    .string()
    .notRequired()
    .email('Formato de email inválido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  primary_phone: yup
    .string()
    .required('El teléfono principal es requerido')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  secondary_phone: yup
    .string()
    .notRequired()
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  address_line_1: yup
    .string()
    .required('La dirección es requerida')
    .max(255, 'La dirección no puede exceder 255 caracteres'),
  address_line_2: yup
    .string()
    .notRequired()
    .max(255, 'La dirección no puede exceder 255 caracteres'),
  city: yup
    .string()
    .required('La ciudad es requerida')
    .max(100, 'La ciudad no puede exceder 100 caracteres'),
  state: yup
    .string()
    .required('El estado es requerido')
    .max(100, 'El estado no puede exceder 100 caracteres'),
  postal_code: yup
    .string()
    .required('El código postal es requerido')
    .max(20, 'El código postal no puede exceder 20 caracteres'),
  country: yup
    .string()
    .notRequired()
    .max(100, 'El país no puede exceder 100 caracteres'),
  billing_address_line_1: yup
    .string()
    .notRequired()
    .max(255, 'La dirección de facturación no puede exceder 255 caracteres'),
  billing_address_line_2: yup
    .string()
    .notRequired()
    .max(255, 'La dirección de facturación no puede exceder 255 caracteres'),
  billing_city: yup
    .string()
    .notRequired()
    .max(100, 'La ciudad de facturación no puede exceder 100 caracteres'),
  billing_state: yup
    .string()
    .notRequired()
    .max(100, 'El estado de facturación no puede exceder 100 caracteres'),
  billing_postal_code: yup
    .string()
    .notRequired()
    .max(20, 'El código postal de facturación no puede exceder 20 caracteres'),
  billing_country: yup
    .string()
    .notRequired()
    .max(100, 'El país de facturación no puede exceder 100 caracteres'),
  tax_id: yup
    .string()
    .required('El RFC/Tax ID es requerido')
    .max(20, 'El RFC no puede exceder 20 caracteres')
    .test('is-valid-rfc', 'RFC inválido', val => {
      if (!val || val.trim() === '')
        return true

      return /^([A-ZÑ&]{3,4})\d{6}([A-Z0-9]{3})$/.test(val.toUpperCase())
    }),
  tax_regime: yup.string().notRequired(),
  cfdi_use: yup.string().notRequired(),
  payment_terms: yup
    .string()
    .notRequired(),
  payment_methods: yup
    .array()
    .notRequired()
    .min(1, 'Debe seleccionar al menos un método de pago'),
  credit_limit: yup
    .number()
    .notRequired()
    .min(0, 'El límite de crédito debe ser mayor o igual a 0')
    .transform((value, originalValue) => {
      return originalValue === '' ? undefined : value
    }),
  credit_limit_currency: yup
    .string()
    .notRequired()
    .length(3, 'La moneda debe tener 3 caracteres'),
  notes: yup.string().notRequired(),
  tags: yup.array().notRequired(),
})

// Form setup
const { handleSubmit, errors, meta, setValues } = useForm({
  validationSchema: schema,
  initialValues: {
    business_type: 'company',
    business_name: '',
    trade_name: '',
    industry: '',
    website: '',
    logo_url: '',
    primary_email: '',
    secondary_email: '',
    primary_phone: '',
    secondary_phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'México',
    billing_address_line_1: '',
    billing_address_line_2: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    billing_country: '',
    tax_id: '',
    tax_regime: undefined,
    cfdi_use: undefined,
    payment_terms: 'immediate',
    payment_methods: ['cash'],
    credit_limit: 0,
    credit_limit_currency: 'MXN',
    notes: '',
    tags: [],
  } as UpdateClientRequest,
})

// Form fields
const { value: business_type } = useField<string>('business_type')
const { value: business_name } = useField<string>('business_name')
const { value: trade_name } = useField<string>('trade_name')
const { value: industry } = useField<string>('industry')
const { value: website } = useField<string>('website')
const { value: logo_url } = useField<string>('logo_url')
const { value: primary_email } = useField<string>('primary_email')
const { value: secondary_email } = useField<string>('secondary_email')
const { value: primary_phone } = useField<string>('primary_phone')
const { value: secondary_phone } = useField<string>('secondary_phone')
const { value: address_line_1 } = useField<string>('address_line_1')
const { value: address_line_2 } = useField<string>('address_line_2')
const { value: city } = useField<string>('city')
const { value: state } = useField<string>('state')
const { value: postal_code } = useField<string>('postal_code')
const { value: country } = useField<string>('country')
const { value: billing_address_line_1 } = useField<string>('billing_address_line_1')
const { value: billing_address_line_2 } = useField<string>('billing_address_line_2')
const { value: billing_city } = useField<string>('billing_city')
const { value: billing_state } = useField<string>('billing_state')
const { value: billing_postal_code } = useField<string>('billing_postal_code')
const { value: billing_country } = useField<string>('billing_country')
const { value: tax_id } = useField<string>('tax_id')
const { value: tax_regime } = useField<string | undefined>('tax_regime')
const { value: cfdi_use } = useField<string | undefined>('cfdi_use')
const { value: payment_terms } = useField<string>('payment_terms')
const { value: payment_methods } = useField<string[]>('payment_methods')
const { value: credit_limit } = useField<number>('credit_limit')
const { value: credit_limit_currency } = useField<string>('credit_limit_currency')
const { value: notes } = useField<string>('notes')
const { value: tags } = useField<string[]>('tags')

const loading = computed(() => clientStore.loading)

async function loadClient() {
  const id = route.params.id as string

  try {
    await clientStore.fetchById(id)

    const client = clientStore.currentItem
    if (client) {
      console.log(client)
      setValues({
        business_type: client.business_type,
        business_name: client.business_name,
        trade_name: client.trade_name,
        industry: client.industry,
        website: client.website,
        logo_url: client.logo_url,
        primary_email: client.primary_email,
        secondary_email: client.secondary_email,
        primary_phone: client.primary_phone,
        secondary_phone: client.secondary_phone,
        address_line_1: client.address_line_1,
        address_line_2: client.address_line_2,
        city: client.city,
        state: client.state,
        postal_code: client.postal_code,
        country: client.country,
        billing_address_line_1: client.billing_address_line_1,
        billing_address_line_2: client.billing_address_line_2,
        billing_city: client.billing_city,
        billing_state: client.billing_state,
        billing_postal_code: client.billing_postal_code,
        billing_country: client.billing_country,
        tax_id: client.tax_id,
        tax_regime: client.tax_regime,
        cfdi_use: client.cfdi_use,
        payment_terms: client.payment_terms,
        payment_methods: client.payment_methods,
        credit_limit: client.credit_limit?.amount,
        credit_limit_currency: client.credit_limit?.currency ?? 'MXN',
        notes: client.notes,
        tags: client.tags,
      })
    }
  }
  catch (error) {
    console.error('Error loading client:', error)
    router.push({ name: 'clients-list' })
  }
}

// Submit handler
const onSubmit = handleSubmit(async values => {
  const id = route.params.id as string
  if (!id)
    return

  try {
    await clientStore.updateItem(id, values)
    showSuccess('Cliente actualizado exitosamente')
    router.push({ name: 'clients-detail', params: { id } })
  }
  catch (error: any) {
    console.error('Error updating client:', error)
    showError(error?.message || 'Error al actualizar el cliente')
  }
})

function handleSubmitAttempt() {
  if (!meta.value.valid) {
    showError('Por favor, corrija los errores en el formulario')

    return
  }
  onSubmit()
}

function cancel() {
  router.back()
}

onMounted(() => {
  loadClient()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <div class="d-flex align-center justify-space-between">
        <h4 class="text-h4">
          {{ t('ClientModule.actions.edit') }}
        </h4>
        <VChip
          v-if="clientStore.currentItem"
          size="small"
          variant="tonal"
        >
          {{ clientStore.currentItem.client_code }}
        </VChip>
      </div>
    </VCardTitle>

    <VCardText>
      <VForm @submit.prevent="handleSubmitAttempt">
        <VRow>
          <!-- Business Type Selection -->
          <VCol cols="12">
            <h6 class="text-h6 mb-4">
              {{ t('ClientModule.sections.business_types') }}
            </h6>
          </VCol>

          <VCol cols="12">
            <VRadioGroup
              v-model="business_type"
              inline
              :error-messages="errors.business_type"
            >
              <VRadio
                value="company"
                label="Empresa"
              />
              <VRadio
                value="individual"
                label="Individual"
              />
              <VRadio
                value="government"
                label="Gobierno"
              />
              <VRadio
                value="ngo"
                label="ONG"
              />
            </VRadioGroup>
          </VCol>

          <!-- Basic Information -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              Información Básica
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="business_name"
              label="Nombre del Negocio *"
              variant="outlined"
              :error-messages="errors.business_name"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="trade_name"
              label="Nombre Comercial"
              variant="outlined"
              :error-messages="errors.trade_name"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="industry"
              label="Industria *"
              variant="outlined"
              :error-messages="errors.industry"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="website"
              label="Sitio Web"
              variant="outlined"
              placeholder="https://"
              :error-messages="errors.website"
            />
          </VCol>

          <VCol cols="12">
            <VTextField
              v-model="logo_url"
              label="URL del Logo"
              variant="outlined"
              placeholder="https://"
              :error-messages="errors.logo_url"
            />
          </VCol>

          <!-- Contact Information -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              Información de Contacto
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="primary_email"
              label="Email Principal *"
              type="email"
              variant="outlined"
              :error-messages="errors.primary_email"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="secondary_email"
              label="Email Secundario"
              type="email"
              variant="outlined"
              :error-messages="errors.secondary_email"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="primary_phone"
              label="Teléfono Principal *"
              variant="outlined"
              :error-messages="errors.primary_phone"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="secondary_phone"
              label="Teléfono Secundario"
              variant="outlined"
              :error-messages="errors.secondary_phone"
            />
          </VCol>

          <!-- Address -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              Dirección
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="8"
          >
            <VTextField
              v-model="address_line_1"
              label="Dirección Línea 1 *"
              variant="outlined"
              :error-messages="errors.address_line_1"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="address_line_2"
              label="Dirección Línea 2"
              variant="outlined"
              :error-messages="errors.address_line_2"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="city"
              label="Ciudad *"
              variant="outlined"
              :error-messages="errors.city"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="state"
              label="Estado *"
              variant="outlined"
              :error-messages="errors.state"
            />
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="postal_code"
              label="Código Postal *"
              variant="outlined"
              :error-messages="errors.postal_code"
            />
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="country"
              label="País"
              variant="outlined"
              :error-messages="errors.country"
            />
          </VCol>

          <!-- Billing Address -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              Dirección de Facturación (Opcional)
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="8"
          >
            <VTextField
              v-model="billing_address_line_1"
              label="Dirección de Facturación Línea 1"
              variant="outlined"
              :error-messages="errors.billing_address_line_1"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="billing_address_line_2"
              label="Línea 2"
              variant="outlined"
              :error-messages="errors.billing_address_line_2"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="billing_city"
              label="Ciudad"
              variant="outlined"
              :error-messages="errors.billing_city"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="billing_state"
              label="Estado"
              variant="outlined"
              :error-messages="errors.billing_state"
            />
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="billing_postal_code"
              label="CP"
              variant="outlined"
              :error-messages="errors.billing_postal_code"
            />
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="billing_country"
              label="País"
              variant="outlined"
              :error-messages="errors.billing_country"
            />
          </VCol>

          <!-- Tax Information (Mexico) -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              Información Fiscal
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="tax_id"
              label="RFC/Tax ID *"
              variant="outlined"
              maxlength="20"
              placeholder="XAXX010101000"
              :error-messages="errors.tax_id"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="tax_regime"
              label="Régimen Fiscal"
              :items="[
                { value: '601', title: '601 - General de Ley Personas Morales' },
                { value: '603', title: '603 - Personas Morales con Fines no Lucrativos' },
                { value: '605', title: '605 - Sueldos y Salarios e Ingresos Asimilados' },
                { value: '606', title: '606 - Arrendamiento' },
                { value: '608', title: '608 - Demás ingresos' },
                { value: '610', title: '610 - Residentes en el Extranjero' },
                { value: '611', title: '611 - Ingresos por Dividendos' },
                { value: '612', title: '612 - Personas Físicas con Actividades Empresariales' },
                { value: '614', title: '614 - Ingresos por intereses' },
                { value: '616', title: '616 - Sin obligaciones fiscales' },
                { value: '620', title: '620 - Sociedades Cooperativas de Producción' },
                { value: '621', title: '621 - Incorporación Fiscal' },
                { value: '622', title: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
                { value: '623', title: '623 - Opcional para Grupos de Sociedades' },
                { value: '624', title: '624 - Coordinados' },
                { value: '625', title: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
                { value: '626', title: '626 - Régimen Simplificado de Confianza' },
              ]"
              variant="outlined"
              clearable
              :error-messages="errors.tax_regime"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="cfdi_use"
              label="Uso de CFDI"
              :items="[
                { value: 'G01', title: 'G01 - Adquisición de mercancías' },
                { value: 'G02', title: 'G02 - Devoluciones, descuentos o bonificaciones' },
                { value: 'G03', title: 'G03 - Gastos en general' },
                { value: 'P01', title: 'P01 - Por definir' },
              ]"
              variant="outlined"
              clearable
              :error-messages="errors.cfdi_use"
            />
          </VCol>

          <!-- Business Terms -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              Términos Comerciales
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="payment_terms"
              label="Términos de Pago"
              :items="[
                { value: 'immediate', title: 'Inmediato' },
                { value: 'net_15', title: 'Neto 15 días' },
                { value: 'net_30', title: 'Neto 30 días' },
                { value: 'net_60', title: 'Neto 60 días' },
                { value: 'custom', title: 'Personalizado' },
              ]"
              variant="outlined"
              :error-messages="errors.payment_terms"
            />
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="payment_methods"
              label="Métodos de Pago"
              :items="[
                { value: 'cash', title: 'Efectivo' },
                { value: 'check', title: 'Cheque' },
                { value: 'bank_transfer', title: 'Transferencia Bancaria' },
                { value: 'credit_card', title: 'Tarjeta de Crédito' },
                { value: 'financing', title: 'Financiamiento' },
              ]"
              variant="outlined"
              multiple
              chips
              :error-messages="errors.payment_methods"
            />
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
          {{ client }}
            <VTextField
              v-model.number="credit_limit"
              label="Límite de Crédito"
              type="number"
              variant="outlined"
              prefix="$"
              :error-messages="errors.credit_limit"
            />
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="credit_limit_currency"
              label="Moneda"
              variant="outlined"
              maxlength="3"
              placeholder="MXN"
              :error-messages="errors.credit_limit_currency"
            />
          </VCol>

          <!-- Notes -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              Notas
            </h6>
          </VCol>

          <VCol cols="12">
            <VTextarea
              v-model="notes"
              label="Notas"
              variant="outlined"
              rows="3"
              :error-messages="errors.notes"
            />
          </VCol>
        </VRow>

        <!-- Actions -->
        <VRow class="mt-4">
          <VCol cols="12">
            <div class="d-flex gap-4 justify-end">
              <VBtn
                variant="outlined"
                @click="cancel"
              >
                Cancelar
              </VBtn>

              <VBtn
                type="submit"
                color="primary"
                :loading="loading"
              >
                Guardar
              </VBtn>
            </div>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>
