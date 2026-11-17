<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '../stores/asistenteStore'
import type { NivelRespuesta } from '../types'
import { obtenerMenu } from '@/modules/reportes/services/reportesApi'
import type { ElementoMenu } from '@/modules/reportes/types/api'

/*
 * Caja de la pregunta (XEL1-721). `grande`: la del inicio, con los modos como selector, el contexto (operación general o
 * un reporte) y "Preguntar". `compacta`: la de seguimiento, de una línea, con el modo y el botón de enviar. Enter envía,
 * Mayús+Enter hace salto de línea; mientras contesta, el botón la detiene.
 */
const props = withDefaults(defineProps<{ variante?: 'grande' | 'compacta' }>(), { variante: 'compacta' })

const store = useAsistenteStore()
const { enviando, nivel, estado, sinCupo, contexto, vacia } = storeToRefs(store)
const { t } = useI18n()

const texto = ref('')
const MAXIMO = 2000
const caja = ref<HTMLTextAreaElement | null>(null)

/* La caja crece con el texto hasta su alto máximo (CSS) y vuelve a una línea al enviar. */
watch(texto, async () => {
  await nextTick()
  if (!caja.value)
    return
  caja.value.style.height = 'auto'
  caja.value.style.height = `${caja.value.scrollHeight}px`
})

const MODOS: { valor: NivelRespuesta; icono: string }[] = [
  { valor: 'auto', icono: 'tabler-check' },
  { valor: 'rapido', icono: 'tabler-bolt' },
  { valor: 'analisis', icono: 'tabler-chart-bar' },
]

const modoActual = computed(() => MODOS.find(m => m.valor === nivel.value) ?? MODOS[0])

const aviso = computed(() => {
  if (sinCupo.value)
    return t('asistente.sinCupo')
  const restantes = estado.value?.preguntas_restantes
  if (restantes !== undefined && restantes <= 5)
    return t('asistente.restantes', { n: restantes })
  const pct = estado.value?.consumo_mensual_pct
  if (pct !== null && pct !== undefined && pct >= 80)
    return t('asistente.consumoAlto', { pct })

  return ''
})

const placeholder = computed(() => {
  if (props.variante === 'grande')
    return t('asistente.placeholder')

  return vacia.value ? t('asistente.placeholder') : t('asistente.placeholderSeguimiento')
})

/* Reportes para el contexto: se cargan la primera vez que se abre el menú. */
const reportes = ref<ElementoMenu[] | null>(null)
const cargandoReportes = ref(false)

async function cargarReportes() {
  if (reportes.value || cargandoReportes.value)
    return
  cargandoReportes.value = true
  try {
    const menu = await obtenerMenu()

    reportes.value = menu.categorias.flatMap(c => c.elementos).filter(e => e.tipo === 'reporte')
  }
  catch {
    reportes.value = []
  }
  finally {
    cargandoReportes.value = false
  }
}

function elegirReporte(r: ElementoMenu | null) {
  contexto.value = r ? { tipo: 'reporte', clave: r.key, titulo: r.titulo, filtros: {} } : null
}

function enviar() {
  if (enviando.value || sinCupo.value || !texto.value.trim())
    return
  const pregunta = texto.value

  texto.value = ''
  store.enviar(pregunta)
}

function alTeclear(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    enviar()
  }
}
</script>

<template>
  <div
    class="compositor"
    :class="`compositor--${variante}`"
  >
    <div
      v-if="contexto && variante === 'compacta'"
      class="compositor__contexto"
    >
      <VChip
        size="small"
        color="primary"
        variant="tonal"
        prepend-icon="tabler-report-analytics"
        closable
        :close-label="t('asistente.contexto.quitar')"
        @click:close="contexto = null"
      >
        <span class="compositor__contexto-texto">
          {{ t('asistente.contexto.sobre', { titulo: contexto.titulo }) }}<template v-if="contexto.resumen"> · {{ contexto.resumen }}</template>
        </span>
      </VChip>
    </div>

    <div class="compositor__caja">
      <label
        for="asistente-pregunta"
        class="d-sr-only"
      >{{ t('asistente.placeholder') }}</label>
      <textarea
        id="asistente-pregunta"
        ref="caja"
        v-model="texto"
        class="compositor__texto"
        :rows="variante === 'grande' ? 2 : 1"
        :maxlength="MAXIMO"
        :placeholder="placeholder"
        :disabled="sinCupo"
        @keydown="alTeclear"
      />

      <div
        v-if="variante === 'grande'"
        class="compositor__barra"
      >
        <div class="compositor__opciones">
          <div
            role="group"
            class="compositor__modos"
            :aria-label="t('asistente.nivel.etiqueta')"
          >
            <button
              v-for="m in MODOS"
              :key="m.valor"
              type="button"
              class="compositor__modo-opcion"
              :class="{ 'compositor__modo-opcion--activa': nivel === m.valor }"
              :aria-pressed="nivel === m.valor"
              @click="nivel = m.valor"
            >
              <VIcon
                :icon="m.icono"
                size="16"
              />
              {{ t(`asistente.nivel.${m.valor}`) }}
            </button>
          </div>

          <VMenu
            location="bottom start"
            max-height="360"
            @update:model-value="abierto => abierto && cargarReportes()"
          >
            <template #activator="{ props: activador }">
              <VBtn
                v-bind="activador"
                variant="outlined"
                class="compositor__contexto-boton"
                prepend-icon="tabler-database"
                append-icon="tabler-chevron-down"
              >
                <span class="compositor__contexto-texto">
                  {{ t('asistente.contexto.etiqueta', { titulo: contexto?.titulo ?? t('asistente.contexto.general') }) }}
                </span>
              </VBtn>
            </template>
            <VList density="compact">
              <VListItem
                :active="!contexto"
                prepend-icon="tabler-building"
                :title="t('asistente.contexto.general')"
                @click="elegirReporte(null)"
              />
              <VDivider />
              <VListSubheader>{{ t('asistente.contexto.reportes') }}</VListSubheader>
              <VListItem v-if="cargandoReportes">
                <VProgressLinear indeterminate />
              </VListItem>
              <VListItem
                v-for="r in reportes ?? []"
                :key="r.key"
                :active="contexto?.clave === r.key"
                :title="r.titulo"
                @click="elegirReporte(r)"
              />
            </VList>
          </VMenu>
        </div>

        <VBtn
          v-if="enviando"
          color="error"
          variant="tonal"
          prepend-icon="tabler-player-stop-filled"
          class="compositor__principal"
          @click="store.detener()"
        >
          {{ t('asistente.detener') }}
        </VBtn>
        <VBtn
          v-else
          color="primary"
          append-icon="tabler-send"
          class="compositor__principal"
          :disabled="!texto.trim() || sinCupo"
          @click="enviar"
        >
          {{ t('asistente.preguntar') }}
        </VBtn>
      </div>

      <template v-else>
        <VMenu location="top end">
          <template #activator="{ props: activador }">
            <VBtn
              v-bind="activador"
              variant="text"
              size="small"
              :prepend-icon="modoActual.icono"
              class="compositor__modo"
              :aria-label="`${t('asistente.nivel.etiqueta')}: ${t(`asistente.nivel.${nivel}`)}`"
            >
              {{ t(`asistente.nivel.${nivel}`) }}
            </VBtn>
          </template>
          <VList density="compact">
            <VListItem
              v-for="m in MODOS"
              :key="m.valor"
              :active="nivel === m.valor"
              :prepend-icon="m.icono"
              :title="t(`asistente.nivel.${m.valor}`)"
              :subtitle="t(`asistente.nivel.descripcion.${m.valor}`)"
              @click="nivel = m.valor"
            />
          </VList>
        </VMenu>
        <VBtn
          v-if="enviando"
          icon="tabler-player-stop-filled"
          color="error"
          variant="tonal"
          class="compositor__enviar"
          :aria-label="t('asistente.detener')"
          @click="store.detener()"
        />
        <VBtn
          v-else
          icon="tabler-arrow-right"
          color="primary"
          class="compositor__enviar"
          :disabled="!texto.trim() || sinCupo"
          :aria-label="t('asistente.enviar')"
          @click="enviar"
        />
      </template>
    </div>

    <p
      v-if="variante === 'grande'"
      class="compositor__ayuda"
    >
      <strong>{{ t('asistente.nivel.auto') }}:</strong> {{ t('asistente.inicio.ayudaModos') }}
    </p>
    <p
      v-if="aviso"
      class="compositor__aviso"
    >
      {{ aviso }}
    </p>
    <p
      v-else-if="variante === 'compacta'"
      class="compositor__pie"
    >
      {{ t('asistente.aviso') }}
    </p>
  </div>
</template>

<style scoped>
.compositor {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-2);
}

.compositor__caja {
  display: flex;
  align-items: flex-end;
  border: 1px solid rgba(var(--v-border-color), 0.24);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 2px rgba(15, 23, 42, 5%);
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-4) var(--as-sp-2);
}

.compositor__caja:focus-within {
  border-color: rgb(var(--v-theme-primary));
}

.compositor--grande .compositor__caja {
  flex-direction: column;
  align-items: stretch;
  padding: var(--as-sp-4);
  border: 1.5px solid rgb(var(--v-theme-primary));
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 8%);
  gap: var(--as-sp-3);
}

.compositor__texto {
  flex: 1;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: var(--as-fs-base);
  line-height: 1.5;
  max-block-size: 160px;
  min-inline-size: 0;
  outline: 0;
  padding-block: 10px;
  resize: none;
}

.compositor--grande .compositor__texto {
  font-size: 1rem;
  padding-block: 0;
}

.compositor__texto::placeholder {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.compositor__barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--as-sp-3);
}

.compositor__opciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-sp-2);
}

.compositor__modos {
  display: flex;
  padding: 3px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface-variant));
  gap: 2px;
}

.compositor__modo-opcion {
  display: flex;
  align-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  cursor: pointer;
  font: inherit;
  font-size: var(--as-fs-sm);
  font-weight: var(--as-peso-medio);
  gap: 6px;
  min-block-size: 36px;
  padding-block: 0;
  padding-inline: var(--as-sp-3);
  white-space: nowrap;
}

.compositor__modo-opcion:hover {
  color: rgb(var(--v-theme-on-surface));
}

.compositor__modo-opcion:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

.compositor__modo-opcion--activa {
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 2px rgba(15, 23, 42, 12%);
  color: rgb(var(--v-theme-primary-darken-1));
  font-weight: var(--as-peso-semi);
}

.compositor__contexto-boton {
  max-inline-size: 320px;
  min-block-size: 42px;
  text-transform: none;
}

.compositor__contexto-texto {
  overflow: hidden;
  max-inline-size: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compositor__principal {
  min-block-size: 44px;
  text-transform: none;
}

.compositor__modo {
  margin-block-end: 6px;
  text-transform: none;
}

.compositor__caja .compositor__enviar.v-btn--icon {
  flex-shrink: 0;
  border-radius: 10px;
  block-size: 44px;
  inline-size: 44px;
}

.compositor__ayuda,
.compositor__aviso,
.compositor__pie {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  line-height: 1.5;
  padding-inline: var(--as-sp-1);
}

.compositor__ayuda strong {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-weight: var(--as-peso-semi);
}

.compositor__aviso {
  color: rgb(var(--v-theme-warning));
}

.compositor__pie {
  font-size: var(--as-fs-xs);
  text-align: center;
}

.compositor__contexto {
  max-inline-size: 100%;
}
</style>
