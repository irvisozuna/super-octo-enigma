<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import type { Notification } from '@layouts/types'
import { borrarNotificacion, marcarLeidas, marcarNoLeidas, obtenerNotificaciones } from '@/services/notificaciones'
import type { NotificacionApi } from '@/services/notificaciones'

/*
 * Campana de Atención: notificaciones del usuario (tabla notifications del backend), sondeo cada 60 s mientras la
 * pestaña esté visible. Reutilizable por cualquier módulo: cada notificación trae título, texto y una url interna.
 */
const router = useRouter()
const filas = ref<NotificacionApi[]>([])
const noLeidas = ref(0)
let controlador: AbortController | null = null

const ICONO: Record<string, string> = { alta: 'tabler-alert-triangle', media: 'tabler-alert-circle', aviso: 'tabler-info-circle' }
const COLOR: Record<string, string> = { alta: 'error', media: 'warning', aviso: 'info' }

function relativo(fecha: string | null): string {
  if (!fecha)
    return ''
  const min = Math.max(0, Math.round((Date.now() - new Date(fecha.replace(' ', 'T')).getTime()) / 60_000))
  if (min < 1)
    return 'ahora'
  if (min < 60)
    return `hace ${min} min`
  if (min < 48 * 60)
    return `hace ${Math.round(min / 60)} h`

  return `hace ${Math.round(min / 1440)} días`
}

function subtitulo(n: NotificacionApi): string {
  const partes = [n.datos.modulo === 'monitoreo' ? 'Monitoreo de lecturas' : n.tipo, n.datos.regla, n.datos.gerencia].filter(Boolean)

  return partes.join(' · ')
}

/** El componente de la plantilla usa ids numéricos: se mapea posición ↔ uuid. */
const notifications = computed<Notification[]>(() => filas.value.map((n, i) => ({
  id: i + 1,
  title: (n.datos.titulo as string | undefined) ?? n.tipo,
  subtitle: subtitulo(n),
  time: relativo(n.fecha),
  isSeen: n.leida,
  icon: ICONO[(n.datos.severidad as string | undefined) ?? ''] ?? 'tabler-bell',
  color: COLOR[(n.datos.severidad as string | undefined) ?? ''] ?? 'primary',
})))

const uuidsDe = (ids: number[]) => ids.map(i => filas.value[i - 1]?.id).filter((v): v is string => !!v)

async function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  try {
    const r = await obtenerNotificaciones(30, controlador.signal)

    filas.value = r.notificaciones
    noLeidas.value = r.no_leidas
  }
  catch {
    // sin sesión o sin red: la campana simplemente no se actualiza
  }
}

async function marcarLeidasLocal(ids: number[]) {
  const uuids = uuidsDe(ids)
  if (!uuids.length)
    return
  filas.value.forEach(n => {
    if (uuids.includes(n.id))
      n.leida = true
  })
  try {
    noLeidas.value = (await marcarLeidas(uuids)).no_leidas
  }
  catch {}
}

async function marcarNoLeidasLocal(ids: number[]) {
  const uuids = uuidsDe(ids)
  if (!uuids.length)
    return
  filas.value.forEach(n => {
    if (uuids.includes(n.id))
      n.leida = false
  })
  try {
    noLeidas.value = (await marcarNoLeidas(uuids)).no_leidas
  }
  catch {}
}

async function quitar(id: number) {
  const uuid = filas.value[id - 1]?.id
  if (!uuid)
    return
  filas.value = filas.value.filter(n => n.id !== uuid)
  try {
    noLeidas.value = (await borrarNotificacion(uuid)).no_leidas
  }
  catch {}
}

async function abrir(notification: Notification) {
  const fila = filas.value[notification.id - 1]
  if (!fila)
    return
  if (!fila.leida)
    await marcarLeidasLocal([notification.id])
  const url = fila.datos.url as string | undefined
  if (url)
    router.push(url)
}

const visible = useDocumentVisibility()

const { pause } = useIntervalFn(() => {
  if (visible.value === 'visible')
    cargar()
}, 60_000)

onMounted(cargar)
onBeforeUnmount(() => {
  pause()
  controlador?.abort()
})
</script>

<template>
  <Notifications
    :notifications="notifications"
    :badge-props="{ content: noLeidas > 99 ? '99+' : noLeidas }"
    @remove="quitar"
    @read="marcarLeidasLocal"
    @unread="marcarNoLeidasLocal"
    @click:notification="abrir"
    @click:all="router.push('/monitoreo/alertas')"
  />
</template>
