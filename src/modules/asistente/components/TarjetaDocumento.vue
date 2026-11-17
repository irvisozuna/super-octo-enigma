<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import * as api from '../services/asistenteApi'
import type { DocumentoAsistente } from '../types'
import { descargarHtml, nombreArchivo } from '../utils/documentos'
import SelloCifras from './SelloCifras.vue'
import VisorDocumento from './VisorDocumento.vue'
import AsDialogo from '@/components/as/AsDialogo.vue'
import { useNotificacion } from '@/composables/useNotificacion'

/* Tarjeta de un informe o presentación dentro de la respuesta (XEL1-712): vista previa y descarga. */
const props = defineProps<{ id: string }>()

const { t } = useI18n()
const notificar = useNotificacion()
const documento = ref<DocumentoAsistente | null>(null)
const fallo = ref(false)
const vistaPrevia = ref(false)
const descargando = ref(false)

onMounted(async () => {
  try {
    documento.value = await api.obtenerDocumento(props.id)
  }
  catch {
    fallo.value = true
  }
})

const esPresentacion = computed(() => documento.value?.tipo === 'presentacion')

async function descargar() {
  if (!documento.value)
    return
  descargando.value = true
  try {
    descargarHtml(await api.htmlDocumento(props.id), nombreArchivo(documento.value.titulo))
  }
  catch (e) {
    notificar.error(e)
  }
  finally {
    descargando.value = false
  }
}
</script>

<template>
  <div
    v-if="documento"
    class="tarjeta-documento"
  >
    <VIcon
      :icon="esPresentacion ? 'tabler-presentation' : 'tabler-file-text'"
      size="28"
      class="tarjeta-documento__icono"
    />
    <div class="tarjeta-documento__textos">
      <div class="tarjeta-documento__titulo">
        {{ documento.titulo }}
      </div>
      <div class="tarjeta-documento__detalle">
        {{ esPresentacion ? t('asistente.documento.presentacion') : t('asistente.documento.informe') }}
        · {{ t('asistente.documento.secciones', { n: documento.secciones }, documento.secciones) }}
      </div>
      <SelloCifras
        v-if="documento.verificacion && documento.verificacion.total > 0"
        :verificacion="documento.verificacion"
        compacto
      />
    </div>
    <div class="tarjeta-documento__acciones">
      <VBtn
        size="small"
        variant="tonal"
        prepend-icon="tabler-eye"
        @click="vistaPrevia = true"
      >
        {{ t('asistente.documento.vistaPrevia') }}
      </VBtn>
      <VBtn
        size="small"
        color="primary"
        prepend-icon="tabler-download"
        :loading="descargando"
        @click="descargar"
      >
        {{ t('asistente.documento.descargar') }}
      </VBtn>
    </div>

    <AsDialogo
      v-model:abierto="vistaPrevia"
      :titulo="documento.titulo"
      :subtitulo="esPresentacion ? t('asistente.documento.ayudaPresentacion') : undefined"
      tamano="completo"
      variante="informativo"
    >
      <VisorDocumento
        v-if="vistaPrevia"
        :id="id"
        :titulo="documento.titulo"
      />
    </AsDialogo>
  </div>
  <div
    v-else-if="fallo"
    class="chat-nota"
  >
    {{ t('asistente.documento.noDisponible') }}
  </div>
</template>

<style scoped>
.tarjeta-documento {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: var(--as-sp-3);
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface));
  gap: var(--as-sp-3);
}

.tarjeta-documento__icono {
  color: rgb(var(--v-theme-primary));
}

.tarjeta-documento__textos {
  flex: 1;
  min-inline-size: 160px;
}

.tarjeta-documento__titulo {
  font-weight: var(--as-peso-semi);
  overflow-wrap: anywhere;
}

.tarjeta-documento__detalle {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
}

.tarjeta-documento__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-sp-2);
}

.chat-nota {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
}
</style>
