<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlcancesAdmin } from '../../composables/useAlcancesAdmin'
import type { UsuarioAlcance } from '../../types/api'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'

/*
 * Gerencias por usuario (manage monitoring): quién ve qué gerencia en el monitoreo. Admin y quien administra ven todas.
 * Sobre los componentes del sistema de diseño: encabezado, barra de filtros, tabla y avisos globales.
 */
const { t } = useI18n()
const admin = useAlcancesAdmin()
const notificar = useNotificacion()

let controlador: AbortController | null = null

const filtrosActivos = computed(() => (admin.busqueda.value.trim() ? 1 : 0) + (admin.soloConMonitoreo.value ? 0 : 1))

const columnas = computed<ColumnaTabla<UsuarioAlcance>[]>(() => [
  { clave: 'nombre', titulo: t('monitoreo.alcances.usuario'), formato: 'personalizado', anchoMin: 240 },
  { clave: 'roles', titulo: t('monitoreo.alcances.roles'), formato: 'personalizado', ordenable: false, ancho: 220 },
  { clave: 'gerencias', titulo: t('monitoreo.alcances.gerencias'), formato: 'personalizado', ordenable: false, anchoMin: 320 },
  { clave: 'acciones', titulo: t('monitoreo.alcances.acciones'), formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 200 },
])

function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  admin.cargar(controlador.signal)
}

async function guardar(usuario: UsuarioAlcance) {
  if (await admin.guardar(usuario))
    notificar.exito(t('monitoreo.alcances.guardado', { usuario: usuario.nombre }))
}

function limpiarFiltros() {
  admin.busqueda.value = ''
  admin.soloConMonitoreo.value = true
}

onMounted(cargar)
onBeforeUnmount(() => controlador?.abort())
</script>

<template>
  <div class="alcances">
    <AsEncabezadoPagina
      :titulo="t('monitoreo.alcances.titulo')"
      :descripcion="t('monitoreo.alcances.descripcion')"
    >
      <template #acciones>
        <AsBtnSecundario
          prepend-icon="tabler-refresh"
          :loading="admin.cargando.value"
          @click="cargar"
        >
          {{ t('monitoreo.alcances.recargar') }}
        </AsBtnSecundario>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="admin.error.value"
      tipo="error"
      class="mb-4"
      :error="admin.error.value"
      mostrar-detalle
      @reintentar="cargar"
    />
    <VAlert
      v-if="admin.aviso.value"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ admin.aviso.value }} {{ t('monitoreo.alcances.sinCatalogo') }}
    </VAlert>
    <VAlert
      v-if="admin.errorGuardado.value"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="admin.errorGuardado.value = null"
    >
      {{ admin.errorGuardado.value.mensaje }}
    </VAlert>

    <AsBarraFiltros
      class="mb-3"
      :activos="filtrosActivos"
      @limpiar="limpiarFiltros"
    >
      <VTextField
        v-model="admin.busqueda.value"
        :placeholder="t('monitoreo.alcances.buscar')"
        :aria-label="t('monitoreo.alcances.buscar')"
        prepend-inner-icon="tabler-search"
        clearable
        class="as-filtro--lg"
      />
      <VSwitch
        v-model="admin.soloConMonitoreo.value"
        :label="t('monitoreo.alcances.soloConMonitoreo')"
        color="primary"
        inset
      />
    </AsBarraFiltros>

    <AsTablaDatos
      :columnas="columnas"
      :filas="admin.filtrados.value"
      clave-fila="id"
      densidad="estandar"
      :cargando="admin.cargando.value && !admin.usuarios.value.length"
      :por-pagina="-1"
      :vacio-titulo="t('monitoreo.alcances.sinResultados')"
      vacio-detalle=""
      vacio-icono="tabler-users-group"
      class="alcances__tabla"
    >
      <template #celda-nombre="{ fila }">
        <div class="font-weight-medium">
          {{ fila.nombre }}
        </div>
        <div class="as-secundario">
          {{ fila.email }}
        </div>
        <div
          v-if="!fila.tiene_monitoreo && !fila.es_admin"
          class="as-secundario text-warning"
        >
          {{ t('monitoreo.alcances.sinPermiso') }}
        </div>
      </template>
      <template #celda-roles="{ fila }">
        <div class="d-flex flex-wrap gap-1 py-1">
          <VChip
            v-for="rol in fila.roles"
            :key="rol"
            size="small"
            label
            variant="tonal"
          >
            {{ rol }}
          </VChip>
        </div>
      </template>
      <template #celda-gerencias="{ fila }">
        <VChip
          v-if="fila.ve_todas"
          color="primary"
          variant="tonal"
          size="small"
          label
          prepend-icon="tabler-world"
        >
          {{ t('monitoreo.alcances.veTodas') }}
        </VChip>
        <VSelect
          v-else
          :model-value="admin.seleccion.value[fila.id] ?? admin.asignadas(fila)"
          :items="admin.gerencias.value"
          item-title="label"
          item-value="id"
          multiple
          chips
          closable-chips
          density="compact"
          hide-details
          class="alcances__gerencias"
          :disabled="!admin.catalogoDisponible.value"
          :placeholder="t('monitoreo.alcances.ninguna')"
          :aria-label="t('monitoreo.alcances.gerencias')"
          @update:model-value="(ids: number[]) => admin.seleccionar(fila, ids)"
        />
      </template>
      <template #celda-acciones="{ fila }">
        <div
          v-if="!fila.ve_todas"
          class="d-flex align-center justify-end gap-1 text-no-wrap"
        >
          <VBtn
            size="small"
            variant="text"
            :disabled="!admin.cambio(fila) || admin.guardando.value.has(fila.id)"
            @click="admin.restaurar(fila)"
          >
            {{ t('monitoreo.alcances.descartar') }}
          </VBtn>
          <VBtn
            size="small"
            variant="tonal"
            color="primary"
            :loading="admin.guardando.value.has(fila.id)"
            :disabled="!admin.cambio(fila) || !admin.catalogoDisponible.value"
            @click="guardar(fila)"
          >
            {{ t('monitoreo.alcances.guardar') }}
          </VBtn>
        </div>
      </template>
    </AsTablaDatos>
  </div>
</template>

<style scoped>
.alcances__tabla :deep(td) {
  padding-block: var(--as-sp-2);
  vertical-align: top;
}

.alcances__gerencias {
  min-inline-size: var(--as-ancho-filtro-lg);
}
</style>
