<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'
import CompositorPregunta from '../components/CompositorPregunta.vue'
import ListaMensajes from '../components/ListaMensajes.vue'
import { useAsistenteStore } from '../stores/asistenteStore'
import { agruparConversaciones } from '../utils/historial'
import type { ConversacionResumen } from '../types'
import AsDialogo from '@/components/as/AsDialogo.vue'
import { useDialogo } from '@/composables/useDialogo'
import { useNotificacion } from '@/composables/useNotificacion'

/*
 * Pantalla completa del asistente (XEL1-721): historial agrupado por fecha a la izquierda (arriba y plegable en celular)
 * y, a la derecha, el inicio (saludo, caja grande y temas) o la conversación con la caja de seguimiento.
 */
const store = useAsistenteStore()
const { conversaciones, cargandoConversaciones, actualId, titulo, enviando, vacia, cargandoMensajes } = storeToRefs(store)
const { t } = useI18n()
const { smAndDown } = useDisplay()
const dialogo = useDialogo()
const notificar = useNotificacion()

const historialAbierto = ref(false)

/** Primeras conversaciones a la vista; "Ver todas" muestra el resto. */
const VISIBLES = 12
const verTodas = ref(false)
const grupos = computed(() => agruparConversaciones(verTodas.value ? conversaciones.value : conversaciones.value.slice(0, VISIBLES)))
const hayMas = computed(() => !verTodas.value && conversaciones.value.length > VISIBLES)
const renombrando = ref<ConversacionResumen | null>(null)
const nuevoTitulo = ref('')

onMounted(() => {
  void store.cargarConversaciones().catch(e => notificar.error(e))
  void store.cargarEstado()
})

async function abrir(id: string) {
  historialAbierto.value = false
  try {
    await store.abrir(id)
  }
  catch (e) {
    notificar.error(e)
  }
}

function nueva() {
  historialAbierto.value = false
  store.nueva()
}

function pedirNombre(c: ConversacionResumen) {
  renombrando.value = c
  nuevoTitulo.value = c.titulo
}

async function guardarNombre() {
  if (!renombrando.value || !nuevoTitulo.value.trim())
    return
  try {
    await store.renombrar(renombrando.value.id, nuevoTitulo.value)
    renombrando.value = null
  }
  catch (e) {
    notificar.error(e)
  }
}

async function borrar(c: ConversacionResumen) {
  if (!await dialogo.confirmarEliminar(t('asistente.borrarTitulo'), t('asistente.borrarDetalle')))
    return
  try {
    await store.borrar(c.id)
  }
  catch (e) {
    notificar.error(e)
  }
}
</script>

<template>
  <div class="asistente-pagina">
    <aside
      class="asistente-historial"
      :class="{ 'asistente-historial--plegado': smAndDown && !historialAbierto }"
    >
      <div class="asistente-historial__encabezado">
        <VBtn
          v-if="smAndDown"
          variant="text"
          size="small"
          :prepend-icon="historialAbierto ? 'tabler-chevron-up' : 'tabler-history'"
          @click="historialAbierto = !historialAbierto"
        >
          {{ t('asistente.historial') }}
        </VBtn>
        <span
          v-else
          class="asistente-historial__etiqueta"
        >{{ t('asistente.historial') }}</span>
        <VBtn
          prepend-icon="tabler-plus"
          size="small"
          variant="tonal"
          :disabled="enviando"
          @click="nueva"
        >
          {{ t('asistente.nuevaCorta') }}
        </VBtn>
      </div>
      <VProgressLinear
        v-if="cargandoConversaciones && !conversaciones.length"
        indeterminate
        height="2"
      />
      <nav
        v-if="conversaciones.length"
        class="asistente-historial__lista"
        :aria-label="t('asistente.historial')"
      >
        <div
          v-for="g in grupos"
          :key="g.titulo"
          class="asistente-historial__grupo"
        >
          <span class="asistente-historial__fecha">{{ g.titulo }}</span>
          <div
            v-for="c in g.conversaciones"
            :key="c.id"
            class="asistente-historial__item"
            :class="{ 'asistente-historial__item--activa': c.id === actualId }"
          >
            <button
              type="button"
              class="asistente-historial__abrir"
              :aria-current="c.id === actualId ? 'page' : undefined"
              :disabled="enviando && c.id !== actualId"
              @click="abrir(c.id)"
            >
              <span class="asistente-historial__titulo">{{ c.titulo }}</span>
              <span
                v-if="c.cuando"
                class="asistente-historial__cuando"
              >{{ c.cuando }}</span>
            </button>
            <VMenu location="bottom end">
              <template #activator="{ props: activador }">
                <VBtn
                  v-bind="activador"
                  icon="tabler-dots"
                  variant="text"
                  size="x-small"
                  class="asistente-historial__menu"
                  :aria-label="t('asistente.opcionesConversacion', { titulo: c.titulo })"
                />
              </template>
              <VList density="compact">
                <VListItem
                  prepend-icon="tabler-pencil"
                  :title="t('asistente.renombrar')"
                  @click="pedirNombre(c)"
                />
                <VListItem
                  prepend-icon="tabler-trash"
                  :title="t('asistente.borrar')"
                  class="text-error"
                  @click="borrar(c)"
                />
              </VList>
            </VMenu>
          </div>
        </div>
        <button
          v-if="hayMas"
          type="button"
          class="asistente-historial__ver-todas"
          @click="verTodas = true"
        >
          {{ t('asistente.verTodas') }}
        </button>
      </nav>
      <p
        v-else-if="!cargandoConversaciones"
        class="text-body-2 text-medium-emphasis px-2"
      >
        {{ t('asistente.sinHistorial') }}
      </p>
    </aside>

    <section class="asistente-chat">
      <template v-if="vacia && !cargandoMensajes">
        <div class="asistente-chat__inicio">
          <ListaMensajes inicio="pagina" />
        </div>
      </template>
      <template v-else>
        <header
          v-if="titulo"
          class="asistente-chat__encabezado"
        >
          <h1 class="asistente-chat__titulo">
            {{ titulo }}
          </h1>
        </header>
        <div class="asistente-chat__mensajes">
          <ListaMensajes inicio="pagina" />
        </div>
        <div class="asistente-chat__compositor">
          <CompositorPregunta />
        </div>
      </template>
    </section>

    <AsDialogo
      :abierto="renombrando !== null"
      :titulo="t('asistente.renombrarTitulo')"
      tamano="sm"
      :texto-confirmar="t('asistente.guardar')"
      :desactivar-confirmar="!nuevoTitulo.trim()"
      @update:abierto="v => { if (!v) renombrando = null }"
      @confirmar="guardarNombre"
    >
      <VTextField
        v-model="nuevoTitulo"
        :label="t('asistente.renombrarTitulo')"
        maxlength="120"
        autofocus
        @keydown.enter="guardarNombre"
      />
    </AsDialogo>
  </div>
</template>

<style scoped>
.asistente-pagina {
  display: grid;
  block-size: calc(100dvh - 140px);
  gap: var(--as-sp-4);
  grid-template-columns: 260px minmax(0, 1fr);
  min-block-size: 480px;
}

.asistente-historial {
  display: flex;
  flex-direction: column;
  border: var(--as-borde);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  gap: var(--as-sp-3);
  min-block-size: 0;
  padding-block: var(--as-sp-4);
  padding-inline: var(--as-sp-3);
}

.asistente-historial__encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--as-sp-2);
  padding-inline: var(--as-sp-2) var(--as-sp-1);
}

.asistente-historial__etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
  font-weight: var(--as-peso-semi);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.asistente-historial__lista {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-2);
  min-block-size: 0;
  overflow-y: auto;
}

.asistente-historial__grupo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.asistente-historial__fecha {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
  font-weight: var(--as-peso-medio);
  padding-block: var(--as-sp-1);
  padding-inline: var(--as-sp-2);
}

.asistente-historial__item {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 8px;
}

.asistente-historial__item:hover,
.asistente-historial__item--activa {
  background: rgb(var(--v-theme-surface-variant));
}

.asistente-historial__abrir {
  display: flex;
  flex: 1;
  justify-content: space-between;
  padding: var(--as-sp-2);
  border: 0;
  background: none;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  font: inherit;
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-2);
  min-inline-size: 0;
  text-align: start;
}

.asistente-historial__item--activa .asistente-historial__abrir {
  font-weight: var(--as-peso-medio);
}

.asistente-historial__abrir:disabled {
  cursor: default;
  opacity: 0.6;
}

.asistente-historial__titulo {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asistente-historial__cuando {
  flex-shrink: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
}

.asistente-historial__menu {
  margin-inline-end: 2px;
  opacity: 0;
}

.asistente-historial__item--activa .asistente-historial__menu,
.asistente-historial__item:hover .asistente-historial__menu,
.asistente-historial__item:focus-within .asistente-historial__menu {
  opacity: 1;
}

.asistente-historial__ver-todas {
  align-self: flex-start;
  padding: var(--as-sp-2);
  border: 0;
  background: none;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font: inherit;
  font-size: var(--as-fs-sm);
  font-weight: var(--as-peso-medio);
}

.asistente-chat {
  display: flex;
  flex-direction: column;
  min-block-size: 0;
}

.asistente-chat__inicio {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  padding-block: var(--as-sp-8) var(--as-sp-6);
  padding-inline: var(--as-sp-6);
}

.asistente-chat__encabezado {
  inline-size: 100%;
  margin-inline: auto;
  max-inline-size: 880px;
  padding-block: 0 var(--as-sp-3);
  padding-inline: var(--as-sp-2);
}

.asistente-chat__titulo {
  overflow: hidden;
  margin: 0;
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-semi);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asistente-chat__mensajes {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-block: var(--as-sp-2) var(--as-sp-4);
  padding-inline: var(--as-sp-2);
}

.asistente-chat__mensajes > *,
.asistente-chat__compositor > * {
  margin-inline: auto;
  max-inline-size: 880px;
}

.asistente-chat__compositor {
  padding-block: var(--as-sp-2) 0;
  padding-inline: var(--as-sp-2);
}

@media (max-width: 959px) {
  .asistente-pagina {
    block-size: calc(100dvh - 120px);
    gap: var(--as-sp-3);
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }

  .asistente-historial {
    max-block-size: 50dvh;
  }

  .asistente-historial--plegado .asistente-historial__lista,
  .asistente-historial--plegado > p,
  .asistente-historial--plegado > .v-progress-linear {
    display: none;
  }

  .asistente-chat__inicio {
    padding-block: var(--as-sp-4);
    padding-inline: var(--as-sp-1);
  }
}
</style>
