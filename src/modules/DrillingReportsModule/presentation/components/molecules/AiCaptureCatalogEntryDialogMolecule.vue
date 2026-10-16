<script setup lang="ts">
/**
 * Alta rápida en el catálogo de lo que la hoja dice y no existe: una persona, un equipo o un acero.
 * Viene precargado con lo leído; quien revisa completa lo que el sistema exige y confirma.
 */
import { computed, ref, watch } from 'vue'
import type { CatalogGap } from '../../../infrastructure/api/services/AiCaptureCatalogApiService'
import { AiCaptureCatalogApiService } from '../../../infrastructure/api/services/AiCaptureCatalogApiService'
import { TOOL_TYPE_BY_SECTION } from '../../composables/useAiCaptureCatalog'
import { CORE_SIZES as CORE_SIZE_OPTIONS } from '../../../shared/constants/ToolConstants'

const props = defineProps<{ gap: CatalogGap | null }>()
const emit = defineEmits<{ created: [id: string] }>()
const open = defineModel<boolean>({ default: false })

const CORE_SIZES = CORE_SIZE_OPTIONS.map(size => size.value)
const TOOL_TYPES = [
  { value: 'drill_bit_diamond', title: 'Broca de diamante' },
  { value: 'drill_bit_pdc', title: 'Broca PDC' },
  { value: 'drill_bit_tricone', title: 'Tricono' },
  { value: 'reamer', title: 'Escareador' },
]
const EQUIPMENT_TYPES = [
  { value: 'drill_rig', title: 'Perforadora' },
  { value: 'core_drill', title: 'Perforadora diamantina' },
  { value: 'rotary_drill', title: 'Perforadora rotaria' },
  { value: 'pump', title: 'Bomba' },
  { value: 'compressor', title: 'Compresor' },
  { value: 'generator', title: 'Generador' },
  { value: 'vehicle', title: 'Vehículo' },
  { value: 'other', title: 'Otro' },
]

const form = ref<Record<string, any>>({})
const saving = ref(false)
const error = ref<string | null>(null)

const title = computed(() => ({
  employee: props.gap?.position === 'operator' ? 'Dar de alta operador' : 'Dar de alta ayudante',
  equipment: 'Dar de alta equipo',
  tool: 'Dar de alta acero',
})[props.gap?.kind ?? 'employee'])

const required = (value: any) => (value !== null && value !== undefined && String(value).trim() !== '') || 'Obligatorio'

function prefill(gap: CatalogGap) {
  error.value = null
  if (gap.kind === 'employee') {
    const [first, ...rest] = gap.written.trim().split(/\s+/)

    form.value = { first_name: first ?? '', last_name: rest.join(' '), employee_code: '', position: gap.position ?? 'helper', hire_date: new Date().toISOString().slice(0, 10) }
  }
  else if (gap.kind === 'equipment') {
    form.value = {
      equipment_code: gap.written.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9\-_]/g, ''),
      equipment_name: gap.written,
      equipment_type: 'core_drill',
      manufacturer: '',
      model: '',
      serial_number: '',
      year_manufactured: new Date().getFullYear(),
    }
  }
  else {
    const diameter = (gap.diameter ?? '').toUpperCase().replace(/\s+/g, '')

    form.value = {
      type: TOOL_TYPE_BY_SECTION[gap.section ?? 'broca'],
      serial_number: gap.serial ?? gap.written,
      capacity_meters: null,
      core_size: CORE_SIZES.includes(diameter) ? diameter : null,
      brand: '',
    }
  }
}

watch(() => [props.gap, open.value] as const, ([gap, isOpen]) => {
  if (gap && isOpen)
    prefill(gap)
}, { immediate: true })

function errorMessage(err: any): string {
  const fields = Object.values(err?.response?.data?.errors ?? {}).flat() as string[]

  return fields.length ? fields.join(' ') : (err?.message || 'No se pudo dar de alta')
}

async function submit() {
  if (!props.gap)
    return
  saving.value = true
  error.value = null
  try {
    const created = props.gap.kind === 'employee'
      ? await AiCaptureCatalogApiService.createEmployee(form.value as any)
      : props.gap.kind === 'equipment'
        ? await AiCaptureCatalogApiService.createEquipment({ ...form.value, year_manufactured: Number(form.value.year_manufactured) } as any)
        : await AiCaptureCatalogApiService.createTool({ ...form.value, capacity_meters: Number(form.value.capacity_meters), brand: form.value.brand || null } as any)

    emit('created', created.id)
    open.value = false
  }
  catch (err: any) {
    error.value = errorMessage(err)
  }
  finally {
    saving.value = false
  }
}

const isValid = computed(() => {
  const fields: Record<string, string[]> = {
    employee: ['first_name', 'last_name', 'employee_code'],
    equipment: ['equipment_code', 'equipment_name', 'manufacturer', 'model', 'serial_number', 'year_manufactured'],
    tool: ['type', 'serial_number', 'capacity_meters'],
  }

  return (fields[props.gap?.kind ?? 'employee'] ?? []).every(key => required(form.value[key]) === true)
})
</script>

<template>
  <VDialog
    v-model="open"
    max-width="560"
  >
    <VCard v-if="gap">
      <VCardTitle class="pa-6 pb-2">
        {{ title }}
      </VCardTitle>
      <VCardSubtitle class="px-6">
        La hoja dice: "{{ gap.written }}"
      </VCardSubtitle>
      <VCardText class="pa-6">
        <VRow v-if="gap.kind === 'employee'">
          <VCol cols="6">
            <VTextField
              v-model="form.first_name"
              label="Nombre(s)"
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.last_name"
              label="Apellidos"
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.employee_code"
              label="Número de empleado"
              hint="Único en el sistema, p. ej. CDK0020"
              persistent-hint
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VSelect
              v-model="form.position"
              label="Puesto"
              :items="[{ value: 'operator', title: 'Operador' }, { value: 'helper', title: 'Ayudante' }]"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.hire_date"
              type="date"
              label="Fecha de ingreso"
            />
          </VCol>
        </VRow>

        <VRow v-else-if="gap.kind === 'equipment'">
          <VCol cols="6">
            <VTextField
              v-model="form.equipment_code"
              label="Código"
              hint="Letras, números y guiones"
              persistent-hint
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.equipment_name"
              label="Nombre"
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VSelect
              v-model="form.equipment_type"
              label="Tipo"
              :items="EQUIPMENT_TYPES"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.year_manufactured"
              type="number"
              label="Año de fabricación"
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.manufacturer"
              label="Fabricante"
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.model"
              label="Modelo"
              :rules="[required]"
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="form.serial_number"
              label="Número de serie del equipo"
              :rules="[required]"
            />
          </VCol>
        </VRow>

        <VRow v-else>
          <VCol cols="6">
            <VSelect
              v-model="form.type"
              label="Tipo"
              :items="TOOL_TYPES"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.serial_number"
              label="Número de serie"
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model="form.capacity_meters"
              type="number"
              label="Vida útil (m)"
              hint="Metros que puede perforar antes de retirarse"
              persistent-hint
              :rules="[required]"
            />
          </VCol>
          <VCol cols="6">
            <VSelect
              v-model="form.core_size"
              label="Diámetro"
              :items="CORE_SIZES"
              clearable
            />
          </VCol>
          <VCol cols="12">
            <VTextField
              v-model="form.brand"
              label="Marca (opcional)"
            />
          </VCol>
        </VRow>

        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ error }}
        </VAlert>
      </VCardText>
      <VCardActions class="px-6 pb-6">
        <VSpacer />
        <VBtn
          variant="text"
          @click="open = false"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          :loading="saving"
          :disabled="!isValid"
          @click="submit"
        >
          Dar de alta
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
