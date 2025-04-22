<script setup lang="ts">
import { ref } from 'vue'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { useContractStore } from '../../stores/contractStore'
import { useNotification } from '@/helpers/notificationHelper'

// Interfaces para los catálogos
interface CfdiUse {
  rowid: string
  code: string
  libelle: string
}
interface FiscalRegime {
  rowid: string | number
  code: string
  libelle: string
}

// Helpers y store
const { showSuccess, showError } = useNotification()
const { closeDialog } = useAppManager()
const contractStore = useContractStore()
const isLoading = ref(false)

// Opciones para los VSelect
const fiscalRegimeOptions = ref<FiscalRegime[]>([])
const useCfdiOptions = ref<CfdiUse[]>([])

// Carga inicial desde sessionStorage (si aplica)
const loadFromSession = () => {
  try {
    const sReg = sessionStorage.getItem('fiscal_regimes')
    const sCfdi = sessionStorage.getItem('use_cfdi')
    if (sReg)
      fiscalRegimeOptions.value = JSON.parse(sReg)
    if (sCfdi) {
      useCfdiOptions.value = JSON.parse(sCfdi).map((i: any) => ({
        ...i,
        rowid: String(i.rowid),
      }))
    }
  }
  catch (err) {
    console.error('Error loading from session:', err)
  }
}

loadFromSession()

// Esquema de validación
const schema = yup.object({
  sat_cname: yup.string().required('El nombre es requerido'),
  sat_RFC: yup
    .string()
    .required('El RFC es requerido')
    .matches(
      /^([A-ZÑ&]{3,4}) ?-?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?-?([A-Z\d]{2})([A\d])$/,
      'RFC inválido',
    ),
  sat_zip: yup
    .string()
    .required('El código postal es requerido')
    .matches(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  emails: yup
    .string()
    .required('El email es requerido')
    .test('is-valid-emails', 'Uno o más emails son inválidos', val => {
      if (!val)
        return true

      return val
        .split(';')
        .map(e => e.trim())
        .every(e => /^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(e))
    }),
  phone: yup
    .string()
    .required('El teléfono es requerido')
    .matches(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
  fiscal_regime: yup.string().required('El régimen fiscal es requerido'),
  usecfdi: yup.string().required('El uso de CFDI es requerido'),
})

// Formulario & campos
const { handleSubmit: submitForm, errors } = useForm({
  validationSchema: schema,
  initialValues: {
    sat_cname: contractStore.item?.societe?.sat_cname || '',
    sat_RFC: contractStore.item?.societe?.sat_taxid || '',
    sat_zip: contractStore.item?.societe?.sat_zip || '',
    fiscal_regime: contractStore.item?.societe?.fiscal_regime || '',
    usecfdi: String(contractStore.item?.societe?.usecfdi || ''),
    emails: contractStore.item?.societe?.emails || '',
    phone: contractStore.item?.societe?.phone || '',
  },
})

const { value: sat_cname } = useField<string>('sat_cname')
const { value: sat_RFC } = useField<string>('sat_RFC')
const { value: sat_zip } = useField<string>('sat_zip')
const { value: fiscal_regime } = useField<string>('fiscal_regime')
const { value: usecfdi } = useField<string>('usecfdi')
const { value: emails } = useField<string>('emails')
const { value: phone } = useField<string>('phone')

// Handlers para cargar y re-asignar valores
function onFiscalRegimesLoaded(list: FiscalRegime[]) {
  fiscalRegimeOptions.value = list

  const current = contractStore.item?.societe?.fiscal_regime
  if (current)
    fiscal_regime.value = String(current)
}

function onUseCfdiLoaded(list: (CfdiUse & { rowid: string | number })[]) {
  useCfdiOptions.value = list.map(i => ({ ...i, rowid: String(i.rowid) }))

  const current = contractStore.item?.societe?.usecfdi
  if (current != null)
    usecfdi.value = String(current)
}

// Envío
const onSubmit = submitForm(async () => {
  try {
    isLoading.value = true

    const payload = {
      account: contractStore.item?.account,
      societe: {
        ...contractStore.item?.societe,
        sat_cname: sat_cname.value,
        sat_RFC: sat_RFC.value,
        sat_zip: sat_zip.value,
        fiscal_regime: fiscal_regime.value,
        usecfdi: usecfdi.value,
        emails: emails.value,
        phone: phone.value,
      },
    }

    const response = await contractStore.createItem(payload, '/updateFiscalData')

    showSuccess(response.message || 'Datos fiscales actualizados correctamente')
    closeDialog('submit')
  }
  catch (err: any) {
    showError(`Error al actualizar los datos fiscales: ${err.message || 'Error desconocido'}`)
    console.error('Error details:', err)
  }
  finally {
    isLoading.value = false
  }
})
</script>

<template>
  <DialogCloseBtn @click="closeDialog" />

  <VCard>
    <VCardTitle class="headline">
      {{ $t('fiscal_data') }}
    </VCardTitle>

    <VCardText>
      <VForm @submit.prevent="onSubmit">
        <VRow>
          <!-- Nombre / Razón social -->
          <VCol cols="12">
            <VTextField
              v-model="sat_cname"
              :label="$t('business_name')"
              variant="outlined"
              :error-messages="errors.sat_cname"
            />
          </VCol>

          <!-- RFC -->
          <VCol cols="12">
            <VTextField
              v-model="sat_RFC"
              :label="$t('tax_id')"
              variant="outlined"
              :error-messages="errors.sat_RFC"
            />
          </VCol>

          <!-- Código Postal -->
          <VCol cols="12">
            <VTextField
              v-model="sat_zip"
              :label="$t('postal_code')"
              variant="outlined"
              :error-messages="errors.sat_zip"
            />
          </VCol>

          <!-- Régimen Fiscal -->
          <VCol cols="12">
            <ApiDataSource
              api-path="supports/getFiscalRegime"
              @loaded="onFiscalRegimesLoaded"
            >
              <template #default="{ loading }">
                <VSelect
                  v-model="fiscal_regime"
                  :items="fiscalRegimeOptions"
                  item-title="libelle"
                  item-value="code"
                  :label="$t('fiscal_regime')"
                  dense
                  clearable
                  :hint="loading ? $t('loading') : ''"
                  :loading="loading"
                  :error="!!errors.fiscal_regime"
                  :error-messages="errors.fiscal_regime"
                  :disabled="loading"
                />
              </template>
            </ApiDataSource>
          </VCol>

          <!-- Uso de CFDI -->
          <VCol cols="12">
            <ApiDataSource
              api-path="supports/getUseCfdi"
              @loaded="onUseCfdiLoaded"
            >
              <template #default="{ loading }">
                <VSelect
                  v-model="usecfdi"
                  :items="useCfdiOptions"
                  item-title="libelle"
                  item-value="rowid"
                  :label="$t('usecfdi')"
                  dense
                  clearable
                  :hint="loading ? $t('loading') : ''"
                  :loading="loading"
                  :error="!!errors.usecfdi"
                  :error-messages="errors.usecfdi"
                  :disabled="loading"
                />
              </template>
            </ApiDataSource>
          </VCol>

          <!-- Emails -->
          <VCol cols="12">
            <VTextField
              v-model="emails"
              :label="$t('email')"
              variant="outlined"
              type="email"
              :error-messages="errors.emails"
            />
          </VCol>

          <!-- Teléfono -->
          <VCol cols="12">
            <VTextField
              v-model="phone"
              :label="$t('phone')"
              variant="outlined"
              :error-messages="errors.phone"
            />
          </VCol>
        </VRow>
      </VForm>
    </VCardText>

    <VCardActions>
      <VSpacer />
      <VBtn
        variant="flat"
        color="secondary"
        :disabled="isLoading"
        :loading="isLoading"
        @click="closeDialog"
      >
        {{ $t('cancel') }}
      </VBtn>
      <VBtn
        variant="flat"
        color="primary"
        :disabled="isLoading"
        :loading="isLoading"
        @click="onSubmit"
      >
        {{ $t('save') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
