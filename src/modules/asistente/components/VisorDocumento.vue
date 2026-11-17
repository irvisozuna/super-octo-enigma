<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as api from '../services/asistenteApi'
import { descargarHtml, nombreArchivo } from '../utils/documentos'
import { useNotificacion } from '@/composables/useNotificacion'

/*
 * Vista previa de un informe o presentación del asistente (XEL1-712). El HTML lo arma el servidor con su plantilla y
 * se pinta en un iframe aislado: `srcdoc` con sandbox sin scripts (el archivo además trae su política de contenido).
 * `allow-same-origin` solo deja que este componente mande imprimir el iframe; `allow-modals`, que abra el diálogo de
 * impresión, desde donde se guarda como PDF.
 */
const props = defineProps<{
  id: string
  titulo: string
  alto?: string
}>()

const { t } = useI18n()
const notificar = useNotificacion()
const html = ref('')
const cargando = ref(true)
const marco = ref<HTMLIFrameElement | null>(null)

onMounted(async () => {
  try {
    html.value = await api.htmlDocumento(props.id)
  }
  catch (e) {
    notificar.error(e)
  }
  finally {
    cargando.value = false
  }
})

function descargar() {
  if (html.value)
    descargarHtml(html.value, nombreArchivo(props.titulo))
}

function imprimir() {
  marco.value?.contentWindow?.focus()
  marco.value?.contentWindow?.print()
}
</script>

<template>
  <div class="visor-documento">
    <div class="visor-documento__acciones">
      <VBtn
        color="primary"
        prepend-icon="tabler-download"
        :disabled="!html"
        @click="descargar"
      >
        {{ t('asistente.documento.descargar') }}
      </VBtn>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-printer"
        :disabled="!html"
        @click="imprimir"
      >
        {{ t('asistente.documento.imprimir') }}
      </VBtn>
      <span class="visor-documento__ayuda">{{ t('asistente.documento.ayudaPdf') }}</span>
    </div>
    <div
      class="visor-documento__marco"
      :style="{ blockSize: alto ?? '70vh' }"
    >
      <VProgressCircular
        v-if="cargando"
        indeterminate
        class="visor-documento__cargando"
      />
      <iframe
        v-else-if="html"
        ref="marco"
        :srcdoc="html"
        :title="titulo"
        sandbox="allow-same-origin allow-modals"
        referrerpolicy="no-referrer"
      />
      <p
        v-else
        class="visor-documento__vacio"
      >
        {{ t('asistente.documento.noDisponible') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.visor-documento {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-3);
}

.visor-documento__acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-sp-2);
}

.visor-documento__ayuda {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
}

.visor-documento__marco {
  position: relative;
  overflow: hidden;
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface-variant));
}

.visor-documento__marco iframe {
  border: 0;
  block-size: 100%;
  inline-size: 100%;
}

.visor-documento__cargando {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
}

.visor-documento__vacio {
  padding: var(--as-sp-4);
}
</style>
