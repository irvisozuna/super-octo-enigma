<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as yup from 'yup'
import { useContractStore } from '../../stores/contractStore'
import { useNotificacion } from '@/composables/useNotificacion'

/* Datos fiscales del titular (razón social, RFC, CP, régimen, uso de CFDI, correos, teléfono) que se envían a Aquasoft Comercial. */
interface Catalogo {
  rowid: string | number
  code: string
  libelle: string
}

const props = defineProps<{ abierto: boolean }>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'guardado': []
}>()

const { t } = useI18n()
const notificar = useNotificacion()
const store = useContractStore()
const guardando = ref(false)

const regimenes = ref<Catalogo[]>([])
const usosCfdi = ref<Catalogo[]>([])

// Catálogos ya vistos en la sesión, para no esperar a la API al abrir
try {
  const r = sessionStorage.getItem('fiscal_regimes')
  const u = sessionStorage.getItem('use_cfdi')
  if (r)
    regimenes.value = JSON.parse(r)
  if (u)
    usosCfdi.value = (JSON.parse(u) as Catalogo[]).map(i => ({ ...i, rowid: String(i.rowid) }))
}
catch {
  // sin caché de sesión: se cargan por la API
}

const esquema = yup.object({
  sat_cname: yup.string().required(t('support.fiscales.validacion.nombre')),
  sat_RFC: yup.string().required(t('support.fiscales.validacion.rfc')).matches(/^([A-ZÑ&]{3,4}) ?-?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?-?([A-Z\d]{2})([A\d])$/, t('support.fiscales.validacion.rfcInvalido')),
  sat_zip: yup.string().required(t('support.fiscales.validacion.cp')).matches(/^\d{5}$/, t('support.fiscales.validacion.cpInvalido')),
  emails: yup.string().required(t('support.fiscales.validacion.correo')).test('correos', t('support.fiscales.validacion.correoInvalido'), v => !v || v.split(';').map(e => e.trim()).every(e => /^[\w.%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(e))),
  phone: yup.string().required(t('support.fiscales.validacion.telefono')).matches(/^\d{10}$/, t('support.fiscales.validacion.telefonoInvalido')),
  fiscal_regime: yup.string().required(t('support.fiscales.validacion.regimen')),
  usecfdi: yup.string().required(t('support.fiscales.validacion.usoCfdi')),
})

function valoresDelContrato() {
  const s = store.item?.societe

  return {
    sat_cname: s?.sat_cname || '',
    sat_RFC: s?.sat_taxid || '',
    sat_zip: s?.sat_zip || '',
    fiscal_regime: s?.fiscal_regime ? String(s.fiscal_regime) : '',
    usecfdi: s?.usecfdi != null ? String(s.usecfdi) : '',
    emails: s?.emails || '',
    phone: s?.phone || '',
  }
}

const { handleSubmit, errors, resetForm } = useForm({ validationSchema: esquema, initialValues: valoresDelContrato() })

const { value: razonSocial } = useField<string>('sat_cname')
const { value: rfc } = useField<string>('sat_RFC')
const { value: codigoPostal } = useField<string>('sat_zip')
const { value: regimen } = useField<string>('fiscal_regime')
const { value: usoCfdi } = useField<string>('usecfdi')
const { value: correos } = useField<string>('emails')
const { value: telefono } = useField<string>('phone')

function alCargarRegimenes(lista: Catalogo[]) {
  regimenes.value = lista
}

function alCargarUsosCfdi(lista: Catalogo[]) {
  usosCfdi.value = lista.map(i => ({ ...i, rowid: String(i.rowid) }))
}

const enviar = handleSubmit(async valores => {
  guardando.value = true
  try {
    const respuesta = await store.createItem({
      account: store.item?.account,
      societe: { ...store.item?.societe, ...valores },
    } as never, '/updateFiscalData')

    notificar.exito((respuesta as { message?: string })?.message || t('support.fiscales.actualizados'))
    emit('update:abierto', false)
    emit('guardado')
  }
  catch (e) {
    notificar.error(e, t('support.fiscales.errorActualizar'))
  }
  finally {
    guardando.value = false
  }
})

watch(() => props.abierto, v => {
  if (v)
    resetForm({ values: valoresDelContrato() })
})
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.fiscales.titulo')"
    :subtitulo="store.item ? `${store.item.account} · ${store.item.nameuser}` : undefined"
    tamano="md"
    :cargando="guardando"
    :texto-confirmar="t('save')"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
    @confirmar="enviar"
  >
    <VForm @submit.prevent="enviar">
      <VRow dense>
        <VCol cols="12">
          <VTextField
            v-model="razonSocial"
            :label="t('support.fiscales.razonSocial')"
            :aria-label="t('support.fiscales.razonSocial')"
            density="compact"
            autofocus
            :error-messages="errors.sat_cname"
          />
        </VCol>
        <VCol
          cols="12"
          md="7"
        >
          <VTextField
            v-model="rfc"
            :label="t('support.fiscales.rfc')"
            :aria-label="t('support.fiscales.rfc')"
            density="compact"
            class="text-uppercase"
            :error-messages="errors.sat_RFC"
          />
        </VCol>
        <VCol
          cols="12"
          md="5"
        >
          <VTextField
            v-model="codigoPostal"
            :label="t('support.fiscales.codigoPostal')"
            :aria-label="t('support.fiscales.codigoPostal')"
            density="compact"
            inputmode="numeric"
            maxlength="5"
            :error-messages="errors.sat_zip"
          />
        </VCol>
        <VCol cols="12">
          <ApiDataSource
            api-path="supports/getFiscalRegime"
            @loaded="alCargarRegimenes"
          >
            <template #default="{ loading }">
              <VSelect
                v-model="regimen"
                :items="regimenes"
                item-title="libelle"
                item-value="code"
                :label="t('support.fiscales.regimen')"
                :aria-label="t('support.fiscales.regimen')"
                density="compact"
                clearable
                :loading="loading"
                :disabled="loading"
                :error-messages="errors.fiscal_regime"
              />
            </template>
          </ApiDataSource>
        </VCol>
        <VCol cols="12">
          <ApiDataSource
            api-path="supports/getUseCfdi"
            @loaded="alCargarUsosCfdi"
          >
            <template #default="{ loading }">
              <VSelect
                v-model="usoCfdi"
                :items="usosCfdi"
                item-title="libelle"
                item-value="rowid"
                :label="t('support.fiscales.usoCfdi')"
                :aria-label="t('support.fiscales.usoCfdi')"
                density="compact"
                clearable
                :loading="loading"
                :disabled="loading"
                :error-messages="errors.usecfdi"
              />
            </template>
          </ApiDataSource>
        </VCol>
        <VCol
          cols="12"
          md="7"
        >
          <VTextField
            v-model="correos"
            :label="t('support.fiscales.correos')"
            :aria-label="t('support.fiscales.correos')"
            density="compact"
            type="email"
            multiple
            :error-messages="errors.emails"
          />
        </VCol>
        <VCol
          cols="12"
          md="5"
        >
          <VTextField
            v-model="telefono"
            :label="t('support.fiscales.telefono')"
            :aria-label="t('support.fiscales.telefono')"
            density="compact"
            inputmode="tel"
            maxlength="10"
            :error-messages="errors.phone"
          />
        </VCol>
      </VRow>
    </VForm>
  </AsDialogo>
</template>
