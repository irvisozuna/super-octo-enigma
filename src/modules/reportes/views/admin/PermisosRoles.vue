<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import EstadoError from '../../components/comunes/EstadoError.vue'
import { useMenuReportes } from '../../composables/useMenuReportes'
import { normalizarError } from '../../services/errores'
import type { ErrorReporte } from '../../services/errores'
import { actualizarPermisosRol, obtenerMatrizPermisos } from '../../services/reportesApi'
import type { MatrizPermisos, ObjetoPermisos } from '../../types/admin'

const { t } = useI18n()
const menuReportes = useMenuReportes()

const matriz = ref<MatrizPermisos | null>(null)
const cargando = ref(false)
const guardando = ref(false)
const error = ref<ErrorReporte | null>(null)
const aviso = ref<string | null>(null)
const rol = ref<string | null>(null)
const seleccion = ref<Set<string>>(new Set())
const busqueda = ref('')

const roles = computed(() => (matriz.value?.roles ?? []).filter(r => !r.es_admin))
const asignados = computed(() => new Set(matriz.value?.asignaciones[rol.value ?? ''] ?? []))

const cambios = computed(() => {
  const actual = asignados.value
  const nuevo = seleccion.value

  return [...actual].some(p => !nuevo.has(p)) || [...nuevo].some(p => !actual.has(p))
})

const TIPOS: Record<string, string> = { reporte: 'admin.permisos.reportes', tablero: 'admin.permisos.tableros', documento: 'admin.permisos.documentos' }

interface Grupo {
  tipo: string
  titulo: string
  objetos: ObjetoPermisos[]
}

const grupos = computed<Grupo[]>(() => {
  const texto = busqueda.value.trim().toLowerCase()
  const objetos = (matriz.value?.objetos ?? []).filter(o => !texto || o.titulo.toLowerCase().includes(texto) || (o.categoria ?? '').toLowerCase().includes(texto))

  return Object.entries(TIPOS)
    .map(([tipo, clave]) => ({ tipo, titulo: t(`reportes.${clave}`), objetos: objetos.filter(o => o.tipo === tipo) }))
    .filter(g => g.objetos.length > 0)
})

function restaurar() {
  seleccion.value = new Set(asignados.value)
}

function alternar(nombre: string, activo: boolean) {
  const nuevo = new Set(seleccion.value)
  if (activo)
    nuevo.add(nombre)
  else
    nuevo.delete(nombre)
  seleccion.value = nuevo
}

function alternarGrupo(grupo: Grupo, accion: string, activo: boolean) {
  const nuevo = new Set(seleccion.value)
  for (const objeto of grupo.objetos) {
    for (const permiso of objeto.permisos) {
      if (permiso.accion === accion) {
        if (activo)
          nuevo.add(permiso.nombre)
        else
          nuevo.delete(permiso.nombre)
      }
    }
  }
  seleccion.value = nuevo
}

function todosDelGrupo(grupo: Grupo, accion: string): boolean {
  const nombres = grupo.objetos.flatMap(o => o.permisos.filter(p => p.accion === accion).map(p => p.nombre))

  return nombres.length > 0 && nombres.every(n => seleccion.value.has(n))
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    matriz.value = await obtenerMatrizPermisos()
    rol.value ??= roles.value[0]?.nombre ?? null
    restaurar()
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

async function guardar() {
  if (!rol.value || !matriz.value)
    return
  guardando.value = true
  error.value = null
  try {
    const respuesta = await actualizarPermisosRol(rol.value, [...seleccion.value])

    matriz.value.asignaciones[respuesta.rol] = respuesta.permisos
    restaurar()
    aviso.value = t('reportes.admin.permisos.guardado', { rol: respuesta.rol })
    menuReportes.recargar().catch(() => undefined)
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    guardando.value = false
  }
}

watch(rol, restaurar)
onMounted(cargar)
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('reportes.admin.permisos.titulo') }}
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          {{ t('reportes.admin.permisos.descripcion') }}
        </p>
      </div>
      <div class="d-flex align-center gap-2">
        <VBtn
          variant="tonal"
          :disabled="!cambios || guardando"
          @click="restaurar"
        >
          {{ t('reportes.admin.permisos.descartar') }}
        </VBtn>
        <VBtn
          color="primary"
          :loading="guardando"
          :disabled="!cambios"
          @click="guardar"
        >
          {{ t('reportes.admin.permisos.guardar') }}
        </VBtn>
      </div>
    </div>

    <VProgressLinear
      v-if="cargando && !matriz"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-if="error"
      class="mb-4"
      :error="error"
      mostrar-detalle
      @reintentar="cargar"
    />

    <template v-if="matriz">
      <VCard class="mb-4">
        <VCardText class="d-flex flex-wrap gap-4 align-center">
          <VSelect
            v-model="rol"
            :items="roles"
            item-title="nombre"
            item-value="nombre"
            :label="t('reportes.admin.permisos.rol')"
            style="max-inline-size: 320px;"
            hide-details
          />
          <AppTextField
            v-model="busqueda"
            :placeholder="t('reportes.indice.buscar')"
            prepend-inner-icon="tabler-search"
            clearable
            style="max-inline-size: 320px;"
            hide-details
          />
          <VSpacer />
          <VSwitch
            v-for="general in matriz.generales"
            :key="general.nombre"
            :model-value="seleccion.has(general.nombre)"
            :label="general.etiqueta"
            :hint="general.descripcion"
            color="primary"
            hide-details
            @update:model-value="(v: unknown) => alternar(general.nombre, !!v)"
          />
        </VCardText>
      </VCard>

      <VAlert
        v-if="seleccion.has('manage reporting')"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        {{ t('reportes.admin.permisos.administraTodo') }}
      </VAlert>

      <VCard
        v-for="grupo in grupos"
        :key="grupo.tipo"
        class="mb-4"
      >
        <VCardItem>
          <VCardTitle>{{ grupo.titulo }}</VCardTitle>
        </VCardItem>
        <VTable density="comfortable">
          <thead>
            <tr>
              <th>{{ t('reportes.admin.permisos.objeto') }}</th>
              <th
                v-for="permiso in grupo.objetos[0].permisos"
                :key="permiso.accion"
                class="text-center text-no-wrap"
              >
                <VCheckbox
                  :model-value="todosDelGrupo(grupo, permiso.accion)"
                  :label="permiso.etiqueta"
                  density="compact"
                  hide-details
                  class="justify-center"
                  @update:model-value="(v: unknown) => alternarGrupo(grupo, permiso.accion, !!v)"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="objeto in grupo.objetos"
              :key="objeto.key"
            >
              <td>
                <div class="font-weight-medium">
                  {{ objeto.titulo }}
                </div>
                <div
                  v-if="objeto.categoria"
                  class="text-caption text-medium-emphasis"
                >
                  {{ objeto.categoria }}
                </div>
              </td>
              <td
                v-for="permiso in objeto.permisos"
                :key="permiso.nombre"
                class="text-center"
              >
                <VCheckbox
                  :model-value="seleccion.has(permiso.nombre)"
                  density="compact"
                  hide-details
                  class="justify-center"
                  @update:model-value="(v: unknown) => alternar(permiso.nombre, !!v)"
                />
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </template>

    <VSnackbar
      :model-value="aviso !== null"
      timeout="5000"
      @update:model-value="aviso = null"
    >
      {{ aviso }}
    </VSnackbar>
  </div>
</template>

<style scoped>
:deep(th .v-selection-control) {
  justify-content: center;
}

:deep(th .v-label) {
  white-space: nowrap;
}
</style>
