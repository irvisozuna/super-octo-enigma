/**
 * Captura con IA: sube fotos de hojas de perforación y sigue el avance hasta que cada una
 * termina en un reporte en borrador (o en error).
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AiImport } from '../../infrastructure/api/services/AiCaptureApiService'
import { AiCaptureApiService } from '../../infrastructure/api/services/AiCaptureApiService'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 10 * 60 * 1000

export const isAiImportRunning = (item: AiImport) => item.status === 'pending' || item.status === 'processing'

export const useAiCaptureStore = defineStore('drillingAiCapture', () => {
  const imports = ref<AiImport[]>([])
  const uploading = ref(false)
  const error = ref<string | null>(null)
  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let pollStartedAt = 0

  const running = computed(() => imports.value.some(isAiImportRunning))

  async function upload(projectId: string, wellId: string, photos: File[]) {
    uploading.value = true
    error.value = null
    try {
      const created = await AiCaptureApiService.upload(projectId, wellId, photos)

      imports.value = [...created, ...imports.value]
      startPolling()

      return created
    }
    catch (err: any) {
      error.value = err?.message || 'No se pudieron subir las fotos'
      throw err
    }
    finally {
      uploading.value = false
    }
  }

  async function refresh() {
    const pendingIds = imports.value.filter(isAiImportRunning).map(item => item.id)
    if (!pendingIds.length)
      return

    const updated = await AiCaptureApiService.list({ ids: pendingIds })
    const byId = new Map(updated.map(item => [item.id, item]))

    imports.value = imports.value.map(item => byId.get(item.id) ?? item)
  }

  function startPolling() {
    stopPolling()
    pollStartedAt = Date.now()
    scheduleNextPoll()
  }

  function scheduleNextPoll() {
    pollTimer = setTimeout(async () => {
      try {
        await refresh()
      }
      catch (err) {
        console.error('Error consultando la captura con IA:', err)
      }
      if (running.value && Date.now() - pollStartedAt < POLL_TIMEOUT_MS)
        scheduleNextPoll()
    }, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollTimer)
      clearTimeout(pollTimer)
    pollTimer = null
  }

  function clear() {
    stopPolling()
    imports.value = []
    error.value = null
  }

  async function findByReport(reportId: string): Promise<AiImport | null> {
    const found = await AiCaptureApiService.list({ reportId })

    return found[0] ?? null
  }

  return { imports, uploading, error, running, upload, refresh, startPolling, stopPolling, clear, findByReport }
})
