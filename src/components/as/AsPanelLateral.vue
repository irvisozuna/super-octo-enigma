<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { ANCHOS_PANEL } from './tipos'
import type { TamanoPanel } from './tipos'

/*
 * Panel lateral del sistema de diseño: encabezado fijo (sobrelínea, título, subtítulo, acciones, cerrar), cuerpo
 * desplazable que no arrastra la página y pie fijo opcional. Anchos: sm 360 · md 520 (referencia) · lg 640 · xl 720;
 * en pantallas chicas ocupa todo el ancho. Esc lo cierra.
 */
const props = withDefaults(defineProps<{
  abierto: boolean
  titulo?: string
  sobrelinea?: string
  subtitulo?: string
  tamano?: TamanoPanel
  cargando?: boolean
  ocultarCerrar?: boolean
}>(), { tamano: 'md' })

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'cerrar': []
}>()

const { t } = useI18n()
const { smAndDown } = useDisplay()

const ancho = computed(() => (smAndDown.value ? '100%' : ANCHOS_PANEL[props.tamano]))

function cerrar() {
  emit('update:abierto', false)
  emit('cerrar')
}

function alTeclear(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.abierto)
    cerrar()
}

watch(() => props.abierto, abierto => {
  if (abierto)
    document.addEventListener('keydown', alTeclear)
  else
    document.removeEventListener('keydown', alTeclear)
}, { immediate: true })

onBeforeUnmount(() => document.removeEventListener('keydown', alTeclear))
</script>

<template>
  <VNavigationDrawer
    :model-value="abierto"
    location="end"
    temporary
    touchless
    :width="ancho"
    class="as-panel"
    :class="`as-panel--${tamano}`"
    :aria-label="titulo"
    @update:model-value="(v: boolean) => { if (!v) cerrar() }"
  >
    <div class="as-panel__encabezado">
      <div class="as-panel__titulos">
        <div
          v-if="sobrelinea"
          class="as-sobrelinea"
        >
          {{ sobrelinea }}
        </div>
        <div class="d-flex align-center flex-wrap gap-2">
          <h2
            v-if="titulo"
            class="as-panel__titulo mb-0"
          >
            {{ titulo }}
          </h2>
          <slot name="titulo-extra" />
        </div>
        <div
          v-if="subtitulo"
          class="text-body-2 text-medium-emphasis"
        >
          {{ subtitulo }}
        </div>
      </div>
      <div class="d-flex align-center gap-1 flex-shrink-0">
        <slot name="acciones" />
        <VBtn
          v-if="!ocultarCerrar"
          icon="tabler-x"
          variant="text"
          size="small"
          :aria-label="t('as.panel.cerrar')"
          @click="cerrar"
        />
      </div>
    </div>
    <div
      v-if="$slots.subencabezado"
      class="as-panel__subencabezado"
    >
      <slot name="subencabezado" />
    </div>
    <VProgressLinear
      v-if="cargando"
      indeterminate
      height="2"
    />
    <VDivider v-else />
    <div class="as-panel__cuerpo">
      <slot />
    </div>
    <div
      v-if="$slots.pie"
      class="as-panel__pie"
    >
      <slot name="pie" />
    </div>
  </VNavigationDrawer>
</template>

<style scoped>
.as-panel :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  block-size: 100%;
}

.as-panel__encabezado {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}

.as-panel__titulos {
  min-inline-size: 0;
}

.as-panel__titulo {
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-semi);
  line-height: 1.4;
}

.as-panel__subencabezado {
  padding-block: 0 var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}

.as-panel__cuerpo {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-block: var(--as-sp-4);
  padding-inline: var(--as-sp-4);
}

.as-panel__pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  background: rgb(var(--v-theme-surface));
  border-block-start: var(--as-borde);
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}
</style>
