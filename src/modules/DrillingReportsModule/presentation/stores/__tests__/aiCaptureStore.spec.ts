import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiImport } from '../../../infrastructure/api/services/AiCaptureApiService'
import { AiCaptureApiService } from '../../../infrastructure/api/services/AiCaptureApiService'
import { useAiCaptureStore } from '../aiCaptureStore'

vi.mock('../../../infrastructure/api/services/AiCaptureApiService', () => ({
  AiCaptureApiService: { upload: vi.fn(), list: vi.fn(), image: vi.fn() },
}))

const anImport = (overrides: Partial<AiImport> = {}): AiImport => ({
  id: 'imp-1',
  project_id: 'p-1',
  well_id: 'w-1',
  report_id: null,
  status: 'pending',
  original_name: 'hoja.heic',
  error: null,
  model: 'claude-opus-5-5',
  warnings: [],
  unmapped: null,
  cost_usd: 0,
  created_at: '2026-10-15T12:00:00Z',
  processed_at: null,
  ...overrides,
})

describe('aiCaptureStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.mocked(AiCaptureApiService.upload).mockReset()
    vi.mocked(AiCaptureApiService.list).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sube las fotos y sigue el avance hasta que se crea el borrador', async () => {
    vi.mocked(AiCaptureApiService.upload).mockResolvedValue([anImport()])
    vi.mocked(AiCaptureApiService.list)
      .mockResolvedValueOnce([anImport({ status: 'processing' })])
      .mockResolvedValueOnce([anImport({ status: 'completed', report_id: 'r-1' })])

    const store = useAiCaptureStore()
    const file = new File(['x'], 'hoja.heic')

    await store.upload('p-1', 'w-1', [file])

    expect(AiCaptureApiService.upload).toHaveBeenCalledWith('p-1', 'w-1', [file])
    expect(store.running).toBe(true)

    await vi.advanceTimersByTimeAsync(3000)
    expect(store.imports[0].status).toBe('processing')
    expect(AiCaptureApiService.list).toHaveBeenLastCalledWith({ ids: ['imp-1'] })

    await vi.advanceTimersByTimeAsync(3000)
    expect(store.imports[0].report_id).toBe('r-1')
    expect(store.running).toBe(false)

    await vi.advanceTimersByTimeAsync(9000)
    expect(AiCaptureApiService.list).toHaveBeenCalledTimes(2)
  })

  it('solo consulta las importaciones que siguen en proceso', async () => {
    vi.mocked(AiCaptureApiService.upload).mockResolvedValue([
      anImport({ id: 'done', status: 'completed', report_id: 'r-1' }),
      anImport({ id: 'busy', status: 'processing' }),
    ])
    vi.mocked(AiCaptureApiService.list).mockResolvedValue([anImport({ id: 'busy', status: 'failed', error: 'foto ilegible' })])

    const store = useAiCaptureStore()

    await store.upload('p-1', 'w-1', [new File(['x'], 'a.jpg'), new File(['y'], 'b.jpg')])
    await vi.advanceTimersByTimeAsync(3000)

    expect(AiCaptureApiService.list).toHaveBeenCalledWith({ ids: ['busy'] })
    expect(store.imports.map(item => item.status)).toEqual(['completed', 'failed'])
    expect(store.running).toBe(false)
  })

  it('guarda el error si la carga falla', async () => {
    vi.mocked(AiCaptureApiService.upload).mockRejectedValue(new Error('Too Many Attempts.'))

    const store = useAiCaptureStore()

    await expect(store.upload('p-1', 'w-1', [new File(['x'], 'a.jpg')])).rejects.toThrow()
    expect(store.error).toBe('Too Many Attempts.')
    expect(store.uploading).toBe(false)
  })
})
