<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MensajeChat } from '../types'
import { agruparPasos, reloj, resumenPasos } from '../utils/pasos'

/*
 * Avance de una respuesta (XEL1-714). Mientras trabaja: reloj, lista de pasos con su estado (los repetidos van
 * agrupados) y la fase entre consultas, para que se note que sigue trabajando. Al terminar se pliega en una línea con
 * lo que hizo y cuánto tardó; se abre para ver los pasos.
 */
const props = defineProps<{ mensaje: MensajeChat }>()

const { t } = useI18n()
const ahora = ref(Date.now())
const abierto = ref(false)
let temporizador: ReturnType<typeof setInterval> | null = null

const trabajando = computed(() => props.mensaje.estado === 'transmitiendo')
const grupos = computed(() => agruparPasos(props.mensaje.pasos))
const transcurrido = computed(() => (props.mensaje.inicio ? ahora.value - props.mensaje.inicio : 0))
const resumen = computed(() => resumenPasos(props.mensaje.pasos, props.mensaje.duracionMs))
const escribiendo = computed(() => trabajando.value && props.mensaje.texto.length > 0)

/** Lo que está pasando ahora, para el encabezado y para lectores de pantalla. */
const fase = computed(() => {
  const enCurso = grupos.value.find(g => g.enCurso)
  if (enCurso)
    return enCurso.texto
  if (escribiendo.value)
    return t('asistente.progreso.escribiendo')
  if (props.mensaje.fase === 'analizando')
    return t('asistente.progreso.analizando')

  return grupos.value.length ? t('asistente.progreso.preparando') : t('asistente.progreso.entendiendo')
})

/** Línea en curso al final de la lista cuando ninguna herramienta está corriendo. */
const lineaEnCurso = computed(() => (trabajando.value && !grupos.value.some(g => g.enCurso) ? fase.value : null))

watch(trabajando, activo => {
  if (activo && !temporizador) {
    temporizador = setInterval(() => {
      ahora.value = Date.now()
    }, 1000)
  }
  else if (!activo && temporizador) {
    clearInterval(temporizador)
    temporizador = null
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (temporizador)
    clearInterval(temporizador)
})
</script>

<template>
  <div
    v-if="trabajando"
    class="progreso"
  >
    <div class="progreso__encabezado">
      <VProgressCircular
        indeterminate
        size="16"
        width="2"
        color="primary"
      />
      <span class="progreso__titulo">{{ t('asistente.progreso.trabajando') }}</span>
      <span
        class="progreso__reloj"
        :aria-label="t('asistente.progreso.tiempo', { tiempo: reloj(transcurrido) })"
      >{{ reloj(transcurrido) }}</span>
    </div>
    <p
      v-if="mensaje.nivel === 'analisis' && !escribiendo"
      class="progreso__aviso"
    >
      {{ t('asistente.progreso.avisoAnalisis') }}
    </p>
    <span
      class="d-sr-only"
      role="status"
      aria-live="polite"
    >{{ fase }}</span>
    <ol
      class="progreso__pasos"
      aria-hidden="true"
    >
      <li
        v-for="g in grupos"
        :key="g.clave"
        class="progreso__paso"
        :class="{ 'progreso__paso--activo': g.enCurso }"
      >
        <VProgressCircular
          v-if="g.enCurso"
          indeterminate
          size="14"
          width="2"
          class="progreso__icono"
        />
        <VIcon
          v-else
          :icon="g.fallidos && g.fallidos === g.veces ? 'tabler-alert-circle' : 'tabler-circle-check'"
          size="16"
          class="progreso__icono"
          :class="g.fallidos && g.fallidos === g.veces ? 'progreso__icono--error' : 'progreso__icono--listo'"
        />
        <div class="progreso__textos">
          <span>{{ g.texto }}<template v-if="g.enCurso">…</template></span>
          <span
            v-if="g.detalle"
            class="progreso__detalle"
          >{{ g.detalle }}</span>
          <span
            v-if="g.nota"
            class="progreso__detalle"
          >{{ g.nota }}</span>
        </div>
      </li>
      <li
        v-if="lineaEnCurso"
        class="progreso__paso progreso__paso--activo"
      >
        <VProgressCircular
          indeterminate
          size="14"
          width="2"
          class="progreso__icono"
        />
        <span>{{ lineaEnCurso }}…</span>
      </li>
    </ol>
  </div>

  <div
    v-else-if="grupos.length"
    class="progreso-final"
  >
    <button
      type="button"
      class="progreso-final__resumen"
      :aria-expanded="abierto"
      @click="abierto = !abierto"
    >
      <VIcon
        :icon="abierto ? 'tabler-chevron-down' : 'tabler-chevron-right'"
        size="14"
      />
      <span>{{ resumen }}</span>
    </button>
    <ol
      v-if="abierto"
      class="progreso__pasos progreso-final__pasos"
    >
      <li
        v-for="g in grupos"
        :key="g.clave"
        class="progreso__paso"
      >
        <VIcon
          :icon="g.fallidos && g.fallidos === g.veces ? 'tabler-alert-circle' : 'tabler-circle-check'"
          size="16"
          class="progreso__icono"
          :class="g.fallidos && g.fallidos === g.veces ? 'progreso__icono--error' : 'progreso__icono--listo'"
        />
        <div class="progreso__textos">
          <span>{{ g.texto }}</span>
          <span
            v-if="g.detalle"
            class="progreso__detalle"
          >{{ g.detalle }}</span>
          <span
            v-if="g.nota"
            class="progreso__detalle"
          >{{ g.nota }}</span>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.progreso {
  display: flex;
  flex-direction: column;
  padding: var(--as-sp-3);
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface));
  gap: var(--as-sp-2);
}

.progreso__encabezado {
  display: flex;
  align-items: center;
  gap: var(--as-sp-2);
}

.progreso__titulo {
  flex: 1;
  font-weight: var(--as-peso-semi);
}

.progreso__reloj {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  font-variant-numeric: tabular-nums;
}

.progreso__aviso {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
}

.progreso__pasos {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  gap: 6px;
  list-style: none;
}

.progreso__paso {
  display: flex;
  align-items: flex-start;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-2);
}

.progreso__paso--activo {
  color: rgb(var(--v-theme-on-surface));
  font-weight: var(--as-peso-medio);
}

.progreso__icono {
  flex-shrink: 0;
  margin-block-start: 2px;
}

.progreso__icono--listo {
  color: rgb(var(--v-theme-success));
}

.progreso__icono--error {
  color: rgb(var(--v-theme-warning));
}

.progreso__textos {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.progreso__detalle {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-weight: var(--as-peso-normal);
  overflow-wrap: anywhere;
}

.progreso-final__resumen {
  display: inline-flex;
  align-items: flex-start;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  cursor: pointer;
  font: inherit;
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-1);
  text-align: start;
}

.progreso-final__resumen:hover,
.progreso-final__resumen:focus-visible {
  color: rgb(var(--v-theme-on-surface));
}

.progreso-final__pasos {
  margin-block-start: var(--as-sp-2);
  padding-inline-start: var(--as-sp-1);
}
</style>
