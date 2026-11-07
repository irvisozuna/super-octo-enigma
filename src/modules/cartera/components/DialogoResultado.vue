<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Opcion, ResultadoNotificacion } from '../types/cartera'
import { hoyLocal } from '@/utils/formato'

/*
 * Captura del resultado, de una notificación o de varias a la vez (mismo resultado, fecha y observación).
 * La fecha va entre la emisión y hoy; el servidor la vuelve a validar.
 */
const props = defineProps<{
  abierto: boolean
  titulo: string
  resultados: Opcion<ResultadoNotificacion>[]
  cargando?: boolean

  /** Día de emisión más antiguo (AAAA-MM-DD): no se acepta una fecha anterior. */
  minimo?: string | null
}>()

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'confirmar': [datos: { resultado: ResultadoNotificacion; fecha: string; observacion: string | null }]
}>()

const { t } = useI18n()
const resultado = ref<ResultadoNotificacion | null>(null)
const fecha = ref(hoyLocal())
const observacion = ref('')

watch(() => props.abierto, abierto => {
  if (abierto) {
    resultado.value = null
    fecha.value = hoyLocal()
    observacion.value = ''
  }
})

const opciones = computed(() => props.resultados.map(r => ({ value: r.codigo, title: r.nombre })))
const fechaValida = computed(() => !!fecha.value && fecha.value <= hoyLocal() && (!props.minimo || fecha.value >= props.minimo))
const listo = computed(() => !!resultado.value && fechaValida.value)

function confirmar() {
  if (listo.value && resultado.value)
    emit('confirmar', { resultado: resultado.value, fecha: fecha.value, observacion: observacion.value.trim() || null })
}
</script>

<template>
  <AsDialogo
    :abierto="abierto"
    :titulo="titulo"
    tamano="sm"
    :cargando="cargando"
    :texto-confirmar="t('cartera.captura.guardar')"
    :desactivar-confirmar="!listo"
    @update:abierto="(v: boolean) => emit('update:abierto', v)"
    @confirmar="confirmar"
  >
    <VSelect
      v-model="resultado"
      :items="opciones"
      :label="t('cartera.captura.resultado')"
      class="mb-3"
    />
    <VTextField
      v-model="fecha"
      type="date"
      :label="t('cartera.captura.fecha')"
      :min="minimo ?? undefined"
      :max="hoyLocal()"
      :hint="t('cartera.captura.fechaAyuda')"
      persistent-hint
      :error="!fechaValida"
      class="mb-3"
    />
    <VTextarea
      v-model="observacion"
      :label="t('cartera.captura.observacion')"
      rows="2"
      auto-grow
      counter="1000"
      maxlength="1000"
    />
    <slot />
  </AsDialogo>
</template>
