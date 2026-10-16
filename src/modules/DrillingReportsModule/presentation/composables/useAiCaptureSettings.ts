/**
 * Estado de la pantalla de configuración de la captura con IA (empresa o proyecto).
 *
 * En un proyecto cada sección puede heredar la configuración de la empresa o personalizarse; en la empresa
 * las dos secciones se editan siempre (lo no guardado son los valores de fábrica).
 */

import { computed, ref } from 'vue'
import type {
  ActivityCorrection,
  ActivityRule,
  CaptureSettingsPreview,
  CaptureSettingsResponse,
  CaptureSettingsSections,
  ShiftSettings,
} from '../../infrastructure/api/services/AiCaptureSettingsApiService'
import { AiCaptureSettingsApiService } from '../../infrastructure/api/services/AiCaptureSettingsApiService'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** Igual que en el backend: sin acentos, en minúsculas y sin espacios de sobra. */
export const normalizeKeyword = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

export function useAiCaptureSettings(projectId: () => string | null | undefined) {
  const response = ref<CaptureSettingsResponse | null>(null)
  const shifts = ref<ShiftSettings | null>(null)
  const rules = ref<ActivityRule[]>([])
  const customShifts = ref(true)
  const customRules = ref(true)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const suggestions = ref<ActivityCorrection[]>([])
  const preview = ref<CaptureSettingsPreview | null>(null)
  let savedSnapshot = ''

  const isProject = computed(() => !!projectId())
  const canConfigure = computed(() => response.value?.can_configure ?? false)
  const activityTypes = computed(() => response.value?.activity_types ?? {})

  /** Lo que se mandaría al guardar: solo las secciones personalizadas. */
  const sections = computed<CaptureSettingsSections>(() => ({
    ...(customShifts.value && shifts.value ? { shifts: shifts.value } : {}),
    ...(customRules.value ? { activity_rules: rules.value } : {}),
  }))

  const dirty = computed(() => JSON.stringify(sections.value) !== savedSnapshot)

  function apply(data: CaptureSettingsResponse) {
    response.value = data
    const base = isProject.value ? data.inherited : data.defaults

    customShifts.value = !isProject.value || !!data.stored?.shifts
    customRules.value = !isProject.value || !!data.stored?.activity_rules
    shifts.value = clone(data.stored?.shifts ?? base.shifts)
    rules.value = clone(data.stored?.activity_rules ?? base.activity_rules)
    savedSnapshot = JSON.stringify(sections.value)
  }

  /** Al dejar de heredar una sección se parte de lo heredado; al volver a heredar se muestra lo heredado. */
  function setCustom(section: 'shifts' | 'rules', custom: boolean) {
    const inherited = response.value?.inherited
    if (section === 'shifts') {
      customShifts.value = custom
      if (!custom && inherited)
        shifts.value = clone(inherited.shifts)
    }
    else {
      customRules.value = custom
      if (!custom && inherited)
        rules.value = clone(inherited.activity_rules)
    }
  }

  async function run<T>(flag: typeof loading, action: () => Promise<T>): Promise<T | undefined> {
    flag.value = true
    error.value = null
    try {
      return await action()
    }
    catch (err: any) {
      error.value = err?.message || 'No se pudo completar la operación'
    }
    finally {
      flag.value = false
    }
  }

  const load = () => run(loading, async () => {
    apply(await AiCaptureSettingsApiService.get(projectId()))
    suggestions.value = await AiCaptureSettingsApiService.suggestions(projectId())
  })

  const save = () => run(saving, async () => apply(await AiCaptureSettingsApiService.save(sections.value, projectId())))

  const reset = () => run(saving, async () => apply(await AiCaptureSettingsApiService.reset(projectId())))

  const test = (input: { description?: string; writtenShift?: string; times?: string[] }) => run(loading, async () => {
    preview.value = await AiCaptureSettingsApiService.preview({ projectId: projectId(), settings: sections.value, ...input })
  })

  /** Desde una corrección: agrega la palabra clave a la regla de ese tipo (o crea la regla al principio). */
  function addKeyword(activityType: string, keyword: string) {
    const normalized = normalizeKeyword(keyword)
    if (!normalized)
      return
    setCustom('rules', true)
    const rule = rules.value.find(item => item.activity_type === activityType)
    if (rule && !rule.keywords.includes(normalized))
      rule.keywords.push(normalized)
    else if (!rule)
      rules.value.unshift({ activity_type: activityType, keywords: [normalized] })
  }

  return {
    response, shifts, rules, customShifts, customRules, loading, saving, error, suggestions, preview,
    isProject, canConfigure, activityTypes, sections, dirty,
    load, save, reset, test, setCustom, addKeyword,
  }
}
