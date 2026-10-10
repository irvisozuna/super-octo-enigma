<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizarError } from '../../services/errores'
import type { ErrorReporte } from '../../services/errores'
import { actualizarRolesUsuario, obtenerUsuariosRoles } from '../../services/reportesApi'
import type { ListaUsuariosRoles, UsuarioRoles } from '../../types/admin'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'
import { fechaHoraCorta } from '@/utils/formato'

/*
 * Qué rol tiene cada persona. Los usuarios nacen al iniciar sesión con su cuenta de Aquasoft Comercial;
 * aquí solo se les asigna rol. Qué ve cada rol se define en "Permisos por rol".
 */
const SIN_ROL = '__sin_rol__'

const { t } = useI18n()
const notificacion = useNotificacion()

const lista = ref<ListaUsuariosRoles | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const busqueda = ref('')
const filtroRol = ref<string | null>(null)

const editando = ref<UsuarioRoles | null>(null)
const seleccion = ref<string[]>([])
const guardando = ref(false)
const errorGuardar = ref<string | null>(null)

const roles = computed(() => lista.value?.roles ?? [])

const opcionesRol = computed(() => [
  ...roles.value.map(r => ({ title: `${r.nombre} · ${r.usuarios}`, value: r.nombre })),
  { title: t('reportes.admin.usuarios.sinRol'), value: SIN_ROL },
])

const filas = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()

  return (lista.value?.usuarios ?? []).filter(u => {
    if (filtroRol.value === SIN_ROL && u.roles.length)
      return false
    if (filtroRol.value && filtroRol.value !== SIN_ROL && !u.roles.includes(filtroRol.value))
      return false

    return !texto || u.usuario.toLowerCase().includes(texto) || (u.nombre ?? '').toLowerCase().includes(texto)
  })
})

const filtrosActivos = computed(() => (filtroRol.value ? 1 : 0) + (busqueda.value.trim() ? 1 : 0))

const columnas = computed<ColumnaTabla<UsuarioRoles>[]>(() => [
  { clave: 'usuario', titulo: t('reportes.admin.usuarios.usuario'), formato: 'personalizado', anchoMin: 220 },
  { clave: 'roles', titulo: t('reportes.admin.usuarios.roles'), formato: 'personalizado', ordenable: false, anchoMin: 320 },
  { clave: 'ultima_actividad', titulo: t('reportes.admin.usuarios.ultimaActividad'), formato: 'personalizado', ancho: 180 },
  { clave: 'acciones', titulo: '', formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 150 },
])

const cambios = computed(() => {
  const actual = editando.value?.roles ?? []

  return actual.length !== seleccion.value.length || actual.some(r => !seleccion.value.includes(r))
})

function limpiarFiltros() {
  busqueda.value = ''
  filtroRol.value = null
}

function editar(usuario: UsuarioRoles) {
  editando.value = usuario
  seleccion.value = [...usuario.roles]
  errorGuardar.value = null
}

function cerrar() {
  editando.value = null
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    lista.value = await obtenerUsuariosRoles()
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

async function guardar() {
  const usuario = editando.value
  if (!usuario)
    return
  guardando.value = true
  errorGuardar.value = null
  try {
    await actualizarRolesUsuario(usuario.id, seleccion.value)
    notificacion.exito({ clave: 'reportes.admin.usuarios.guardado', variables: { usuario: usuario.usuario } })
    cerrar()
    await cargar()
  }
  catch (e) {
    const normalizado = normalizarError(e)

    errorGuardar.value = Object.values(normalizado.campos ?? {})[0] ?? normalizado.mensaje ?? t(`reportes.errores.${normalizado.codigo}`)
  }
  finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('reportes.admin.usuarios.titulo')"
      :descripcion="t('reportes.admin.usuarios.descripcion')"
    >
      <template #acciones>
        <AsBtnSecundario
          prepend-icon="tabler-shield-lock"
          :to="{ name: 'reportesAdminPermisos' }"
        >
          {{ t('reportes.admin.usuarios.irPermisos') }}
        </AsBtnSecundario>
      </template>
    </AsEncabezadoPagina>

    <AsBarraFiltros
      class="mb-4"
      :activos="filtrosActivos"
      @limpiar="limpiarFiltros"
    >
      <VSelect
        v-model="filtroRol"
        :items="opcionesRol"
        :placeholder="t('reportes.admin.usuarios.todosRoles')"
        :aria-label="t('reportes.admin.usuarios.filtroRol')"
        prepend-inner-icon="tabler-users-group"
        clearable
        class="as-filtro--lg"
      />
      <template #fin>
        <VTextField
          v-model="busqueda"
          :placeholder="t('reportes.admin.usuarios.buscar')"
          :aria-label="t('reportes.admin.usuarios.buscar')"
          prepend-inner-icon="tabler-search"
          clearable
          class="as-filtro--lg"
        />
      </template>
    </AsBarraFiltros>

    <AsTablaDatos
      :columnas="columnas"
      :filas="filas"
      clave-fila="id"
      :cargando="cargando"
      :error="error"
      :por-pagina="50"
      :orden="[{ key: 'usuario', order: 'asc' }]"
      clic-fila
      mostrar-detalle-error
      :vacio-titulo="t('reportes.admin.usuarios.vacioTitulo')"
      :vacio-detalle="t('reportes.admin.usuarios.vacioDetalle')"
      vacio-icono="tabler-user-off"
      @fila="(fila: any) => editar(fila)"
      @reintentar="cargar"
    >
      <template #celda-usuario="{ fila }">
        <div class="py-1">
          <span class="font-weight-medium">{{ fila.usuario }}</span>
          <VChip
            v-if="fila.soy_yo"
            size="x-small"
            label
            color="primary"
            variant="tonal"
            class="ms-2"
          >
            {{ t('reportes.admin.usuarios.tu') }}
          </VChip>
          <div
            v-if="fila.nombre && fila.nombre !== fila.usuario"
            class="as-secundario"
          >
            {{ fila.nombre }}
          </div>
        </div>
      </template>

      <template #celda-roles="{ fila }">
        <div
          v-if="fila.roles.length"
          class="d-flex flex-wrap gap-1 py-1"
        >
          <VChip
            v-for="rol in fila.roles"
            :key="rol"
            size="small"
            label
            variant="tonal"
            :color="rol === 'user' ? undefined : 'primary'"
          >
            {{ rol }}
          </VChip>
        </div>
        <span
          v-else
          class="as-secundario"
        >{{ t('reportes.admin.usuarios.sinRol') }}</span>
      </template>

      <template #celda-ultima_actividad="{ fila }">
        <span
          v-if="fila.ultima_actividad"
          class="as-num"
        >{{ fechaHoraCorta(fila.ultima_actividad) }}</span>
        <span
          v-else
          class="as-secundario"
        >{{ t('reportes.admin.usuarios.sinActividad') }}</span>
      </template>

      <template #celda-acciones="{ fila }">
        <AsBtnTerciario
          size="small"
          prepend-icon="tabler-pencil"
          @click.stop="editar(fila as UsuarioRoles)"
        >
          {{ t('reportes.admin.usuarios.cambiar') }}
        </AsBtnTerciario>
      </template>
    </AsTablaDatos>

    <AsDialogo
      :abierto="!!editando"
      :titulo="t('reportes.admin.usuarios.dialogoTitulo')"
      :subtitulo="editando ? (editando.nombre && editando.nombre !== editando.usuario ? `${editando.usuario} · ${editando.nombre}` : editando.usuario) : undefined"
      tamano="sm"
      :cargando="guardando"
      :texto-confirmar="t('reportes.admin.usuarios.guardar')"
      :desactivar-confirmar="!cambios"
      @update:abierto="(v: boolean) => { if (!v) cerrar() }"
      @confirmar="guardar"
    >
      <VAlert
        v-if="errorGuardar"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ errorGuardar }}
      </VAlert>

      <VCheckbox
        v-for="rol in roles"
        :key="rol.id"
        v-model="seleccion"
        :value="rol.nombre"
        :disabled="!rol.asignable || guardando"
        density="compact"
        hide-details
        class="usuarios-rol"
      >
        <template #label>
          <div>
            <span class="font-weight-medium">{{ rol.nombre }}</span>
            <div
              v-if="rol.nombre === 'user' || rol.es_admin"
              class="as-secundario"
            >
              {{ t(rol.es_admin ? 'reportes.admin.usuarios.ayudaAdmin' : 'reportes.admin.usuarios.ayudaBase') }}
            </div>
          </div>
        </template>
      </VCheckbox>

      <p class="as-secundario mt-4 mb-0">
        {{ t('reportes.admin.usuarios.aplica') }}
      </p>
    </AsDialogo>
  </div>
</template>

<style scoped>
.usuarios-rol + .usuarios-rol {
  margin-block-start: 4px;
}
</style>
