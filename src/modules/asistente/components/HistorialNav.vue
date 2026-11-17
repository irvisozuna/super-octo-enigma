<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '../stores/asistenteStore'
import type { ConversacionResumen } from '../types'
import { agruparConversaciones } from '../utils/historial'
import AsDialogo from '@/components/as/AsDialogo.vue'
import { useDialogo } from '@/composables/useDialogo'
import { useNotificacion } from '@/composables/useNotificacion'
import { useAbility } from '@/plugins/casl/composables/useAbility'

/*
 * Historial del asistente dentro del menú lateral (XEL1-721), solo en la pantalla del asistente: "Conversaciones" con
 * "Nueva", agrupado por fecha (Hoy, Ayer, Esta semana, Anteriores) con la hora o la fecha, y "Ver todas".
 */
const store = useAsistenteStore()
const { conversaciones, cargandoConversaciones, actualId, enviando } = storeToRefs(store)
const { t } = useI18n()
const route = useRoute()
const ability = useAbility()
const dialogo = useDialogo()
const notificar = useNotificacion()

const visible = computed(() => route.name === 'asistente' && ability.can('use', 'asistente'))

const VISIBLES = 8
const verTodas = ref(false)
const grupos = computed(() => agruparConversaciones(verTodas.value ? conversaciones.value : conversaciones.value.slice(0, VISIBLES)))
const hayMas = computed(() => !verTodas.value && conversaciones.value.length > VISIBLES)

const renombrando = ref<ConversacionResumen | null>(null)
const nuevoTitulo = ref('')

onMounted(() => {
  if (visible.value && !conversaciones.value.length)
    store.cargarConversaciones().catch(e => notificar.error(e))
})

async function abrir(id: string) {
  try {
    await store.abrir(id)
  }
  catch (e) {
    notificar.error(e)
  }
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
  <section
    v-if="visible"
    class="historial-nav"
    :aria-label="t('asistente.historial')"
  >
    <div class="historial-nav__encabezado">
      <span class="historial-nav__etiqueta">{{ t('asistente.historial') }}</span>
      <VBtn
        prepend-icon="tabler-plus"
        size="small"
        variant="tonal"
        :disabled="enviando"
        @click="store.nueva()"
      >
        {{ t('asistente.nuevaCorta') }}
      </VBtn>
    </div>

    <VProgressLinear
      v-if="cargandoConversaciones && !conversaciones.length"
      indeterminate
      height="2"
    />

    <div
      v-if="conversaciones.length"
      class="historial-nav__lista"
    >
      <div
        v-for="g in grupos"
        :key="g.titulo"
        class="historial-nav__grupo"
      >
        <span class="historial-nav__fecha">{{ g.titulo }}</span>
        <div
          v-for="c in g.conversaciones"
          :key="c.id"
          class="historial-nav__item"
          :class="{ 'historial-nav__item--activa': c.id === actualId }"
        >
          <button
            type="button"
            class="historial-nav__abrir"
            :aria-current="c.id === actualId ? 'page' : undefined"
            :disabled="enviando && c.id !== actualId"
            @click="abrir(c.id)"
          >
            <span class="historial-nav__titulo">{{ c.titulo }}</span>
            <span
              v-if="c.cuando"
              class="historial-nav__cuando"
            >{{ c.cuando }}</span>
          </button>
          <VMenu location="bottom end">
            <template #activator="{ props: activador }">
              <VBtn
                v-bind="activador"
                icon="tabler-dots"
                variant="text"
                size="x-small"
                class="historial-nav__menu"
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
        class="historial-nav__ver-todas"
        @click="verTodas = true"
      >
        {{ t('asistente.verTodas') }}
      </button>
    </div>
    <p
      v-else-if="!cargandoConversaciones"
      class="historial-nav__vacio"
    >
      {{ t('asistente.sinHistorial') }}
    </p>

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
  </section>
</template>

<style scoped>
.historial-nav {
  display: flex;
  overflow: hidden;
  flex: 1 1 auto;
  flex-direction: column;
  border-block-start: var(--as-borde);
  gap: var(--as-sp-2);
  margin-block-start: var(--as-sp-3);
  margin-inline: var(--as-sp-3);
  min-block-size: 0;
  padding-block: var(--as-sp-4) var(--as-sp-3);
}

.historial-nav__encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--as-sp-2);
  padding-inline: var(--as-sp-2) 0;
}

.historial-nav__etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
  font-weight: var(--as-peso-semi);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.historial-nav__lista {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-2);
  min-block-size: 0;
  overflow-y: auto;
}

.historial-nav__grupo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.historial-nav__fecha {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
  font-weight: var(--as-peso-medio);
  padding-block: var(--as-sp-1);
  padding-inline: var(--as-sp-2);
}

.historial-nav__item {
  display: flex;
  align-items: center;
  border-radius: 8px;
}

.historial-nav__item--activa,
.historial-nav__item:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.historial-nav__abrir {
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

.historial-nav__item--activa .historial-nav__abrir {
  font-weight: var(--as-peso-medio);
}

.historial-nav__abrir:disabled {
  cursor: default;
  opacity: 0.6;
}

.historial-nav__titulo {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.historial-nav__cuando {
  flex-shrink: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
}

.historial-nav__menu {
  margin-inline-end: 2px;
  opacity: 0;
}

.historial-nav__item--activa .historial-nav__menu,
.historial-nav__item:hover .historial-nav__menu,
.historial-nav__item:focus-within .historial-nav__menu {
  opacity: 1;
}

.historial-nav__ver-todas {
  align-self: flex-start;
  padding: var(--as-sp-2);
  border: 0;
  background: none;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font: inherit;
  font-size: var(--as-fs-sm);
  font-weight: var(--as-peso-semi);
}

.historial-nav__vacio {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  padding-inline: var(--as-sp-2);
}
</style>

<style>
/* En la pantalla del asistente el menú no se estira: el historial va justo debajo de él */
.layout-vertical-nav:has(.historial-nav) .nav-items {
  flex: 0 0 auto;
  block-size: auto;
}
</style>
