<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import VisorDocumento from '../components/VisorDocumento.vue'
import * as api from '../services/asistenteApi'
import type { DocumentoAsistente } from '../types'
import AsEncabezadoPagina from '@/components/as/AsEncabezadoPagina.vue'

/* Informe o presentación del asistente en pantalla completa (XEL1-712): a donde lleva el enlace de la respuesta. */
const route = useRoute()
const { t } = useI18n()
const id = String(route.params.id)
const documento = ref<DocumentoAsistente | null>(null)
const fallo = ref(false)

onMounted(async () => {
  try {
    documento.value = await api.obtenerDocumento(id)
  }
  catch {
    fallo.value = true
  }
})
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="documento?.titulo ?? t('asistente.documento.titulo')"
      :descripcion="documento?.tipo === 'presentacion' ? t('asistente.documento.ayudaPresentacion') : undefined"
      icono="tabler-sparkles"
      :volver="{ texto: t('asistente.titulo'), to: { name: 'asistente' } }"
    />
    <VisorDocumento
      v-if="documento"
      :id="id"
      :titulo="documento.titulo"
      alto="calc(100vh - 230px)"
    />
    <p v-else-if="fallo">
      {{ t('asistente.documento.noDisponible') }}
    </p>
    <VProgressCircular
      v-else
      indeterminate
    />
  </div>
</template>
