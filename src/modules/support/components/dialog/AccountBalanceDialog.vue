<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '../../stores/contractStore'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/* Estado de cuenta del contrato en PDF (lo genera Aquasoft Comercial): visor con descarga. */
const props = defineProps<{ abierto: boolean }>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
}>()

const { t } = useI18n()
const store = useContractStore()
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const pdf = ref('')

const cuenta = computed(() => store.item?.account ?? '')
const nombreArchivo = computed(() => `estado-cuenta-${cuenta.value}.pdf`)

async function cargar() {
  if (!cuenta.value)
    return
  cargando.value = true
  error.value = null
  pdf.value = ''
  try {
    const base64 = await store.getPdFBalance(cuenta.value)

    pdf.value = `data:application/pdf;base64,${base64}`
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

watch(() => props.abierto, v => {
  if (v)
    cargar()
  else
    pdf.value = ''
})
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="t('support.saldo.titulo')"
    :subtitulo="cuenta"
    tamano="lg"
    variante="informativo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
  >
    <AsEstado
      v-if="cargando"
      tipo="cargando"
      esqueleto="tarjeta"
      :filas="3"
    />
    <AsEstado
      v-else-if="error"
      tipo="error"
      :error="error"
      :detalle="t('support.saldo.error')"
      @reintentar="cargar"
    />
    <iframe
      v-else-if="pdf"
      :src="pdf"
      :title="t('support.saldo.visor')"
      class="saldo__visor"
    />

    <template #acciones-inicio>
      <AsBtnSecundario
        prepend-icon="tabler-download"
        :href="pdf"
        :download="nombreArchivo"
        :disabled="!pdf"
      >
        {{ t('support.saldo.descargar') }}
      </AsBtnSecundario>
    </template>
  </AsDialogo>
</template>

<style scoped>
.saldo__visor {
  display: block;
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  block-size: 70vh;
  inline-size: 100%;
}
</style>
