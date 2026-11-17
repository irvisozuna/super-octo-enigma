<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import CompositorPregunta from '../components/CompositorPregunta.vue'
import ListaMensajes from '../components/ListaMensajes.vue'
import { useAsistenteStore } from '../stores/asistenteStore'
import { useNotificacion } from '@/composables/useNotificacion'

/*
 * Pantalla completa del asistente (XEL1-721). El historial va en el menú lateral (HistorialNav); aquí, el inicio
 * (saludo, caja grande y temas) o la conversación con la caja de seguimiento abajo.
 */
const store = useAsistenteStore()
const { titulo, vacia, cargandoMensajes } = storeToRefs(store)
const { t } = useI18n()
const notificar = useNotificacion()

onMounted(() => {
  store.cargarConversaciones().catch(e => notificar.error(e))
  store.cargarEstado()
})
</script>

<template>
  <section
    class="asistente-pagina"
    :aria-label="t('asistente.titulo')"
  >
    <div
      v-if="vacia && !cargandoMensajes"
      class="asistente-pagina__inicio"
    >
      <ListaMensajes inicio="pagina" />
    </div>
    <template v-else>
      <header
        v-if="titulo"
        class="asistente-pagina__encabezado"
      >
        <h1 class="asistente-pagina__titulo">
          {{ titulo }}
        </h1>
      </header>
      <div class="asistente-pagina__mensajes">
        <ListaMensajes inicio="pagina" />
      </div>
      <div class="asistente-pagina__compositor">
        <CompositorPregunta />
      </div>
    </template>
  </section>
</template>

<style scoped>
.asistente-pagina {
  display: flex;
  flex-direction: column;
  block-size: calc(100dvh - 140px);
  min-block-size: 480px;
}

.asistente-pagina__inicio {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  padding-block: var(--as-sp-8) var(--as-sp-6);
  padding-inline: var(--as-sp-4);
}

.asistente-pagina__encabezado,
.asistente-pagina__mensajes > *,
.asistente-pagina__compositor > * {
  margin-inline: auto;
  max-inline-size: 880px;
}

.asistente-pagina__encabezado {
  inline-size: 100%;
  padding-block: 0 var(--as-sp-3);
  padding-inline: var(--as-sp-2);
}

.asistente-pagina__titulo {
  overflow: hidden;
  margin: 0;
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-semi);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asistente-pagina__mensajes {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-block: var(--as-sp-2) var(--as-sp-4);
  padding-inline: var(--as-sp-2);
}

.asistente-pagina__compositor {
  padding-block: var(--as-sp-2) 0;
  padding-inline: var(--as-sp-2);
}

@media (max-width: 959px) {
  .asistente-pagina {
    block-size: calc(100dvh - 120px);
  }

  .asistente-pagina__inicio {
    padding-block: var(--as-sp-4);
    padding-inline: var(--as-sp-1);
  }
}
</style>
