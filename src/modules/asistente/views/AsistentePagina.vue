<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'
import CompositorPregunta from '../components/CompositorPregunta.vue'
import ListaMensajes from '../components/ListaMensajes.vue'
import { useAsistenteStore } from '../stores/asistenteStore'
import type { ConversacionResumen } from '../types'
import AsDialogo from '@/components/as/AsDialogo.vue'
import { useDialogo } from '@/composables/useDialogo'
import { useNotificacion } from '@/composables/useNotificacion'

/* Pantalla completa del asistente: historial a la izquierda (arriba, plegable, en celular) y el chat. */
const store = useAsistenteStore()
const { conversaciones, cargandoConversaciones, actualId, titulo, enviando } = storeToRefs(store)
const { t } = useI18n()
const { smAndDown } = useDisplay()
const dialogo = useDialogo()
const notificar = useNotificacion()

const historialAbierto = ref(false)
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
          class="as-sobrelinea"
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
      <VList
        v-if="conversaciones.length"
        density="compact"
        nav
        class="asistente-historial__lista"
      >
        <VListItem
          v-for="c in conversaciones"
          :key="c.id"
          :active="c.id === actualId"
          :disabled="enviando && c.id !== actualId"
          @click="abrir(c.id)"
        >
          <VListItemTitle class="text-body-2">
            {{ c.titulo }}
          </VListItemTitle>
          <template #append>
            <VMenu location="bottom end">
              <template #activator="{ props: activador }">
                <VBtn
                  v-bind="activador"
                  icon="tabler-dots-vertical"
                  variant="text"
                  size="x-small"
                  :aria-label="t('asistente.historial')"
                  @click.stop
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
          </template>
        </VListItem>
      </VList>
      <p
        v-else-if="!cargandoConversaciones"
        class="text-body-2 text-medium-emphasis px-2"
      >
        {{ t('asistente.sinHistorial') }}
      </p>
    </aside>

    <section class="asistente-chat">
      <header class="asistente-chat__encabezado">
        <div class="as-sobrelinea">
          {{ t('asistente.sobrelinea') }}
        </div>
        <h1 class="asistente-chat__titulo">
          {{ titulo || t('asistente.titulo') }}
        </h1>
      </header>
      <div class="asistente-chat__mensajes">
        <ListaMensajes />
      </div>
      <div class="asistente-chat__compositor">
        <CompositorPregunta />
      </div>
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
  grid-template-columns: 280px minmax(0, 1fr);
  min-block-size: 480px;
}

.asistente-historial {
  display: flex;
  flex-direction: column;
  border: var(--as-borde);
  border-radius: var(--as-radio-lg);
  background: rgb(var(--v-theme-surface));
  gap: var(--as-sp-2);
  min-block-size: 0;
  padding: var(--as-sp-3);
}

.asistente-historial__encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--as-sp-2);
}

.asistente-historial__lista {
  overflow-y: auto;
  min-block-size: 0;
  padding: 0;
}

.asistente-chat {
  display: flex;
  flex-direction: column;
  border: var(--as-borde);
  border-radius: var(--as-radio-lg);
  background: rgb(var(--v-theme-surface));
  min-block-size: 0;
}

.asistente-chat__encabezado {
  border-block-end: var(--as-borde);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-5);
}

.asistente-chat__titulo {
  font-size: var(--as-fs-lg);
  font-weight: var(--as-peso-semi);
  margin: 0;
}

.asistente-chat__mensajes {
  flex: 1 1 auto;
  overflow-y: auto;
  min-block-size: 0;
  overscroll-behavior: contain;
  padding-block: var(--as-sp-4);
  padding-inline: var(--as-sp-5);
}

.asistente-chat__mensajes > * {
  margin-inline: auto;
  max-inline-size: 860px;
}

.asistente-chat__compositor {
  border-block-start: var(--as-borde);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-5);
}

.asistente-chat__compositor > * {
  margin-inline: auto;
  max-inline-size: 860px;
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

  .asistente-chat__encabezado,
  .asistente-chat__mensajes,
  .asistente-chat__compositor {
    padding-inline: var(--as-sp-3);
  }
}
</style>
