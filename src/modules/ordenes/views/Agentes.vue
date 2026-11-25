<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentes } from '../composables/useOrdenes'
import { cerrarSesionAgente, obtenerCatalogo, obtenerUsuariosAgente } from '../services/ordenesApi'
import type { Agente, EdicionAgente, TipoOrden, UsuarioAgente } from '../types/ordenes'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { entero, fechaHoraCorta } from '@/utils/formato'

/*
 * Agentes de campo del núcleo (pantalla AgentesWeb del prototipo, XEL1-674): los ve quien lee órdenes; los da de
 * alta el supervisor de campo o quien administra órdenes, con su acceso a la app en un solo paso.
 */
const { t } = useI18n()
const notificar = useNotificacion()
const a = useAgentes()
const tipos = ref<TipoOrden[]>([])
const editando = ref<Agente | null>(null)
const abierto = ref(false)
const edicion = reactive<EdicionAgente>({ nombre: '', tipos: [], activo: true, usuario: null, usa_app: false, gerencias: [] })

const opcionesTipo = computed(() => tipos.value.map(x => ({ value: x.codigo, title: x.nombre })))
const nombreTipo = (codigo: string) => tipos.value.find(x => x.codigo === codigo)?.nombre ?? codigo
const opcionesGerencia = computed(() => a.gerencias.value.map(g => ({ value: g.id, title: g.nombre })))
const nombreGerencia = (id: number) => a.gerencias.value.find(g => g.id === id)?.nombre ?? String(id)

const columnas: ColumnaTabla<Agente>[] = [
  { clave: 'nombre', titulo: t('ordenes.agentes.nombre'), formato: 'personalizado', anchoMin: 240 },
  { clave: 'tipos', titulo: t('ordenes.agentes.tipos'), formato: 'personalizado', ordenable: false, anchoMin: 180 },
  { clave: 'carga.abiertas', titulo: t('ordenes.agentes.abiertas'), formato: 'personalizado', ancho: 110, alineacion: 'end' },
  { clave: 'carga.cerradas_hoy', titulo: t('ordenes.agentes.hoy'), formato: 'personalizado', ancho: 110, alineacion: 'end' },
  { clave: 'carga.ultima_captura', titulo: t('ordenes.agentes.ultima'), formato: 'personalizado', ancho: 150 },
  { clave: 'usa_app', titulo: t('ordenes.agentes.app'), formato: 'personalizado', ancho: 240 },
  { clave: 'activo', titulo: t('ordenes.agentes.activo'), formato: 'personalizado', ancho: 120 },
]

/** Cómo está su acceso a la app, como en el prototipo. */
function estadoApp(f: Agente): { texto: string; color: string } {
  if (!f.usuario)
    return { texto: t('ordenes.agentes.sinUsuario'), color: 'secondary' }
  if (!f.usa_app)
    return { texto: t('ordenes.agentes.appSinAcceso'), color: 'secondary' }
  if (!f.ultimo_acceso)
    return { texto: t('ordenes.agentes.appSinIngreso'), color: 'warning' }

  return { texto: t('ordenes.agentes.appActiva', { cuando: fechaHoraCorta(f.ultimo_acceso) }), color: 'success' }
}

// Búsqueda de usuarios en el servidor: solo nombre y usuario, al menos 2 letras
const busqueda = ref('')
const resultados = ref<UsuarioAgente[]>([])
const buscando = ref(false)
let temporizador: ReturnType<typeof setTimeout> | undefined
let peticion: AbortController | undefined

const opcionesUsuario = computed(() => {
  const lista = resultados.value.map(u => ({
    value: u.usuario,
    title: `${u.nombre} · ${u.usuario}`,
    subtitle: u.agente && u.agente_id !== editando.value?.id ? t('ordenes.agentes.deOtro', { agente: u.agente }) : undefined,
    disabled: !!u.agente && u.agente_id !== editando.value?.id,
  }))

  // El usuario ya ligado siempre se puede ver aunque no salga en la búsqueda actual
  if (edicion.usuario && !lista.some(o => o.value === edicion.usuario))
    lista.unshift({ value: edicion.usuario, title: edicion.usuario, subtitle: undefined, disabled: false })

  return lista
})

watch(busqueda, q => {
  clearTimeout(temporizador)

  const texto = (q ?? '').trim()
  if (texto.length < 2 || texto === edicion.usuario) {
    resultados.value = resultados.value.filter(u => u.usuario === edicion.usuario)

    return
  }
  temporizador = setTimeout(async () => {
    peticion?.abort()
    peticion = new AbortController()
    buscando.value = true
    try {
      resultados.value = (await obtenerUsuariosAgente(texto, { signal: peticion.signal })).usuarios
    }
    catch {
      // Una búsqueda cancelada o fallida deja la lista anterior; el guardado avisa si algo no cuadra
    }
    finally {
      buscando.value = false
    }
  }, 300)
})

const faltaUsuario = computed(() => edicion.usa_app && !edicion.usuario)

function abrir(agente: Agente | null) {
  editando.value = agente
  Object.assign(edicion, agente
    ? { nombre: agente.nombre, tipos: [...agente.tipos], activo: agente.activo, usuario: agente.usuario ?? null, usa_app: !!agente.usa_app, gerencias: [...(agente.gerencias ?? [])] }
    : { nombre: '', tipos: [], activo: true, usuario: null, usa_app: true, gerencias: [] })
  resultados.value = []
  busqueda.value = ''
  a.errorGuardar.value = null
  abierto.value = true
}

async function guardar() {
  // Sin acceso a la app el usuario puede quedarse ligado; con acceso, el usuario es obligatorio
  if (await a.guardar(editando.value?.id ?? null, { ...edicion, usuario: edicion.usuario || null })) {
    abierto.value = false
    notificar.exito(t('ordenes.agentes.guardado'))
  }
}

// «Cerrar sesión en su teléfono»
const confirmarCierre = ref(false)
const cerrando = ref(false)

async function cerrarSesion() {
  if (!editando.value)
    return
  cerrando.value = true
  try {
    const r = await cerrarSesionAgente(editando.value.id)

    confirmarCierre.value = false
    notificar.exito(t('ordenes.agentes.sesionCerrada', { n: r.sesiones_cerradas }))
    await a.cargar()
  }
  catch (e) {
    notificar.error(e)
  }
  finally {
    cerrando.value = false
  }
}

onMounted(async () => {
  tipos.value = (await obtenerCatalogo().catch(() => null))?.tipos ?? []
  await a.cargar()
})
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('ordenes.agentes.titulo')"
      :descripcion="t('ordenes.agentes.descripcion')"
    >
      <template #acciones>
        <AsBtnPrimario
          v-if="a.puedeAdministrar.value"
          prepend-icon="tabler-user-plus"
          @click="abrir(null)"
        >
          {{ t('ordenes.agentes.nuevo') }}
        </AsBtnPrimario>
      </template>
    </AsEncabezadoPagina>
    <VAlert
      v-if="!a.cargando.value && a.agentes.value.length && !a.puedeAdministrar.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('ordenes.agentes.soloLectura') }}
    </VAlert>
    <AsTablaDatos
      :columnas="columnas"
      :filas="a.agentes.value"
      clave-fila="id"
      :cargando="a.cargando.value"
      :error="a.error.value"
      :clic-fila="a.puedeAdministrar.value"
      :vacio-titulo="t('ordenes.agentes.sinFilas')"
      vacio-detalle=""
      vacio-icono="tabler-users"
      @fila="(f: Record<string, unknown>) => abrir(f as unknown as Agente)"
      @reintentar="a.cargar()"
    >
      <template #celda-nombre="{ fila }">
        <div>{{ fila.nombre }}</div>
        <div
          v-if="fila.usuario"
          class="text-body-2 text-medium-emphasis"
        >
          {{ fila.usuario }}
        </div>
      </template>
      <template #celda-tipos="{ fila }">
        <div>{{ fila.tipos.map(nombreTipo).join(', ') || '—' }}</div>
        <div
          v-if="fila.gerencias?.length"
          class="text-body-2 text-medium-emphasis"
        >
          {{ fila.gerencias.map(nombreGerencia).join(', ') }}
        </div>
      </template>
      <!-- Carga (XEL1-680) -->
      <template #celda-carga.abiertas="{ fila }">
        <span class="as-num">{{ entero(fila.carga?.abiertas ?? 0) }}</span>
      </template>
      <template #celda-carga.cerradas_hoy="{ fila }">
        <span
          class="as-num"
          :class="{ 'as-secundario': !fila.carga?.cerradas_hoy }"
        >{{ entero(fila.carga?.cerradas_hoy ?? 0) }}</span>
      </template>
      <template #celda-carga.ultima_captura="{ fila }">
        <span class="as-num">{{ fechaHoraCorta(fila.carga?.ultima_captura) }}</span>
      </template>
      <template #celda-usa_app="{ fila }">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="estadoApp(fila).color"
        >
          {{ estadoApp(fila).texto }}
        </VChip>
      </template>
      <template #celda-activo="{ fila }">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="fila.activo ? 'success' : 'secondary'"
        >
          {{ fila.activo ? t('ordenes.agentes.activo') : t('ordenes.agentes.inactivo') }}
        </VChip>
      </template>
    </AsTablaDatos>

    <AsDialogo
      v-model:abierto="abierto"
      :titulo="editando ? t('ordenes.agentes.editar') : t('ordenes.agentes.nuevo')"
      tamano="sm"
      :cargando="a.guardando.value"
      :texto-confirmar="t('ordenes.agentes.guardar')"
      :desactivar-confirmar="!edicion.nombre.trim() || faltaUsuario"
      @confirmar="guardar"
    >
      <VAlert
        v-if="a.errorGuardar.value"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ a.errorGuardar.value.mensaje }}
      </VAlert>
      <VTextField
        v-model="edicion.nombre"
        :label="t('ordenes.agentes.nombre')"
        maxlength="200"
        class="mb-3"
      />
      <VSelect
        v-model="edicion.tipos"
        :items="opcionesTipo"
        :label="t('ordenes.agentes.tipos')"
        multiple
        chips
        class="mb-3"
      />
      <VSelect
        v-model="edicion.gerencias"
        :items="opcionesGerencia"
        :label="t('ordenes.agentes.gerencias')"
        :hint="t('ordenes.agentes.gerenciasAyuda')"
        persistent-hint
        multiple
        chips
        clearable
        class="mb-3"
      />

      <VSwitch
        v-model="edicion.usa_app"
        :label="t('ordenes.agentes.usaApp')"
        :hint="t('ordenes.agentes.usaAppAyuda')"
        persistent-hint
        class="mb-3"
      />
      <template v-if="edicion.usa_app">
        <VAutocomplete
          v-model="edicion.usuario"
          v-model:search="busqueda"
          :items="opcionesUsuario"
          :label="t('ordenes.agentes.buscarUsuario')"
          :hint="t('ordenes.agentes.buscarUsuarioAyuda')"
          :loading="buscando"
          :no-data-text="busqueda.trim().length < 2 ? t('ordenes.agentes.escribeDos') : t('ordenes.agentes.sinResultados')"
          :error-messages="faltaUsuario ? t('ordenes.agentes.faltaUsuario') : undefined"
          persistent-hint
          no-filter
          clearable
          class="mb-2"
        />
        <p class="text-body-2 text-medium-emphasis mb-3">
          {{ t('ordenes.agentes.soloSusVisitas') }}
        </p>
      </template>

      <VSwitch
        v-model="edicion.activo"
        :label="t('ordenes.agentes.activo')"
        hide-details
        density="compact"
      />

      <VAlert
        v-if="editando?.usuario"
        variant="tonal"
        color="secondary"
        density="compact"
        class="mt-4"
      >
        <div class="text-subtitle-2 mb-1">
          {{ t('ordenes.agentes.telefono') }}
        </div>
        <div class="text-body-2 mb-2">
          {{ t('ordenes.agentes.telefonoTexto') }}
        </div>
        <VBtn
          variant="outlined"
          size="small"
          prepend-icon="tabler-logout"
          @click="confirmarCierre = true"
        >
          {{ t('ordenes.agentes.cerrarSesion') }}
        </VBtn>
      </VAlert>
    </AsDialogo>

    <AsDialogo
      v-model:abierto="confirmarCierre"
      :titulo="t('ordenes.agentes.cerrarSesionTitulo', { usuario: editando?.usuario ?? '' })"
      tamano="sm"
      :cargando="cerrando"
      :texto-confirmar="t('ordenes.agentes.cerrarSesion')"
      @confirmar="cerrarSesion"
    >
      {{ t('ordenes.agentes.cerrarSesionTexto') }}
    </AsDialogo>
  </div>
</template>
