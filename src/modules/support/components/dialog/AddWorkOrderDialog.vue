<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '../../stores/contractStore'
import { useWorkOrderValidation } from '../../validations/WorkOrderValidation'
import { useNotificacion } from '@/composables/useNotificacion'
import { COLOR_PRIORIDAD_ORDEN } from '@/utils/estados'

/* Alta de una orden de trabajo (ticket) del contrato en Aquasoft Comercial, con adjuntos. Validación con vee-validate + yup. */
interface Opcion {
  rowid: number | string
  name: string
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

const entidades = ref<Opcion[]>([])
const tipos = ref<Opcion[]>([])
const usuarios = ref<Opcion[]>([])
const prioridades = computed(() => Object.keys(COLOR_PRIORIDAD_ORDEN).map(v => ({ value: v, title: t(`support.orden.prioridades.${v}`) })))

const valoresIniciales = {
  source_entity: null as number | string | null,
  type_code: null as number | string | null,
  severity_code: 'NORMAL',
  fk_user_assign: null as number | string | null,
  options_area: '',
  options_department: '',
  options_reported_by: '',
  options_phone: '',
  subject: '',
  message: '',
  options_observations: '',
  files: [] as File[],
}

const { handleSubmit, errors, resetForm } = useForm({
  validationSchema: useWorkOrderValidation(),
  validateOnMount: false,
  initialValues: valoresIniciales,
})

const { value: entidad } = useField<number | string | null>('source_entity')
const { value: tipo } = useField<number | string | null>('type_code')
const { value: prioridad } = useField<string>('severity_code')
const { value: asignado } = useField<number | string | null>('fk_user_assign')
const { value: area } = useField<string>('options_area')
const { value: departamento } = useField<string>('options_department')
const { value: reportadoPor } = useField<string>('options_reported_by')
const { value: telefono } = useField<string>('options_phone')
const { value: asunto } = useField<string>('subject')
const { value: mensaje } = useField<string>('message')
const { value: observaciones } = useField<string>('options_observations')
const { value: archivos } = useField<File[]>('files')

const enviar = handleSubmit(async valores => {
  guardando.value = true
  try {
    const datos = new FormData()

    const campos: Record<string, unknown> = {
      source_entity: valores.source_entity,
      type_code: valores.type_code,
      severity_code: valores.severity_code,
      fk_user_assign: valores.fk_user_assign,
      options_area: valores.options_area,
      options_department: valores.options_department,
      options_reported_by: valores.options_reported_by,
      options_phone: valores.options_phone,
      subject: valores.subject,
      message: valores.message,
      options_observations: valores.options_observations,
      token: useCookie('dolibarrToken').value,
      account: store.item?.account,
    }

    for (const [k, v] of Object.entries(campos))
      datos.append(k, v === null || v === undefined ? '' : String(v))
    for (const archivo of valores.files ?? [])
      datos.append('files[]', archivo)

    const respuesta = await store.createItem(datos, '/workOrders')

    notificar.exito((respuesta as { message?: string })?.message || t('support.orden.creada'))
    emit('update:abierto', false)
    emit('guardado')
  }
  catch (e) {
    notificar.error(e, t('support.orden.errorCrear'))
  }
  finally {
    guardando.value = false
  }
})

watch(() => props.abierto, v => {
  if (v)
    resetForm({ values: valoresIniciales })
})
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.orden.titulo')"
    :subtitulo="store.item ? `${store.item.account} · ${store.item.nameuser}` : undefined"
    tamano="lg"
    :cargando="guardando"
    :texto-confirmar="t('save')"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
    @confirmar="enviar"
  >
    <VForm @submit.prevent="enviar">
      <VRow dense>
        <VCol
          cols="12"
          md="5"
        >
          <ApiDataSource
            api-path="supports/getSourceEntities?itemsPerPage=1000&page=1"
            @loaded="(r: Opcion[]) => { entidades = r }"
          >
            <template #default="{ loading }">
              <VSelect
                v-model="entidad"
                :items="entidades"
                item-title="name"
                item-value="rowid"
                :label="t('support.orden.entidad')"
                :aria-label="t('support.orden.entidad')"
                density="compact"
                clearable
                :loading="loading"
                :disabled="loading"
                :error-messages="errors.source_entity"
              />
            </template>
          </ApiDataSource>
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <ApiDataSource
            api-path="supports/getTypeCodes?itemsPerPage=1000&page=1"
            @loaded="(r: Opcion[]) => { tipos = r }"
          >
            <template #default="{ loading }">
              <VAutocomplete
                v-model="tipo"
                :items="tipos"
                item-title="name"
                item-value="rowid"
                :label="t('support.orden.tipo')"
                :aria-label="t('support.orden.tipo')"
                density="compact"
                clearable
                :loading="loading"
                :disabled="loading"
                :error-messages="errors.type_code"
              />
            </template>
          </ApiDataSource>
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <VSelect
            v-model="prioridad"
            :items="prioridades"
            :label="t('support.orden.prioridad')"
            :aria-label="t('support.orden.prioridad')"
            density="compact"
            :error-messages="errors.severity_code"
          />
        </VCol>
        <VCol
          cols="12"
          md="5"
        >
          <ApiDataSource
            api-path="supports/getUsers?itemsPerPage=100000&page=1"
            @loaded="(r: Opcion[]) => { usuarios = r }"
          >
            <template #default="{ loading }">
              <VAutocomplete
                v-model="asignado"
                :items="usuarios"
                item-title="name"
                item-value="rowid"
                :label="t('support.orden.asignado')"
                :aria-label="t('support.orden.asignado')"
                :placeholder="t('support.orden.asignadoAyuda')"
                density="compact"
                clearable
                :loading="loading"
                :disabled="loading"
                :error-messages="errors.fk_user_assign"
              />
            </template>
          </ApiDataSource>
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VTextField
            v-model="area"
            :label="t('support.orden.area')"
            :aria-label="t('support.orden.area')"
            density="compact"
            :error-messages="errors.options_area"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <VTextField
            v-model="departamento"
            :label="t('support.orden.departamento')"
            :aria-label="t('support.orden.departamento')"
            density="compact"
            :error-messages="errors.options_department"
          />
        </VCol>
        <VCol
          cols="12"
          md="8"
        >
          <VTextField
            v-model="reportadoPor"
            :label="t('support.orden.reportadoPor')"
            :aria-label="t('support.orden.reportadoPor')"
            density="compact"
            :error-messages="errors.options_reported_by"
          />
        </VCol>
        <VCol
          cols="12"
          md="4"
        >
          <VTextField
            v-model="telefono"
            :label="t('support.orden.telefono')"
            :aria-label="t('support.orden.telefono')"
            density="compact"
            inputmode="tel"
            :error-messages="errors.options_phone"
          />
        </VCol>
        <VCol cols="12">
          <VTextField
            v-model="asunto"
            :label="t('support.orden.asunto')"
            :aria-label="t('support.orden.asunto')"
            density="compact"
            :error-messages="errors.subject"
          />
        </VCol>
        <VCol cols="12">
          <VTextarea
            v-model="mensaje"
            :label="t('support.orden.mensaje')"
            :aria-label="t('support.orden.mensaje')"
            :hint="t('support.orden.ayudaMensaje')"
            persistent-hint
            density="compact"
            rows="3"
            auto-grow
            :error-messages="errors.message"
          />
        </VCol>
        <VCol cols="12">
          <VTextarea
            v-model="observaciones"
            :label="t('support.orden.observaciones')"
            :aria-label="t('support.orden.observaciones')"
            density="compact"
            rows="2"
            auto-grow
            :error-messages="errors.options_observations"
          />
        </VCol>
        <VCol cols="12">
          <VFileInput
            v-model="archivos"
            :label="t('support.orden.archivos')"
            :aria-label="t('support.orden.archivos')"
            density="compact"
            multiple
            chips
            prepend-icon=""
            prepend-inner-icon="tabler-paperclip"
            :error-messages="errors.files"
          />
        </VCol>
      </VRow>
    </VForm>
  </AsDialogo>
</template>
