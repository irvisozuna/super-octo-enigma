import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from '../services/asistenteApi'
import type { ConversacionResumen, EstadoAsistente, MensajeChat, MensajeGuardado, NivelRespuesta } from '../types'
import { etiquetaHerramienta } from '../utils/herramientas'

/*
 * Estado del chat del asistente; lo comparten el panel lateral y la pantalla completa (/asistente), así que una
 * conversación sigue al pasar de uno a otra. El historial lo guarda el servidor: aquí solo se pinta.
 */
let siguienteId = 0
const nuevoId = () => `m${++siguienteId}`

function desdeGuardado(m: MensajeGuardado): MensajeChat {
  return { id: nuevoId(), rol: m.rol, texto: m.texto, herramientas: m.herramientas ?? [], estado: 'listo' }
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
  }

  async function abrir(id: string) {
    if (id === actualId.value)
      return
    detener()
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

    mensajes.value.push({ id: nuevoId(), rol: 'usuario', texto: pregunta, herramientas: [], estado: 'listo' })
    mensajes.value.push({ id: nuevoId(), rol: 'asistente', texto: '', herramientas: [], estado: 'transmitiendo' })

    // El objeto reactivo (no el literal): así cada cambio se pinta mientras llega
    const respuesta = mensajes.value[mensajes.value.length - 1]

    enviando.value = true
    avance.value = 'Pensando'
    controlador = new AbortController()

    const nuevaConversacion = actualId.value === null
    try {
      await api.preguntar(
        { mensaje: pregunta, conversacion_id: actualId.value ?? undefined, nivel: nivel.value },
        evento => {
          if (evento.type === 'conversation') {
            actualId.value = evento.payload.id
          }
          else if (evento.type === 'tool-call') {
            respuesta.herramientas.push(evento.payload.toolName)
            avance.value = etiquetaHerramienta(evento.payload.toolName)
          }
          else if (evento.type === 'text-delta') {
            respuesta.texto += evento.payload.text
            avance.value = 'Escribiendo'
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
    vacia,
    sinCupo,
    cargarConversaciones,
    cargarEstado,
    nueva,
    abrir,
    enviar,
    detener,
    renombrar,
    borrar,
  }
})
