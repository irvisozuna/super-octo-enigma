import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaptureSettingsResponse } from '../../../infrastructure/api/services/AiCaptureSettingsApiService'
import { AiCaptureSettingsApiService } from '../../../infrastructure/api/services/AiCaptureSettingsApiService'
import { normalizeKeyword, useAiCaptureSettings } from '../useAiCaptureSettings'

vi.mock('../../../infrastructure/api/services/AiCaptureSettingsApiService', () => ({
  AiCaptureSettingsApiService: { get: vi.fn(), save: vi.fn(), reset: vi.fn(), preview: vi.fn(), suggestions: vi.fn() },
}))

const factory = {
  shifts: { day_start: '07:00', labels: { day: ['dia', 'a', '1'], night: ['noche', 'b', '2'] } },
  activity_rules: [{ activity_type: 'drilling', keywords: ['perfor'] }],
}

const company = {
  shifts: { day_start: '08:00', labels: { day: ['1'], night: ['2'] } },
  activity_rules: [{ activity_type: 'waiting', keywords: ['espera'] }],
}

const response = (overrides: Partial<CaptureSettingsResponse> = {}): CaptureSettingsResponse => ({
  stored: null,
  inherited: company,
  resolved: company,
  defaults: factory,
  activity_types: { drilling: 'Perforación', waiting: 'Tiempo de espera', other: 'Otros' },
  can_configure: true,
  ...overrides,
})

describe('useAiCaptureSettings', () => {
  beforeEach(() => {
    vi.mocked(AiCaptureSettingsApiService.get).mockReset()
    vi.mocked(AiCaptureSettingsApiService.save).mockReset()
    vi.mocked(AiCaptureSettingsApiService.suggestions).mockResolvedValue([])
  })

  it('un proyecto sin nada guardado hereda de la empresa y no manda secciones', async () => {
    vi.mocked(AiCaptureSettingsApiService.get).mockResolvedValue(response())
    const settings = useAiCaptureSettings(() => 'p-1')

    await settings.load()

    expect(settings.customShifts.value).toBe(false)
    expect(settings.shifts.value?.day_start).toBe('08:00')
    expect(settings.sections.value).toEqual({})
    expect(settings.dirty.value).toBe(false)
  })

  it('personalizar una sección solo manda esa sección', async () => {
    vi.mocked(AiCaptureSettingsApiService.get).mockResolvedValue(response())
    vi.mocked(AiCaptureSettingsApiService.save).mockResolvedValue(response())
    const settings = useAiCaptureSettings(() => 'p-1')

    await settings.load()
    settings.setCustom('shifts', true)
    settings.shifts.value!.labels.day.push('d')
    await settings.save()

    expect(settings.dirty.value).toBe(false)
    expect(AiCaptureSettingsApiService.save).toHaveBeenCalledWith(
      { shifts: { day_start: '08:00', labels: { day: ['1', 'd'], night: ['2'] } } },
      'p-1',
    )
  })

  it('la empresa edita sobre los valores de fábrica y manda las dos secciones', async () => {
    vi.mocked(AiCaptureSettingsApiService.get).mockResolvedValue(response())
    const settings = useAiCaptureSettings(() => null)

    await settings.load()

    expect(settings.shifts.value?.day_start).toBe('07:00')
    expect(Object.keys(settings.sections.value)).toEqual(['shifts', 'activity_rules'])
  })

  it('agregar una corrección suma la palabra a la regla del tipo o crea una nueva al principio', async () => {
    vi.mocked(AiCaptureSettingsApiService.get).mockResolvedValue(response({ stored: { activity_rules: company.activity_rules } }))
    const settings = useAiCaptureSettings(() => 'p-1')

    await settings.load()
    settings.addKeyword('waiting', 'Esperando AGUA')
    settings.addKeyword('material_handling', 'Se lleva muestra')

    expect(settings.rules.value[0]).toEqual({ activity_type: 'material_handling', keywords: ['se lleva muestra'] })
    expect(settings.rules.value[1].keywords).toEqual(['espera', 'esperando agua'])
  })

  it('normaliza como el backend: sin acentos, minúsculas, espacios simples', () => {
    expect(normalizeKeyword('  Revisión   DE  Máquina ')).toBe('revision de maquina')
  })
})
