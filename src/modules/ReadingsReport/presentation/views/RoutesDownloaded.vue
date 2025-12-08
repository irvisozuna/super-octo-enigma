<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { fetchRoutesList } from '../../infrastructure/api/ReadingsReportApi'
import { getRouteStatusStyle } from '../../config/readingsReport.config'
import { useReadingsReportStore } from '../stores/ReadingsReportStore'

const { t } = useI18n()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const itemsPerPage = ref(15)
const isLoading = ref(false)
const periodId = ref<number | null>(null)
const readingsReportStore = useReadingsReportStore()

const headers = [
  { title: 'Ruta', key: 'name' },
  { title: 'Sector', key: 'sector_name' },
  { title: 'Lecturista', key: 'creator_name' },
  { title: 'Estatus', key: 'status' },
  { title: 'Descarga', key: 'created_at' },
]

function formatDate(val: string | null | undefined) {
  if (!val)
    return '-'
  const d = new Date(val)
  if (Number.isNaN(d.getTime()))
    return val

  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

async function ensureActivePeriod() {
  const activePeriodId = await readingsReportStore.ensureActivePeriod()
  if (activePeriodId)
    periodId.value = activePeriodId
}

const fetchRoutes = debounce(async () => {
  if (!periodId.value)
    return
  isLoading.value = true
  try {
    const res = await fetchRoutesList({
      page: page.value,
      per_page: itemsPerPage.value,
      period_id: periodId.value,
      sort_by: 'id',
      sort_desc: 0,
    })

    const data = res?.data ?? []
    const meta = res?.meta ?? { total: data.length }

    items.value = data
    total.value = meta.total ?? data.length
  }
  catch (err) {
    console.error('Error cargando rutas:', err)
  }
  finally {
    isLoading.value = false
  }
}, 300)

function onPageChange(val: number) {
  page.value = val
  fetchRoutes()
}
function onItemsPerPageChange(val: number) {
  itemsPerPage.value = val
  fetchRoutes()
}

onMounted(async () => {
  await ensureActivePeriod()
  fetchRoutes()
})

const tableItems = computed(() =>
  items.value.map(item => ({
    ...item,
    downloaded_at_fmt: formatDate(item.downloaded_at),
  })),
)

function getStatusChipProps(rawItem: any) {
  const statusKey = String(rawItem.status ?? '').toLowerCase()
  const style = getRouteStatusStyle(statusKey)

  const isHex = typeof style.color === 'string' && style.color.startsWith('#')

  const chipStyle = {
    ...(style.color ? { backgroundColor: style.color } : {}),
    ...(style.textColor ? { color: style.textColor } : {}),
  }

  return {
    color: isHex ? undefined : style.color,
    variant: isHex ? 'flat' : style.variant ?? 'tonal',
    class: 'text-caption route-status-chip',
    style: chipStyle,
  }
}
</script>

<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">
        Rutas descargadas
      </h4>
      <p class="text-body-1 mb-4">
        Rutas del periodo activo
      </p>
    </VCardTitle>

    <VCardText>
      <VDataTableServer
        :headers="headers"
        :items="tableItems"
        :items-length="total"
        :page="page"
        :items-per-page="itemsPerPage"
        :loading="isLoading"
        item-key="route_id"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
      >
        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>
        <template #item.status="{ item }">
          <VChip
            v-bind="getStatusChipProps(item)"
            size="small"
          >
            {{ item.status }}
          </VChip>
        </template>
        <template #item.downloaded_at="{ item }">
          {{ formatDate(item.downloaded_at) }}
        </template>
      </VDataTableServer>
    </VCardText>
  </VCard>
</template>

<style scoped>
.route-status-chip {
  --v-theme-surface: transparent;

  border-color: transparent !important;
}
</style>
