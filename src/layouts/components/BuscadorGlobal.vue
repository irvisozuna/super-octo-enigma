<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '@/modules/asistente'
import { obtenerMenu } from '@/modules/reportes/services/reportesApi'
import type { ElementoMenu } from '@/modules/reportes/types/api'
import { useAbility } from '@/plugins/casl/composables/useAbility'

/*
 * Buscador de la barra superior (XEL1-721): conversaciones del asistente y reportes o tableros; si no hay lo que busca,
 * ofrece preguntarle al asistente. Se abre con clic o con ⌘K / Ctrl+K. Sustituye al buscador de la plantilla, que
 * buscaba páginas de demostración.
 */
const { t } = useI18n()
const router = useRouter()
const ability = useAbility()
const { smAndDown } = useDisplay()
const asistente = useAsistenteStore()
const { conversaciones } = storeToRefs(asistente)

const abierto = ref(false)
const consulta = ref('')
const reportes = ref<ElementoMenu[]>([])
const cargando = ref(false)
const campo = ref<HTMLInputElement | null>(null)

const usaAsistente = computed(() => ability.can('use', 'asistente'))
const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const resultadosConversaciones = computed(() => {
  if (!usaAsistente.value)
    return []
  const q = normalizar(consulta.value.trim())

  return conversaciones.value.filter(c => !q || normalizar(c.titulo).includes(q)).slice(0, q ? 6 : 4)
})

const resultadosReportes = computed(() => {
  const q = normalizar(consulta.value.trim())
  if (!q)
    return []

  return reportes.value.filter(r => normalizar(`${r.titulo} ${r.descripcion ?? ''}`).includes(q)).slice(0, 6)
})

async function cargar() {
  cargando.value = true
  try {
    const tareas: Promise<unknown>[] = [obtenerMenu().then(m => {
      reportes.value = m.categorias.flatMap(c => c.elementos).filter(e => e.tipo === 'reporte' || e.tipo === 'tablero')
    })]

    if (usaAsistente.value && !conversaciones.value.length)
      tareas.push(asistente.cargarConversaciones())
    await Promise.allSettled(tareas)
  }
  finally {
    cargando.value = false
  }
}

watch(abierto, async si => {
  if (!si)
    return
  consulta.value = ''
  if (!reportes.value.length)
    cargar()

  // El diálogo se monta con animación: se espera a que exista el campo para darle el foco
  for (let i = 0; i < 10 && !campo.value; i++)
    await new Promise(resolve => setTimeout(resolve, 30))
  await nextTick()
  campo.value?.focus()
})

function cerrar() {
  abierto.value = false
}

async function abrirConversacion(id: string) {
  cerrar()
  await router.push({ name: 'asistente' })
  await asistente.abrir(id)
}

function abrirReporte(r: ElementoMenu) {
  cerrar()
  router.push(r.tipo === 'tablero' ? `/reportes/tableros/${r.key}` : `/reportes/${r.key}`)
}

async function preguntar() {
  const pregunta = consulta.value.trim()
  if (!pregunta)
    return
  cerrar()
  await router.push({ name: 'asistente' })
  asistente.nueva()
  asistente.enviar(pregunta)
}

/** Enter abre el primer resultado; si no hay, le pregunta al asistente. */
function alEnter() {
  const conversacion = resultadosConversaciones.value[0]
  const reporte = resultadosReportes.value[0]
  if (consulta.value.trim() && conversacion && normalizar(conversacion.titulo).includes(normalizar(consulta.value.trim())))
    abrirConversacion(conversacion.id)
  else if (reporte)
    abrirReporte(reporte)
  else if (usaAsistente.value)
    preguntar()
}

function atajo(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    abierto.value = !abierto.value
  }
}

onMounted(() => window.addEventListener('keydown', atajo))
onBeforeUnmount(() => window.removeEventListener('keydown', atajo))
</script>

<template>
  <IconBtn
    v-if="smAndDown"
    :aria-label="t('asistente.buscador.abrir')"
    @click="abierto = true"
  >
    <VIcon icon="tabler-search" />
  </IconBtn>
  <button
    v-else
    type="button"
    class="buscador-global"
    @click="abierto = true"
  >
    <VIcon
      icon="tabler-search"
      size="18"
      class="buscador-global__icono"
    />
    <span class="buscador-global__texto">{{ usaAsistente ? t('asistente.buscador.placeholder') : t('asistente.buscador.placeholderReportes') }}</span>
    <kbd class="buscador-global__atajo">{{ esMac ? '⌘' : 'Ctrl' }} K</kbd>
  </button>

  <VDialog
    v-model="abierto"
    max-width="640"
    location="top"
    class="buscador-dialogo"
  >
    <VCard>
      <div class="buscador-dialogo__campo">
        <VIcon
          icon="tabler-search"
          size="20"
        />
        <label
          for="buscador-global"
          class="d-sr-only"
        >{{ t('asistente.buscador.abrir') }}</label>
        <input
          id="buscador-global"
          ref="campo"
          v-model="consulta"
          type="search"
          autofocus
          :placeholder="usaAsistente ? t('asistente.buscador.placeholder') : t('asistente.buscador.placeholderReportes')"
          @keydown.enter.prevent="alEnter"
          @keydown.esc="cerrar"
        >
        <kbd class="buscador-global__atajo">Esc</kbd>
      </div>
      <VDivider />
      <VProgressLinear
        v-if="cargando"
        indeterminate
        height="2"
      />
      <VList
        density="compact"
        class="buscador-dialogo__lista"
      >
        <template v-if="resultadosConversaciones.length">
          <VListSubheader>{{ t('asistente.buscador.conversaciones') }}</VListSubheader>
          <VListItem
            v-for="c in resultadosConversaciones"
            :key="c.id"
            prepend-icon="tabler-message"
            :title="c.titulo"
            @click="abrirConversacion(c.id)"
          />
        </template>
        <template v-if="resultadosReportes.length">
          <VListSubheader>{{ t('asistente.buscador.reportes') }}</VListSubheader>
          <VListItem
            v-for="r in resultadosReportes"
            :key="r.key"
            :prepend-icon="r.tipo === 'tablero' ? 'tabler-layout-dashboard' : 'tabler-file-text'"
            :title="r.titulo"
            :subtitle="r.categoria ?? undefined"
            @click="abrirReporte(r)"
          />
        </template>
        <template v-if="usaAsistente && consulta.trim()">
          <VListSubheader>{{ t('asistente.buscador.ayuda') }}</VListSubheader>
          <VListItem
            prepend-icon="tabler-sparkles"
            :title="t('asistente.buscador.preguntar', { pregunta: consulta.trim() })"
            @click="preguntar"
          />
        </template>
        <VListItem
          v-if="consulta.trim() && !resultadosConversaciones.length && !resultadosReportes.length && !usaAsistente && !cargando"
          :title="t('asistente.buscador.sinResultados')"
          disabled
        />
      </VList>
    </VCard>
  </VDialog>
</template>

<style scoped>
.buscador-global {
  display: flex;
  flex: 1 1 320px;
  align-items: center;
  border: var(--as-borde);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  cursor: pointer;
  font: inherit;
  font-size: var(--as-fs-sm);
  gap: 10px;
  max-inline-size: 560px;
  min-block-size: 44px;
  padding-block: 0;
  padding-inline: 14px var(--as-sp-3);
  text-align: start;
}

.buscador-global:hover,
.buscador-global:focus-visible {
  border-color: rgb(var(--v-theme-primary));
}

.buscador-global__texto {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buscador-global__atajo {
  border-radius: 6px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-family: inherit;
  font-size: var(--as-fs-xs);
  font-weight: var(--as-peso-medio);
  padding-block: 2px;
  padding-inline: var(--as-sp-2);
  white-space: nowrap;
}

.buscador-dialogo__campo {
  display: flex;
  align-items: center;
  gap: var(--as-sp-3);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}

.buscador-dialogo__campo input {
  flex: 1;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: 1rem;
  min-inline-size: 0;
  outline: 0;
}

.buscador-dialogo__lista {
  max-block-size: 60vh;
}
</style>
