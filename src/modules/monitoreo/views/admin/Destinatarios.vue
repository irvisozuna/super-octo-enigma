<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { borrarDestinatario, guardarDestinatario, obtenerDestinatarios } from '../../services/monitoreoApi'
import { useAlcanceStore } from '../../stores/alcanceStore'
import type { CanalDestinatario, Destinatario, EdicionDestinatario, RespuestaDestinatarios } from '../../types/destinatarios'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useDialogo } from '@/composables/useDialogo'
import { useNotificacion } from '@/composables/useNotificacion'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/*
 * Destinatarios de los canales de alerta (F2.3): usuarios de Atención (campana y correo) o correos externos, por gerencia
 * o para todas. Cambiarlos surte efecto en el siguiente ciclo sin despliegue.
 * Sobre los componentes del sistema de diseño: encabezado, tabla, diálogo de formulario y confirmación al quitar.
 */
const { t } = useI18n()
const alcance = useAlcanceStore()
const dialogo = useDialogo()
const notificar = useNotificacion()

const datos = ref<RespuestaDestinatarios | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const guardando = ref(false)
const errorGuardado = ref<ErrorReporte | null>(null)
const formularioAbierto = ref(false)
const editandoId = ref<string | null>(null)
const CANALES: CanalDestinatario[] = ['campana', 'correo_alta', 'resumen', 'escalamiento']

const vacio = (): EdicionDestinatario & { tipo: 'usuario' | 'correo' } => ({ tipo: 'usuario', usuario_id: null, email: '', nombre: '', gerencia_id: null, canales: ['campana'], activo: true })
const forma = reactive(vacio())

const opcionesUsuario = computed(() => (datos.value?.usuarios ?? []).map(u => ({ value: u.id, title: u.email ? `${u.nombre} · ${u.email}` : u.nombre })))
const opcionesGerencia = computed(() => [{ value: null, title: t('monitoreo.destinatarios.todas') }, ...alcance.gerencias.map(g => ({ value: g.id, title: g.label }))])
const nombreGerencia = (id: number | null) => (id === null ? t('monitoreo.destinatarios.todas') : alcance.gerencias.find(g => g.id === id)?.label ?? `#${id}`)
const quienEs = (d: Destinatario) => d.usuario ?? d.nombre ?? d.email ?? ''

const formularioValido = computed(() => {
  const destino = forma.tipo === 'usuario' ? forma.usuario_id !== null : forma.email.includes('@')
  const canales = forma.tipo === 'correo' ? forma.canales.filter(c => c !== 'campana') : forma.canales

  return destino && canales.length > 0
})

const columnas = computed<ColumnaTabla<Destinatario>[]>(() => [
  { clave: 'quien', titulo: t('monitoreo.destinatarios.quien'), formato: 'personalizado', ordenable: false, anchoMin: 240 },
  { clave: 'gerencia_id', titulo: t('monitoreo.destinatarios.gerencia'), formato: 'personalizado', ordenable: false, ancho: 200 },
  { clave: 'canales', titulo: t('monitoreo.destinatarios.canales'), formato: 'personalizado', ordenable: false },
  { clave: 'activo', titulo: t('monitoreo.destinatarios.activo'), formato: 'personalizado', ordenable: false, alineacion: 'center', ancho: 90 },
  { clave: 'acciones', titulo: t('monitoreo.destinatarios.acciones'), formato: 'personalizado', ordenable: false, alineacion: 'end', ancho: 120 },
])

async function cargar() {
  cargando.value = true
  try {
    datos.value = await obtenerDestinatarios()
    error.value = null
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

function nuevo() {
  Object.assign(forma, vacio())
  editandoId.value = null
  errorGuardado.value = null
  formularioAbierto.value = true
}

function editar(d: Destinatario) {
  Object.assign(forma, { tipo: d.usuario_id ? 'usuario' : 'correo', usuario_id: d.usuario_id, email: d.usuario_id ? '' : (d.email ?? ''), nombre: d.nombre ?? '', gerencia_id: d.gerencia_id, canales: [...d.canales], activo: d.activo })
  editandoId.value = d.id
  errorGuardado.value = null
  formularioAbierto.value = true
}

async function guardar() {
  guardando.value = true
  errorGuardado.value = null
  try {
    const cuerpo: EdicionDestinatario = {
      usuario_id: forma.tipo === 'usuario' ? forma.usuario_id : null,
      email: forma.tipo === 'correo' ? forma.email.trim() : '',
      nombre: forma.nombre.trim(),
      gerencia_id: forma.gerencia_id,
      canales: forma.tipo === 'correo' ? forma.canales.filter(c => c !== 'campana') : forma.canales,
      activo: forma.activo,
    }

    await guardarDestinatario(editandoId.value, cuerpo)
    formularioAbierto.value = false
    notificar.exito(t('monitoreo.destinatarios.guardado'))
    await cargar()
  }
  catch (e) {
    errorGuardado.value = normalizarError(e)
  }
  finally {
    guardando.value = false
  }
}

async function borrar(d: Destinatario) {
  const ok = await dialogo.confirmar({
    titulo: t('monitoreo.destinatarios.eliminarTitulo', { quien: quienEs(d) }),
    mensaje: t('monitoreo.destinatarios.eliminarDetalle'),
    color: 'error',
    icono: 'tabler-trash',
    textoConfirmar: t('monitoreo.destinatarios.eliminar'),
  })

  if (!ok)
    return
  guardando.value = true
  try {
    await borrarDestinatario(d.id)
    notificar.exito(t('monitoreo.destinatarios.eliminado'))
    await cargar()
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    guardando.value = false
  }
}

onMounted(async () => {
  if (!alcance.cargado)
    await alcance.cargar()
  await cargar()
})
</script>

<template>
  <div class="destinatarios">
    <AsEncabezadoPagina
      :titulo="t('monitoreo.destinatarios.titulo')"
      :descripcion="t('monitoreo.destinatarios.descripcion')"
    >
      <template #acciones>
        <AsBtnPrimario
          prepend-icon="tabler-plus"
          @click="nuevo"
        >
          {{ t('monitoreo.destinatarios.agregar') }}
        </AsBtnPrimario>
      </template>
    </AsEncabezadoPagina>

    <AsEstado
      v-if="error && !datos"
      tipo="error"
      class="mb-4"
      :error="error"
      @reintentar="cargar"
    />
    <VAlert
      v-else-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="error = null"
    >
      {{ error.mensaje }}
    </VAlert>

    <AsTablaDatos
      :columnas="columnas"
      :filas="datos?.destinatarios ?? []"
      clave-fila="id"
      densidad="estandar"
      :cargando="cargando"
      :por-pagina="-1"
      :vacio-titulo="t('monitoreo.destinatarios.sinFilas')"
      vacio-detalle=""
      vacio-icono="tabler-bell-off"
    >
      <template #vacio-acciones>
        <AsBtnSecundario
          prepend-icon="tabler-plus"
          @click="nuevo"
        >
          {{ t('monitoreo.destinatarios.agregar') }}
        </AsBtnSecundario>
      </template>
      <template #celda-quien="{ fila }">
        <div class="font-weight-medium">
          {{ quienEs(fila) }}
        </div>
        <div class="as-secundario">
          {{ fila.usuario_id ? t('monitoreo.destinatarios.usuarioAtencion') : t('monitoreo.destinatarios.correoExterno') }}<span v-if="fila.email"> · {{ fila.email }}</span>
        </div>
      </template>
      <template #celda-gerencia_id="{ fila }">
        {{ nombreGerencia(fila.gerencia_id) }}
      </template>
      <template #celda-canales="{ fila }">
        <div class="d-flex flex-wrap gap-1 py-1">
          <VChip
            v-for="c in fila.canales"
            :key="c"
            size="small"
            label
            variant="tonal"
          >
            {{ t(`monitoreo.destinatarios.canal.${c}`) }}
          </VChip>
        </div>
      </template>
      <template #celda-activo="{ fila }">
        <VIcon
          :icon="fila.activo ? 'tabler-check' : 'tabler-minus'"
          :color="fila.activo ? 'success' : undefined"
          size="18"
          :aria-label="fila.activo ? t('monitoreo.destinatarios.activo') : t('monitoreo.destinatarios.inactivo')"
          :title="fila.activo ? t('monitoreo.destinatarios.activo') : t('monitoreo.destinatarios.inactivo')"
        />
      </template>
      <template #celda-acciones="{ fila }">
        <div class="d-flex align-center justify-end gap-1">
          <VBtn
            icon="tabler-pencil"
            size="small"
            variant="text"
            :title="t('monitoreo.destinatarios.editar')"
            :aria-label="t('monitoreo.destinatarios.editar')"
            @click="editar(fila)"
          />
          <VBtn
            icon="tabler-trash"
            size="small"
            variant="text"
            color="error"
            :disabled="guardando"
            :title="t('monitoreo.destinatarios.eliminar')"
            :aria-label="t('monitoreo.destinatarios.eliminar')"
            @click="borrar(fila)"
          />
        </div>
      </template>
    </AsTablaDatos>

    <AsDialogo
      :abierto="formularioAbierto"
      :titulo="editandoId ? t('monitoreo.destinatarios.editar') : t('monitoreo.destinatarios.agregar')"
      tamano="sm"
      :cargando="guardando"
      :texto-confirmar="t('monitoreo.destinatarios.guardar')"
      :texto-cancelar="t('monitoreo.destinatarios.cancelar')"
      :desactivar-confirmar="!formularioValido"
      @update:abierto="(v: boolean) => { formularioAbierto = v }"
      @confirmar="guardar"
    >
      <div class="d-flex flex-column gap-4">
        <VChipGroup
          v-model="forma.tipo"
          mandatory
          selected-class="text-primary"
        >
          <VChip
            value="usuario"
            label
            filter
          >
            {{ t('monitoreo.destinatarios.usuarioAtencion') }}
          </VChip>
          <VChip
            value="correo"
            label
            filter
          >
            {{ t('monitoreo.destinatarios.correoExterno') }}
          </VChip>
        </VChipGroup>
        <VSelect
          v-if="forma.tipo === 'usuario'"
          v-model="forma.usuario_id"
          :items="opcionesUsuario"
          :label="t('monitoreo.destinatarios.usuario')"
          density="compact"
          hide-details
        />
        <template v-else>
          <VTextField
            v-model="forma.email"
            type="email"
            :label="t('monitoreo.destinatarios.email')"
            density="compact"
            hide-details
          />
          <VTextField
            v-model="forma.nombre"
            :label="t('monitoreo.destinatarios.nombre')"
            density="compact"
            hide-details
          />
        </template>
        <VSelect
          v-model="forma.gerencia_id"
          :items="opcionesGerencia"
          :label="t('monitoreo.destinatarios.gerencia')"
          density="compact"
          hide-details
        />
        <fieldset class="destinatarios__canales">
          <legend class="as-etiqueta mb-1">
            {{ t('monitoreo.destinatarios.canales') }}
          </legend>
          <VCheckbox
            v-for="c in CANALES"
            :key="c"
            v-model="forma.canales"
            :value="c"
            density="compact"
            hide-details
            :disabled="c === 'campana' && forma.tipo === 'correo'"
          >
            <template #label>
              <span>{{ t(`monitoreo.destinatarios.canal.${c}`) }} <span class="as-secundario">· {{ t(`monitoreo.destinatarios.canalDetalle.${c}`) }}</span></span>
            </template>
          </VCheckbox>
        </fieldset>
        <VSwitch
          v-model="forma.activo"
          density="compact"
          hide-details
          color="primary"
          :label="t('monitoreo.destinatarios.activo')"
        />
        <VAlert
          v-if="errorGuardado"
          type="error"
          variant="tonal"
          density="compact"
        >
          {{ errorGuardado.mensaje }}
        </VAlert>
      </div>
    </AsDialogo>
  </div>
</template>

<style scoped>
.destinatarios__canales {
  padding: 0;
  border: 0;
  margin: 0;
}
</style>
