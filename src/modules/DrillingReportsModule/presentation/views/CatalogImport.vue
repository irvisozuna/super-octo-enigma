<script setup lang="ts">
/**
 * Cargar catálogos desde Excel: personal, aceros y equipos. Con los catálogos completos, la captura con IA
 * llena operador, ayudantes, equipo y aceros sola.
 */
import { computed, onMounted, ref, watch } from 'vue'
import type { CatalogImportKind, CatalogImportPreview, CatalogImportResult } from '../../infrastructure/api/services/CatalogImportApiService'
import { CatalogImportApiService } from '../../infrastructure/api/services/CatalogImportApiService'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'

const KINDS: Record<CatalogImportKind, { label: string; icon: string; file: string; columns: Array<{ key: string; title: string }>; assignable: boolean }> = {
  employees: {
    label: 'Personal',
    icon: 'tabler-users',
    file: 'plantilla-personal.xlsx',
    assignable: true,
    columns: [{ key: 'employee_code', title: 'Número' }, { key: 'first_name', title: 'Nombre' }, { key: 'last_name', title: 'Apellidos' }, { key: 'position', title: 'Puesto' }],
  },
  tools: {
    label: 'Aceros',
    icon: 'tabler-tool',
    file: 'plantilla-aceros.xlsx',
    assignable: false,
    columns: [{ key: 'type', title: 'Tipo' }, { key: 'serial_number', title: 'Serie' }, { key: 'capacity_meters', title: 'Vida útil (m)' }, { key: 'core_size', title: 'Diámetro' }],
  },
  equipment: {
    label: 'Equipos',
    icon: 'tabler-backhoe',
    file: 'plantilla-equipos.xlsx',
    assignable: true,
    columns: [{ key: 'equipment_code', title: 'Código' }, { key: 'equipment_name', title: 'Nombre' }, { key: 'manufacturer', title: 'Fabricante' }, { key: 'model', title: 'Modelo' }],
  },
}
const STATUS = {
  new: { color: 'success', label: 'Nuevo' },
  exists: { color: 'secondary', label: 'Ya existe' },
  error: { color: 'error', label: 'Con error' },
  created: { color: 'success', label: 'Cargado' },
}

const kind = ref<CatalogImportKind>('employees')
const file = ref<File | null>(null)
const preview = ref<CatalogImportPreview | null>(null)
const result = ref<CatalogImportResult | null>(null)
const projectId = ref<string | null>(null)
const projects = ref<Array<{ title: string; value: string }>>([])
const busy = ref<'template' | 'preview' | 'commit' | null>(null)
const error = ref<string | null>(null)

const config = computed(() => KINDS[kind.value])
const newRows = computed(() => preview.value?.rows.filter(row => row.status === 'new') ?? [])
const resultByRow = computed(() => new Map(result.value?.results.map(r => [r.row, r]) ?? []))

watch(kind, () => {
  file.value = null
  preview.value = null
  result.value = null
  error.value = null
})

onMounted(async () => {
  try {
    const response = await DrillingReportApiService.getProjects({ per_page: 100 })

    projects.value = (response?.data ?? [])
      .filter((p: any) => !p.status || p.status === 'active')
      .map((p: any) => ({ title: p.project_name ?? p.name ?? p.project_code, value: p.id }))
  }
  catch {
    projects.value = []
  }
})

async function run<T>(step: typeof busy.value, action: () => Promise<T>) {
  busy.value = step
  error.value = null
  try {
    return await action()
  }
  catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || 'No se pudo completar'
  }
  finally {
    busy.value = null
  }
}

const downloadTemplate = () => run('template', () => CatalogImportApiService.downloadTemplate(kind.value, config.value.file))

async function onFile(selected: File | File[] | null) {
  file.value = Array.isArray(selected) ? selected[0] ?? null : selected
  preview.value = null
  result.value = null
  if (file.value)
    preview.value = (await run('preview', () => CatalogImportApiService.preview(kind.value, file.value!))) ?? null
}

async function commit() {
  result.value = (await run('commit', () => CatalogImportApiService.commit(kind.value, newRows.value, config.value.assignable ? projectId.value : null))) ?? null
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h4 class="text-h4 mb-1">
        Cargar catálogos desde Excel
      </h4>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Da de alta de una vez al personal, los aceros y los equipos. Con los catálogos completos, la captura con IA llena
        operador, ayudantes, equipo y aceros sola.
      </p>
    </div>

    <VCard>
      <VTabs v-model="kind">
        <VTab
          v-for="(item, key) in KINDS"
          :key="key"
          :value="key"
          :prepend-icon="item.icon"
        >
          {{ item.label }}
        </VTab>
      </VTabs>
      <VDivider />

      <VCardText class="d-flex flex-column gap-4">
        <div class="d-flex flex-wrap align-center gap-4">
          <VBtn
            variant="tonal"
            prepend-icon="tabler-file-download"
            :loading="busy === 'template'"
            @click="downloadTemplate"
          >
            1. Descargar plantilla
          </VBtn>
          <VFileInput
            :model-value="file"
            label="2. Sube la plantilla llena"
            accept=".xlsx,.xls,.csv"
            prepend-icon="tabler-file-spreadsheet"
            :loading="busy === 'preview'"
            hide-details
            style="max-inline-size: 420px;"
            @update:model-value="onFile"
          />
          <VSelect
            v-if="config.assignable"
            v-model="projectId"
            :items="projects"
            label="Asignar al proyecto (opcional)"
            clearable
            hide-details
            style="max-inline-size: 300px;"
          />
        </div>

        <VAlert
          v-if="error"
          type="error"
          variant="tonal"
        >
          {{ error }}
        </VAlert>

        <template v-if="preview">
          <div class="d-flex flex-wrap align-center gap-2">
            <VChip
              v-for="status in (['new', 'exists', 'error'] as const)"
              :key="status"
              :color="STATUS[status].color"
              variant="tonal"
            >
              {{ STATUS[status].label }}: {{ preview.summary[status] }}
            </VChip>
            <VSpacer />
            <VBtn
              color="primary"
              prepend-icon="tabler-upload"
              :disabled="!newRows.length || !!result"
              :loading="busy === 'commit'"
              @click="commit"
            >
              3. Cargar {{ newRows.length }} {{ newRows.length === 1 ? 'nuevo' : 'nuevos' }}
            </VBtn>
          </div>

          <VAlert
            v-if="result"
            type="success"
            variant="tonal"
          >
            Se cargaron {{ result.created }}.
            <template v-if="config.assignable && projectId">
              Ya aparecen en el asistente de reportes del proyecto.
            </template>
          </VAlert>

          <VTable density="compact">
            <thead>
              <tr>
                <th>Renglón</th>
                <th
                  v-for="column in config.columns"
                  :key="column.key"
                >
                  {{ column.title }}
                </th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in preview.rows"
                :key="row.row"
              >
                <td>{{ row.row }}</td>
                <td
                  v-for="column in config.columns"
                  :key="column.key"
                >
                  {{ row.data[column.key] ?? '—' }}
                </td>
                <td>
                  <VChip
                    size="small"
                    :color="STATUS[resultByRow.get(row.row)?.status ?? row.status].color"
                    variant="tonal"
                  >
                    {{ STATUS[resultByRow.get(row.row)?.status ?? row.status].label }}
                  </VChip>
                  <div
                    v-for="(message, index) in (resultByRow.get(row.row)?.message ? [resultByRow.get(row.row)!.message] : row.messages)"
                    :key="index"
                    class="text-caption text-medium-emphasis"
                  >
                    {{ message }}
                  </div>
                </td>
              </tr>
            </tbody>
          </VTable>
        </template>
      </VCardText>
    </VCard>
  </div>
</template>
