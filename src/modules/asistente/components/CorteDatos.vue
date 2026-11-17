<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '../stores/asistenteStore'

/*
 * "Datos al corte de…" en la barra superior (XEL1-721): la hora de la última sincronización con Aquasoft Comercial.
 * Punto verde si es de la última hora; ámbar si tiene más, para que se note que las cifras pueden ir atrasadas.
 */
const store = useAsistenteStore()
const { estado } = storeToRefs(store)
const { t } = useI18n()

onMounted(() => {
  if (!estado.value)
    store.cargarEstado()
})

const corte = computed(() => (estado.value?.corte ? new Date(estado.value.corte.al) : null))
const atrasadas = computed(() => estado.value?.corte?.atrasadas ?? [])
const reciente = computed(() => !!corte.value && Date.now() - corte.value.getTime() < 3_600_000 && !atrasadas.value.length)

/** Nombre legible de cada fuente de la sincronización. */
const FUENTES: Record<string, string> = {
  contracts: 'contratos',
  readings: 'lecturas',
  readings_modified: 'lecturas corregidas',
  reading_app: 'app de lectura',
  tracking: 'recorridos',
  catalogs: 'catálogos',
  aggregate: 'resúmenes',
}

const ayuda = computed(() => {
  if (!atrasadas.value.length)
    return t('asistente.corte.ayuda')
  const lista = atrasadas.value.map(a => `${FUENTES[a.fuente] ?? a.fuente} (${new Date(a.al).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })})`).join(', ')

  return t('asistente.corte.atrasadas', { lista })
})

const texto = computed(() => {
  if (!corte.value)
    return ''
  const hoy = new Date().toDateString() === corte.value.toDateString()
  const hora = corte.value.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })

  return hoy ? hora : `${corte.value.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '')} ${hora}`
})
</script>

<template>
  <div
    v-if="corte"
    class="corte-datos"
    :title="ayuda"
  >
    <span
      class="corte-datos__punto"
      :class="reciente ? 'corte-datos__punto--ok' : 'corte-datos__punto--atrasado'"
      aria-hidden="true"
    />
    {{ t('asistente.corte.texto', { hora: texto }) }}
  </div>
</template>

<style scoped>
.corte-datos {
  display: flex;
  align-items: center;
  border: var(--as-borde);
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-2);
  padding-block: 6px;
  padding-inline: var(--as-sp-3);
  white-space: nowrap;
}

.corte-datos__punto {
  border-radius: 50%;
  block-size: 8px;
  inline-size: 8px;
}

.corte-datos__punto--ok {
  background: rgb(var(--v-theme-success));
}

.corte-datos__punto--atrasado {
  background: rgb(var(--v-theme-warning));
}
</style>
