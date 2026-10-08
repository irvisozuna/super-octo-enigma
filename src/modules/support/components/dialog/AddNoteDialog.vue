<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '../../stores/contractStore'
import { useNotificacion } from '@/composables/useNotificacion'

/*
 * Nota de atención del contrato (asunto del catálogo + descripción). Con `obligatoria`, el diálogo es persistente y
 * solo un administrador puede cerrarlo sin guardar: sirve para exigir la bitácora de una atención.
 */
const props = defineProps<{
  abierto: boolean
  obligatoria?: boolean
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'guardado': []
}>()

const { t } = useI18n()
const notificar = useNotificacion()
const store = useContractStore()
const { aquasoft_id: usuarioAquasoft, name: nombreUsuario } = (useCookie('userData').value ?? {}) as { aquasoft_id?: string; name?: string }

const esAdmin = computed(() => nombreUsuario === 'admin')
const puedeCancelar = computed(() => !props.obligatoria || esAdmin.value)
const guardando = ref(false)
const nota = reactive({ subject: '', content: '' })

const tipos = computed(() => [
  { value: 'info', title: t('general_info_query') },
  { value: 'balance', title: t('balance_clarification') },
  { value: 'adjustment', title: t('adjustment_request') },
  { value: 'agreement', title: t('agreements') },
  { value: 'complaint', title: t('complaints_comments') },
  { value: 'leak', title: t('leak_report') },
  { value: 'work_order', title: t('work_order') },
  { value: 'debt_letter', title: t('no_debt_letter') },
  { value: 'error_reading', title: t('error_reading') },
])

const valido = computed(() => !!nota.subject && nota.content.trim().length > 0)

watch(() => props.abierto, v => {
  if (v) {
    nota.subject = ''
    nota.content = ''
  }
})

function cerrar() {
  emit('update:abierto', false)
}

async function guardar() {
  if (!usuarioAquasoft) {
    notificar.error(t('support.cargo.sinSesion'))

    return
  }
  guardando.value = true
  try {
    await store.createNote({ subject: nota.subject, content: nota.content.trim(), account: store.item?.id_account, user_id: usuarioAquasoft }, '/notes')
    notificar.exito(t('support.nota.creada'))
    cerrar()
    emit('guardado')
  }
  catch (e) {
    notificar.error(e, t('support.nota.errorCrear'))
  }
  finally {
    guardando.value = false
  }
}
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.nota.titulo')"
    :subtitulo="store.item ? `${store.item.account} · ${store.item.nameuser}` : undefined"
    tamano="sm"
    :persistente="!puedeCancelar"
    :cargando="guardando"
    @update:abierto="(v: boolean) => { if (!v && puedeCancelar) cerrar() }"
  >
    <VForm
      class="d-flex flex-column gap-4"
      @submit.prevent="valido && guardar()"
    >
      <VSelect
        v-model="nota.subject"
        :items="tipos"
        :label="t('support.nota.asunto')"
        :aria-label="t('support.nota.asunto')"
        density="compact"
        hide-details
        autofocus
      />
      <VTextarea
        v-model="nota.content"
        :label="t('support.nota.contenido')"
        :aria-label="t('support.nota.contenido')"
        density="compact"
        rows="4"
        auto-grow
        hide-details
      />
      <p
        v-if="!puedeCancelar"
        class="as-secundario text-warning mb-0"
      >
        {{ t('support.nota.obligatoria') }}
      </p>
    </VForm>

    <template #acciones>
      <VBtn
        v-if="puedeCancelar"
        variant="text"
        :disabled="guardando"
        @click="cerrar"
      >
        {{ t('as.dialogo.cancelar') }}
      </VBtn>
      <AsBtnPrimario
        :loading="guardando"
        :disabled="!valido"
        @click="guardar"
      >
        {{ t('save') }}
      </AsBtnPrimario>
    </template>
  </AsDialogo>
</template>
