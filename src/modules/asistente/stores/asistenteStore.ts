import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from '../services/asistenteApi'
import type { ContextoPantalla, ConversacionResumen, EstadoAsistente, MensajeChat, MensajeGuardado, NivelRespuesta, PasoChat } from '../types'
import { etiquetaHerramienta } from '../utils/herramientas'

/*
 * Estado del chat del asistente; lo comparten el panel lateral y la pantalla completa (/asistente), así que una
 * conversación sigue al pasar de uno a otra. El historial lo guarda el servidor: aquí solo se pinta.
 */
let siguienteId = 0
const nuevoId = () => `m${++siguienteId}`

function desdeGuardado(m: MensajeGuardado): MensajeChat {
  const pasos: PasoChat[] = (m.pasos ?? []).map((p, i) => ({ id: i, herramienta: p.herramienta, detalle: p.detalle, estado: p.ok === false ? 'error' : 'listo' }))

  return { id: nuevoId(), rol: m.rol, texto: m.texto, herramientas: m.herramientas ?? [], estado: 'listo', cortada: m.cortada, pasos, duracionMs: m.duracion_ms, verificacion: m.verificacion }
}

/** El paso con ese número; si llegó antes el final que el inicio, lo crea. */
function paso(respuesta: MensajeChat, id: number, herramienta: string): PasoChat {
  let encontrado = respuesta.pasos.find(p => p.id === id)
  if (!encontrado) {
    encontrado = { id, herramienta, estado: 'en_curso' }
    respuesta.pasos.push(encontrado)
  }

  return encontrado
}

export const useAsistenteStore = defineStore('asistente', () => {
  const panelAbierto = ref(false)
  const conversaciones = ref<ConversacionResumen[]>([])
  const cargandoConversaciones = ref(false)
  const actualId = ref<string | null>(null)
  const titulo = ref('')
  const mensajes = ref<MensajeChat[]>([])
  const cargandoMensajes = ref(false)
  const enviando = ref(false)
  const avance = ref('')
  const nivel = ref<NivelRespuesta>('auto')
  const estado = ref<EstadoAsistente | null>(null)
  const contexto = ref<ContextoPantalla | null>(null)
  let controlador: AbortController | null = null

  const vacia = computed(() => mensajes.value.length === 0)
  const sinCupo = computed(() => estado.value !== null && estado.value.preguntas_restantes <= 0)

  async function cargarConversaciones() {
    cargandoConversaciones.value = true
    try {
      conversaciones.value = await api.listarConversaciones()
    }
    finally {
      cargandoConversaciones.value = false
    }
  }

  async function cargarEstado() {
    try {
      estado.value = await api.obtenerEstado()
    }
    catch {
      estado.value = null
    }
  }

  function nueva() {
    detener()
    actualId.value = null
    titulo.value = ''
    mensajes.value = []
    contexto.value = null
  }

  /** Conversación nueva sobre lo que el usuario tiene en pantalla (XEL1-717). */
  function preguntarSobre(ctx: ContextoPantalla) {
    nueva()
    contexto.value = ctx
    panelAbierto.value = true
  }

  async function abrir(id: string) {
    if (id === actualId.value)
      return
    detener()
    contexto.value = null
    cargandoMensajes.value = true
    try {
      const detalle = await api.obtenerConversacion(id)

      actualId.value = detalle.id
      titulo.value = detalle.titulo
      mensajes.value = detalle.mensajes.map(desdeGuardado)
    }
    finally {
      cargandoMensajes.value = false
    }
  }

  async function enviar(texto: string) {
    const pregunta = texto.trim()
    if (!pregunta || enviando.value)
      return

    mensajes.value.push({ id: nuevoId(), rol: 'usuario', texto: pregunta, herramientas: [], estado: 'listo', pasos: [] })
    mensajes.value.push({ id: nuevoId(), rol: 'asistente', texto: '', herramientas: [], estado: 'transmitiendo', pasos: [], inicio: Date.now() })

    // El objeto reactivo (no el literal): así cada cambio se pinta mientras llega
    const respuesta = mensajes.value[mensajes.value.length - 1]

    enviando.value = true
    avance.value = 'Pensando'
    controlador = new AbortController()

    const nuevaConversacion = actualId.value === null
    try {
      await api.preguntar(
        {
          mensaje: pregunta,
          conversacion_id: actualId.value ?? undefined,
          nivel: nivel.value,
          contexto: contexto.value ? { tipo: contexto.value.tipo, clave: contexto.value.clave, filtros: contexto.value.filtros } : undefined,
        },
        evento => {
          if (evento.type === 'conversation') {
            actualId.value = evento.payload.id
            respuesta.nivel = evento.payload.nivel
          }
          else if (evento.type === 'tool-start') {
            paso(respuesta, evento.payload.id, evento.payload.toolName)
            respuesta.fase = undefined
            avance.value = etiquetaHerramienta(evento.payload.toolName)
          }
          else if (evento.type === 'tool-call') {
            respuesta.herramientas.push(evento.payload.toolName)

            const id = evento.payload.id ?? respuesta.pasos.length
            const p = paso(respuesta, id, evento.payload.toolName)
            if (evento.payload.detalle)
              p.detalle = evento.payload.detalle
            avance.value = etiquetaHerramienta(evento.payload.toolName)
          }
          else if (evento.type === 'tool-result') {
            paso(respuesta, evento.payload.id, evento.payload.toolName).estado = evento.payload.ok ? 'listo' : 'error'
          }
          else if (evento.type === 'tool-progress') {
            const p = paso(respuesta, evento.payload.id, evento.payload.toolName)

            p.secciones = evento.payload.secciones
            p.tipo = evento.payload.tipo ?? p.tipo
          }
          else if (evento.type === 'thinking') {
            respuesta.fase = 'analizando'
          }
          else if (evento.type === 'verificacion') {
            respuesta.verificacion = evento.payload
          }
          else if (evento.type === 'text-delta') {
            respuesta.texto += evento.payload.text
            respuesta.fase = undefined
            avance.value = 'Escribiendo'
          }
          else if (evento.type === 'truncated') {
            respuesta.cortada = evento.payload.motivo
          }
          else if (evento.type === 'error') {
            respuesta.estado = 'error'
            respuesta.error = evento.payload.error.message || 'No se pudo completar la respuesta.'
          }
        },
        controlador.signal,
      )
      if (respuesta.estado === 'transmitiendo')
        respuesta.estado = 'listo'
    }
    catch (e) {
      if ((e as Error).name === 'AbortError') {
        respuesta.estado = 'detenido'
      }
      else {
        respuesta.estado = 'error'
        respuesta.error = e instanceof api.ErrorChat ? e.message : 'Se perdió la conexión con el asistente. Intente de nuevo.'
      }
    }
    finally {
      // Lo que quedó en curso (se detuvo o falló) ya no está en curso
      respuesta.pasos.forEach(p => {
        if (p.estado === 'en_curso')
          p.estado = respuesta.estado === 'listo' ? 'listo' : 'error'
      })
      respuesta.fase = undefined
      respuesta.duracionMs = respuesta.inicio ? Date.now() - respuesta.inicio : undefined
      enviando.value = false
      avance.value = ''
      controlador = null
      if (nuevaConversacion && actualId.value)
        titulo.value = pregunta.length > 80 ? `${pregunta.slice(0, 79)}…` : pregunta
      void cargarConversaciones().catch(() => {})
      void cargarEstado()
    }
  }

  function detener() {
    controlador?.abort()
    controlador = null
  }

  async function renombrar(id: string, nuevoTitulo: string) {
    await api.renombrarConversacion(id, nuevoTitulo)
    if (id === actualId.value)
      titulo.value = nuevoTitulo.trim()
    await cargarConversaciones()
  }

  async function borrar(id: string) {
    await api.borrarConversacion(id)
    if (id === actualId.value)
      nueva()
    await cargarConversaciones()
  }

  return {
    panelAbierto,
    conversaciones,
    cargandoConversaciones,
    actualId,
    titulo,
    mensajes,
    cargandoMensajes,
    enviando,
    avance,
    nivel,
    estado,
    contexto,
    vacia,
    sinCupo,
    cargarConversaciones,
    cargarEstado,
    nueva,
    preguntarSobre,
    abrir,
    enviar,
    detener,
    renombrar,
    borrar,
  }
})
