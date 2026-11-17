<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '../stores/asistenteStore'
import { SUGERENCIAS, SUGERENCIAS_REPORTE, TEMAS } from '../utils/sugerencias'
import CompositorPregunta from './CompositorPregunta.vue'
import { primerNombre } from '@/utils/usuario'

/*
 * Inicio del asistente (XEL1-721). En pantalla completa: saludo, la caja grande para preguntar y cuatro temas con
 * preguntas sugeridas. En el panel lateral (`compacta`): saludo y sugerencias; la caja va en el pie del panel.
 */
defineProps<{ compacta?: boolean }>()

const store = useAsistenteStore()
const { contexto, enviando } = storeToRefs(store)
const { t } = useI18n()

/** Primer nombre del usuario de la sesión; sin nombre, un saludo sin él. */
const nombre = computed(() => {
  const datos = useCookie<{ name?: string; username?: string } | null>('userData').value

  return primerNombre(datos?.name || datos?.username)
})
</script>

<template>
  <div
    class="bienvenida"
    :class="{ 'bienvenida--compacta': compacta }"
  >
    <div class="bienvenida__saludo">
      <h1 class="bienvenida__titulo">
        <template v-if="nombre">
          {{ t('asistente.inicio.hola') }} <span class="text-primary">{{ nombre }}</span>
        </template>
        <template v-else>
          {{ t('asistente.inicio.holaSinNombre') }}
        </template>
      </h1>
      <p class="bienvenida__subtitulo">
        {{ contexto ? t('asistente.contexto.bienvenida', { titulo: contexto.titulo }) : t('asistente.inicio.subtitulo') }}
      </p>
    </div>

    <CompositorPregunta
      v-if="!compacta"
      variante="grande"
    />

    <div
      v-if="contexto || compacta"
      class="bienvenida__sugerencias"
    >
      <VBtn
        v-for="s in contexto ? SUGERENCIAS_REPORTE : SUGERENCIAS"
        :key="s"
        variant="outlined"
        rounded="pill"
        color="on-surface"
        class="bienvenida__sugerencia"
        :disabled="enviando"
        @click="store.enviar(s)"
      >
        {{ s }}
      </VBtn>
    </div>

    <div
      v-else
      class="bienvenida__temas"
    >
      <section
        v-for="tema in TEMAS"
        :key="tema.titulo"
        class="bienvenida__tema"
      >
        <span
          class="bienvenida__icono"
          aria-hidden="true"
        >
          <VIcon
            :icon="tema.icono"
            size="20"
          />
        </span>
        <div>
          <h2 class="bienvenida__tema-titulo">
            {{ tema.titulo }}
          </h2>
          <p class="bienvenida__tema-descripcion">
            {{ tema.descripcion }}
          </p>
        </div>
        <div class="bienvenida__preguntas">
          <button
            v-for="p in tema.preguntas"
            :key="p"
            type="button"
            class="bienvenida__pregunta"
            :disabled="enviando"
            @click="store.enviar(p)"
          >
            {{ p }}
          </button>
        </div>
      </section>
    </div>

    <p
      v-if="!compacta"
      class="bienvenida__aviso"
    >
      <VIcon
        icon="tabler-info-circle"
        size="16"
      />
      <span>{{ t('asistente.inicio.aviso') }}</span>
    </p>
  </div>
</template>

<style scoped>
.bienvenida {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-6);
  inline-size: 100%;
  margin-inline: auto;
  max-inline-size: 960px;
}

.bienvenida--compacta {
  gap: var(--as-sp-4);
}

.bienvenida__saludo {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-2);
}

.bienvenida__titulo {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.bienvenida--compacta .bienvenida__titulo {
  font-size: 1.5rem;
}

.bienvenida__subtitulo {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 1.0625rem;
  line-height: 1.5;
}

.bienvenida--compacta .bienvenida__subtitulo {
  font-size: var(--as-fs-base);
}

.bienvenida__temas {
  display: grid;
  gap: var(--as-sp-4);
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.bienvenida__tema {
  display: flex;
  flex-direction: column;
  padding: 18px;
  border: var(--as-borde);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  gap: var(--as-sp-3);
}

.bienvenida__icono {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface-resaltada));
  block-size: 40px;
  color: rgb(var(--v-theme-primary));
  inline-size: 40px;
}

.bienvenida__tema-titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--as-peso-semi);
}

.bienvenida__tema-descripcion {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  line-height: 1.45;
}

.bienvenida__preguntas {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bienvenida__pregunta {
  border: 0;
  border-radius: 10px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  font: inherit;
  font-size: var(--as-fs-sm);
  line-height: 1.4;
  min-block-size: 44px;
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
  text-align: start;
}

.bienvenida__pregunta:hover,
.bienvenida__pregunta:focus-visible {
  background: rgb(var(--v-theme-surface-resaltada));
  color: rgb(var(--v-theme-on-surface-resaltada));
}

.bienvenida__pregunta:disabled {
  cursor: default;
  opacity: 0.6;
}

.bienvenida__sugerencias {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-sp-2);
}

.bienvenida__sugerencias .bienvenida__sugerencia {
  border-color: rgba(var(--v-border-color), 0.32);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-weight: var(--as-peso-normal);
  letter-spacing: normal;
  min-block-size: 40px;
  text-transform: none;
}

.bienvenida__aviso {
  display: flex;
  margin: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-2);
  line-height: 1.5;
}

.bienvenida__aviso .v-icon {
  flex-shrink: 0;
  margin-block-start: 2px;
}
</style>
