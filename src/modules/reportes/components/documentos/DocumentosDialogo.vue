<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentos } from '../../composables/useDocumentos'
import EstadoError from '../comunes/EstadoError.vue'
import { useAppManager } from '@/composables/useAppManager'

const props = defineProps<{
  contrato: string
  nombre?: string
}>()

const { t } = useI18n()
const { closeDialog } = useAppManager()

const {
  documentos, periodos, documento, seleccionado, periodo,
  cargando, generando, error, resultado, urlPdf, puedeGenerar,
  cargar, generar, descargar,
} = useDocumentos(props.contrato)

const visor = ref<HTMLIFrameElement | null>(null)

function imprimir() {
  const ventana = visor.value?.contentWindow
  if (!ventana)
    return
  ventana.focus()
  ventana.print()
}

onMounted(cargar)
</script>

<template>
  <DialogCloseBtn @click="closeDialog" />
  <VCard>
    <VCardItem>
      <VCardTitle>{{ t('reportes.documentos.titulo') }}</VCardTitle>
      <VCardSubtitle>
        {{ t('reportes.documentos.cuenta', { cuenta: contrato }) }}
        <template v-if="nombre">
          · {{ nombre }}
        </template>
      </VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="4"
        >
          <VSelect
            v-model="seleccionado"
            :items="documentos"
            item-title="titulo"
            item-value="key"
            :label="t('reportes.documentos.documento')"
            :loading="cargando"
            :no-data-text="t('reportes.documentos.sinDocumentos')"
          />
          <p
            v-if="documento?.descripcion"
            class="text-body-2 text-medium-emphasis mt-2"
          >
            {{ documento.descripcion }}
          </p>

          <AppAutocomplete
            v-if="documento?.requiere_periodo"
            v-model="periodo"
            :items="periodos"
            item-title="label"
            item-value="value"
            :label="t('reportes.documentos.periodo')"
            :loading="cargando"
            class="mt-4"
          />

          <VBtn
            class="mt-4"
            color="primary"
            block
            :loading="generando"
            :disabled="!puedeGenerar"
            @click="generar"
          >
            <VIcon
              icon="tabler-file-type-pdf"
              class="me-2"
            />{{ t('reportes.documentos.generar') }}
          </VBtn>

          <template v-if="urlPdf">
            <VBtn
              class="mt-2"
              variant="outlined"
              block
              @click="descargar"
            >
              <VIcon
                icon="tabler-download"
                class="me-2"
              />{{ t('reportes.documentos.descargar') }}
            </VBtn>
            <VBtn
              class="mt-2"
              variant="outlined"
              block
              @click="imprimir"
            >
              <VIcon
                icon="tabler-printer"
                class="me-2"
              />{{ t('reportes.documentos.imprimir') }}
            </VBtn>
            <p
              v-if="resultado"
              class="text-caption text-medium-emphasis mt-2"
            >
              {{ resultado.nombre_archivo }}
            </p>
          </template>
        </VCol>

        <VCol
          cols="12"
          md="8"
        >
          <EstadoError
            v-if="error"
            :error="error"
            @reintentar="generar"
          />
          <iframe
            v-else-if="urlPdf"
            ref="visor"
            :src="urlPdf"
            :title="resultado?.nombre_archivo ?? t('reportes.documentos.titulo')"
            class="documento-visor"
          />
          <div
            v-else
            class="documento-vacio text-medium-emphasis"
          >
            <VIcon
              icon="tabler-file-description"
              size="44"
            />
            <p class="mb-0">
              {{ generando ? t('reportes.documentos.generando') : t('reportes.documentos.vacio') }}
            </p>
          </div>
        </VCol>
      </VRow>
    </VCardText>

    <VCardActions>
      <VSpacer />
      <VBtn
        variant="text"
        @click="closeDialog"
      >
        {{ t('reportes.comunes.cerrar') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<style scoped>
.documento-visor {
  border: 0;
  block-size: 70vh;
  inline-size: 100%;
}

.documento-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-block-size: 40vh;
  text-align: center;
}
</style>
