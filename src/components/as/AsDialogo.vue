<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ANCHOS_DIALOGO } from './tipos'
import type { TamanoDialogo } from './tipos'

/*
 * Diálogo del sistema de diseño. Variantes: formulario (Cancelar / Confirmar), confirmar (misma botonera, color
 * de confirmación destacado, persistente) e informativo (solo Cerrar). Título fijo, cuerpo desplazable, pie fijo.
 * Anchos: sm 480 · md 640 · lg 880 · xl 1100 · completo (toda la ventana, para tablas anchas). Para confirmaciones imperativas, ver useDialogo().
 */
const props = withDefaults(defineProps<{
  abierto: boolean
  titulo: string
  subtitulo?: string
  tamano?: TamanoDialogo
  variante?: 'formulario' | 'confirmar' | 'informativo'
  persistente?: boolean
  cargando?: boolean
  textoConfirmar?: string
  textoCancelar?: string
  colorConfirmar?: string
  desactivarConfirmar?: boolean
  ocultarAcciones?: boolean
}>(), { tamano: 'md', variante: 'formulario', colorConfirmar: 'primary' })

const emit = defineEmits<{
  'update:abierto': [valor: boolean]
  'confirmar': []
  'cancelar': []
}>()

const { t } = useI18n()

function cancelar() {
  if (props.cargando)
    return
  emit('update:abierto', false)
  emit('cancelar')
}
</script>

<template>
  <VDialog
    :model-value="abierto"
    :max-width="ANCHOS_DIALOGO[tamano]"
    :persistent="persistente || cargando || variante === 'confirmar'"
    scrollable
    class="as-dialogo"
    @update:model-value="(v: boolean) => { if (!v) cancelar() }"
  >
    <VCard class="as-dialogo__tarjeta">
      <div class="as-dialogo__encabezado">
        <slot name="encabezado-prefijo" />
        <div class="as-dialogo__titulos">
          <h2
            id="as-dialogo-titulo"
            class="as-dialogo__titulo mb-0"
          >
            {{ titulo }}
          </h2>
          <div
            v-if="subtitulo"
            class="text-body-2 text-medium-emphasis"
          >
            {{ subtitulo }}
          </div>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          :disabled="cargando"
          :aria-label="t('as.dialogo.cerrar')"
          @click="cancelar"
        />
      </div>
      <VDivider />
      <VCardText class="as-dialogo__cuerpo">
        <slot />
      </VCardText>
      <template v-if="!ocultarAcciones">
        <VDivider />
        <VCardActions class="as-dialogo__acciones">
          <slot name="acciones-inicio" />
          <VSpacer />
          <slot name="acciones">
            <template v-if="variante === 'informativo'">
              <VBtn
                variant="flat"
                color="primary"
                @click="cancelar"
              >
                {{ textoCancelar ?? t('as.dialogo.cerrar') }}
              </VBtn>
            </template>
            <template v-else>
              <VBtn
                variant="text"
                :disabled="cargando"
                @click="cancelar"
              >
                {{ textoCancelar ?? t('as.dialogo.cancelar') }}
              </VBtn>
              <VBtn
                variant="flat"
                :color="colorConfirmar"
                :loading="cargando"
                :disabled="desactivarConfirmar"
                @click="emit('confirmar')"
              >
                {{ textoConfirmar ?? t('as.dialogo.confirmar') }}
              </VBtn>
            </template>
          </slot>
        </VCardActions>
      </template>
    </VCard>
  </VDialog>
</template>

<style scoped>
.as-dialogo__encabezado {
  display: flex;
  align-items: flex-start;
  gap: var(--as-sp-3);
  padding-block: var(--as-sp-4) var(--as-sp-3);
  padding-inline: var(--as-sp-5) var(--as-sp-4);
}

.as-dialogo__titulos {
  flex: 1 1 auto;
  min-inline-size: 0;
}

.as-dialogo__titulo {
  font-size: var(--as-fs-lg);
  font-weight: var(--as-peso-semi);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

/* Más específico que .v-card-text / .v-card-actions de Vuetify, sin !important */
.as-dialogo__tarjeta .as-dialogo__cuerpo {
  padding-block: var(--as-sp-4);
  padding-inline: var(--as-sp-5);
}

.as-dialogo__tarjeta .as-dialogo__acciones {
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-5);
}
</style>
