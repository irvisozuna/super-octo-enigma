<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContractsStore } from '../stores/contractsStore'
import { useContractsHelpers } from '../composables/useContractsHelpers'

const route = useRoute()
const router = useRouter()
const contractsStore = useContractsStore()
const { formatCurrency } = useContractsHelpers()

// State
const isEditing = ref(false)
const isDeleteDialogVisible = ref(false)
const editedContract = ref<any>({})
const catalogOptions = ref({
  status: [] as any[],
  systems: [] as any[],
  sectors: [] as any[],
  type_contracts: [] as any[],
})

const contract = computed(() => contractsStore.currentItem)
const loading = computed(() => contractsStore.loading)

const loadData = async () => {
  const id = route.params.id as string
  if (!id)
    return

  await Promise.all([
    contractsStore.fetchById(id),
    loadCatalogs()
  ])
  
  if (contract.value) {
    resetEditedContract()
  }
}

const loadCatalogs = async () => {
  const catalogs = await contractsStore.fetchCatalogs()
  catalogOptions.value = catalogs
}

const resetEditedContract = () => {
  if (contract.value) {
    editedContract.value = { ...contract.value }
  }
}

const totalDebt = computed(() => {
  if (!contract.value?.debt_concepts) return 0
  return contract.value.debt_concepts.reduce((acc: number, curr: any) => acc + Number.parseFloat(curr.total), 0)
})

const formatDateTime = (value?: string) => {
  if (!value)
    return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return value

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getConceptLabel = (item: any) => {
  const raw = item?.concept_name ?? item?.concept ?? item?.name ?? item?.concepto ?? null

  if (raw && typeof raw === 'object') {
    return raw.name ?? raw.title ?? raw.code ?? raw.external_id ?? raw.externalId ?? item?.external_concept_id ?? '-'
  }

  if (typeof raw === 'string' && raw.trim() !== '')
    return raw

  return item?.external_concept_id ?? item?.concept_code ?? item?.external_concept_code ?? '-'
}

const toggleEdit = () => {
  if (isEditing.value) {
    resetEditedContract()
  }
  isEditing.value = !isEditing.value
}

const handleSave = async () => {
  if (!contract.value) return
  
  try {
    await contractsStore.updateItem(contract.value.id, editedContract.value)
    isEditing.value = false
  } catch (error) {
    console.error('Error updating contract:', error)
  }
}

const confirmDelete = () => {
  isDeleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (!contract.value) return
  
  try {
    await contractsStore.deleteItem(contract.value.id)
    isDeleteDialogVisible.value = false
    router.push({ name: 'contracts-list' })
  } catch (error) {
    console.error('Error deleting contract:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div
    v-if="loading"
    class="d-flex justify-center align-center h-100"
  >
    <VProgressCircular
      indeterminate
      color="primary"
      size="64"
    />
  </div>

  <div
    v-else-if="contract"
    class="contract-detail-view"
  >
    <!-- Header Section -->
    <VCard class="mb-6 detail-card">
      <VCardText>
        <!-- Row 1: ID, Account, User, RFC, Status -->
        <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
          <div class="d-flex align-center gap-4 flex-wrap">
            <div>
              <div class="field-label">
                ID Contrato
              </div>
              <div class="text-h6 font-weight-bold text-medium-emphasis">
                {{ contract.contract_id }}
              </div>
            </div>

            <VDivider
              vertical
              class="mx-2"
              style="height: 32px"
            />

            <div>
              <div class="field-label">
                Num. Contrato
              </div>
              <VChip
                color="primary"
                variant="flat"
                size="default"
                class="font-weight-bold"
              >
                {{ contract.contract_number }}
              </VChip>
            </div>

            <VDivider
              vertical
              class="mx-2"
              style="height: 32px"
            />

            <div>
              <div class="field-label">
                Usuario
              </div>
              <div class="text-h6 font-weight-bold text-uppercase text-medium-emphasis">
                {{ contract.user_name }}
              </div>
            </div>

            <VDivider
              vertical
              class="mx-2"
              style="height: 32px"
            />

            <div>
              <div class="field-label">
                RFC
              </div>
              <div class="text-h6 font-weight-bold text-uppercase text-medium-emphasis">
                {{ contract.rfc || 'N/A' }}
              </div>
            </div>
          </div>

          <div class="d-flex align-center gap-3">
            <template v-if="isEditing">
              <VBtn
                color="secondary"
                variant="tonal"
                prepend-icon="tabler-x"
                @click="toggleEdit"
              >
                Cancelar
              </VBtn>
              <VBtn
                color="primary"
                variant="elevated"
                prepend-icon="tabler-check"
                :loading="loading"
                @click="handleSave"
              >
                Guardar
              </VBtn>
            </template>
            <template v-else>
              <VChip
                :color="contract.status === 'Activo' ? 'success' : 'error'"
                variant="tonal"
                size="default"
                class="font-weight-bold"
              >
                {{ contract.status }}
              </VChip>

              <VMenu>
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    color="primary"
                    variant="tonal"
                    append-icon="tabler-chevron-down"
                  >
                    Acciones
                  </VBtn>
                </template>
                <VList density="compact">
                  <VListItem
                    value="edit"
                    @click="toggleEdit"
                  >
                    <template #prepend>
                      <VIcon
                        icon="tabler-pencil"
                        color="warning"
                      />
                    </template>
                    <VListItemTitle>Editar Todo</VListItemTitle>
                  </VListItem>
                  <VListItem
                    value="sync"
                    @click="console.log('Sync')"
                  >
                    <template #prepend>
                      <VIcon
                        icon="tabler-refresh"
                        color="info"
                      />
                    </template>
                    <VListItemTitle>Sincronizar</VListItemTitle>
                  </VListItem>
                  <VListItem
                    value="delete"
                    @click="confirmDelete"
                  >
                    <template #prepend>
                      <VIcon
                        icon="tabler-trash"
                        color="error"
                      />
                    </template>
                    <VListItemTitle class="text-error">
                      Eliminar
                    </VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </template>
          </div>
        </div>

        <VDivider class="mb-6" />

        <!-- Row 2: Address | System | Sector | Status (if editing) -->
        <VRow>
          <VCol
            cols="12"
            md="6"
            class="pb-2"
          >
            <div>
              <div class="field-label">
                Dirección
              </div>
              <VTextField
                v-if="isEditing"
                v-model="editedContract.address"
                variant="underlined"
                density="compact"
                hide-details
              />
              <div
                v-else
                class="text-body-1"
              >
                {{ contract.address }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <div>
              <div class="field-label">
                Sistema
              </div>
              <AppSelect
                v-if="isEditing"
                v-model="editedContract.system"
                :items="catalogOptions.systems"
                item-title="name"
                item-value="externalId"
                variant="underlined"
                density="compact"
                hide-details
              />
              <div
                v-else
                class="font-weight-medium"
              >
                {{ contract.system?.name || contract.system || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <div>
              <div class="field-label">
                Sector
              </div>
              <AppSelect
                v-if="isEditing"
                v-model="editedContract.sector"
                :items="catalogOptions.sectors"
                item-title="name"
                item-value="externalId"
                variant="underlined"
                density="compact"
                hide-details
              />
              <div
                v-else
                class="font-weight-medium"
              >
                {{ contract.sector?.name || contract.sector || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            v-if="isEditing"
            cols="12"
            md="2"
          >
            <div>
              <div class="field-label">
                Estado
              </div>
              <AppSelect
                v-model="editedContract.status"
                :items="catalogOptions.status"
                item-title="name"
                item-value="externalId"
                variant="underlined"
                density="compact"
                hide-details
              />
            </div>
          </VCol>
        </VRow>

        <!-- Row 3: Route | Cadastral | Loc | Sequence -->
        <VRow class="mt-2">
          <VCol
            cols="12"
            md="3"
          >
            <div>
              <div class="field-label">
                Ruta
              </div>
              <VTextField
                v-if="isEditing"
                v-model="editedContract.route"
                variant="underlined"
                density="compact"
                hide-details
              />
              <div
                v-else
                class="font-weight-medium"
              >
                {{ contract.route || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div>
              <div class="field-label">
                Clave Catastral
              </div>
              <VTextField
                v-if="isEditing"
                v-model="editedContract.cadastral_number"
                variant="underlined"
                density="compact"
                hide-details
              />
              <div
                v-else
                class="font-weight-medium"
              >
                {{ contract.cadastral_number || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div>
              <div class="field-label">
                Clave Loc
              </div>
              <VTextField
                v-if="isEditing"
                v-model="editedContract.clave_loc"
                variant="underlined"
                density="compact"
                hide-details
              />
              <div
                v-else
                class="font-weight-medium"
              >
                {{ contract.clave_loc || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div>
              <div class="field-label">
                Secuencia
              </div>
              <VTextField
                v-if="isEditing"
                v-model="editedContract.sequence"
                type="number"
                variant="underlined"
                density="compact"
                hide-details
              />
              <div
                v-else
                class="font-weight-medium"
              >
                {{ contract.sequence || 'N/A' }}
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VRow>
      <!-- Columna 1: Resumen Financiero (20% exacto) -->
      <VCol
        cols="12"
        class="col-custom-20"
      >
        <VCard class="h-100 detail-card">
          <VCardTitle class="text-subtitle-2 font-weight-bold pb-2 pt-3 px-4 text-secondary">
            Resumen Financiero
          </VCardTitle>
          <VDivider />
          <VCardText class="pt-3 px-4 pb-4">
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Adeudo Total</span>
                <span class="text-body-2 font-weight-bold" :class="totalDebt > 0 ? 'text-error' : 'text-success'">{{ formatCurrency(totalDebt) }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Saldo a Favor</span>
                <span class="text-body-2 font-weight-bold text-success">{{ formatCurrency(contract.positive_balance) }}</span>
              </div>
               <VDivider style="border-style: dashed;" />
               <div class="d-flex justify-space-between align-center">
                 <span class="text-caption text-medium-emphasis">Litigio</span>
                 <VSwitch
                   v-if="isEditing"
                   v-model="editedContract.litigation"
                   density="compact"
                   hide-details
                 />
                 <VChip
                   v-else
                   :color="contract.litigation ? 'error' : 'success'"
                   size="x-small"
                   variant="tonal"
                 >
                   {{ contract.litigation ? 'SÍ' : 'NO' }}
                 </VChip>
               </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Columna 2: Datos Generales (28% exacto) -->
      <VCol
        cols="12"
        class="col-custom-28"
      >
        <VCard class="h-100 detail-card">
          <VCardTitle class="text-subtitle-2 font-weight-bold pb-2 pt-3 px-4 text-secondary">
            Datos Generales
          </VCardTitle>
          <VDivider />
          <VCardText class="pt-3 px-4 pb-4">
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Tipo de Contrato</span>
                <AppSelect
                  v-if="isEditing"
                  v-model="editedContract.contract_type"
                  :items="catalogOptions.type_contracts"
                  item-title="name"
                  item-value="externalId"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 150px"
                />
                <span
                  v-else
                  class="text-body-2 font-weight-bold"
                >{{ contract.contract_type }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Tarifa</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.rate"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 150px"
                />
                <span
                  v-else
                  class="text-body-2 font-weight-bold"
                >{{ contract.rate }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Tipo de Cobro</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.charge_type"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 150px"
                />
                <span
                  v-else
                  class="text-body-2 font-weight-bold"
                >{{ contract.charge_type }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Diámetro de Toma</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.socket_diameter"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 150px"
                />
                <span
                  v-else
                  class="text-body-2 font-weight-bold"
                >{{ contract.socket_diameter }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Actividad Comercial</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.business_activity"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 150px"
                />
                <span
                  v-else
                  class="text-body-2 font-weight-bold"
                >{{ contract.business_activity || 'N/A' }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Columna 3: Datos de Lectura (28% exacto) -->
      <VCol
        cols="12"
        class="col-custom-28"
      >
        <VCard class="h-100 detail-card">
          <VCardTitle class="text-subtitle-2 font-weight-bold pb-2 pt-3 px-4 text-secondary">
            Datos de Lectura
          </VCardTitle>
          <VDivider />
          <VCardText class="pt-3 px-4 pb-4">
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Medidor</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.meter_number"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 150px"
                />
                <span
                  v-else
                  class="text-body-2 font-weight-bold"
                >{{ contract.meter_number }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Consumo Promedio</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.average_consumption"
                  type="number"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 80px"
                />
                <span
                  v-else
                  class="text-body-2 font-weight-bold"
                >{{ contract.average_consumption || '0' }} m³</span>
              </div>
              <VDivider style="border-style: dashed;" />
               <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">m³ Fijos</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.fixed_m3"
                  type="number"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 80px"
                />
                <span
                  v-else
                  class="text-body-2 font-weight-bold"
                >{{ contract.fixed_m3 || '0' }} m³</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex flex-column gap-1">
                <span class="text-caption text-medium-emphasis">Descargado el</span>
                <div class="d-flex align-center gap-2">
                  <VIcon
                    icon="tabler-calendar-time"
                    size="14"
                    color="primary"
                  />
                  <span class="text-caption font-weight-medium">
                    {{ contract.downloaded_at }}
                  </span>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Columna 4: Descuentos y Cargos Especiales (24% exacto) -->
      <VCol
        cols="12"
        class="col-custom-24"
      >
        <VCard class="h-100 detail-card">
          <VCardText class="pt-3 px-4 pb-4">
            <div class="d-flex flex-column gap-3">
              <!-- Sección Descuentos -->
              <div class="text-caption font-weight-bold text-secondary mb-1">
                Descuentos
              </div>

              <!-- Pensión -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Pensión</span>
                <VSwitch
                  v-if="isEditing"
                  v-model="editedContract.pensionary"
                  density="compact"
                  hide-details
                />
                <VChip
                  v-else
                  :color="contract.pensionary ? 'success' : 'secondary'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ contract.pensionary ? 'SÍ' : 'NO' }}
                </VChip>
              </div>
              <div
                v-if="isEditing || contract.pensionary"
                class="d-flex justify-space-between align-center"
              >
                <span class="text-caption text-medium-emphasis ps-4">Vencimiento</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.due_date_pensioner"
                  type="date"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 120px"
                />
                <span
                  v-else
                  class="text-caption font-weight-medium"
                >{{ contract.due_date_pensioner || 'N/A' }}</span>
              </div>

              <VDivider style="border-style: dashed;" />

              <!-- Discapacitado -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Discapacitado</span>
                <VSwitch
                  v-if="isEditing"
                  v-model="editedContract.handicapped"
                  density="compact"
                  hide-details
                />
                <VChip
                  v-else
                  :color="contract.handicapped ? 'success' : 'secondary'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ contract.handicapped ? 'SÍ' : 'NO' }}
                </VChip>
              </div>
              <div
                v-if="isEditing || contract.handicapped"
                class="d-flex justify-space-between align-center"
              >
                <span class="text-caption text-medium-emphasis ps-4">Vencimiento</span>
                <VTextField
                  v-if="isEditing"
                  v-model="editedContract.due_date_handicapped"
                  type="date"
                  variant="underlined"
                  density="compact"
                  hide-details
                  style="max-width: 120px"
                />
                <span
                  v-else
                  class="text-caption font-weight-medium"
                >{{ contract.due_date_handicapped || 'N/A' }}</span>
              </div>

              <VDivider class="my-2" />

              <!-- Sección Cargos Especiales -->
              <div class="text-caption font-weight-bold text-secondary mb-1">
                Cargos Especiales
              </div>

              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Bomberos</span>
                <VSwitch
                  v-if="isEditing"
                  v-model="editedContract.firefighters"
                  density="compact"
                  hide-details
                />
                <VChip
                  v-else
                  :color="contract.firefighters ? 'error' : 'success'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ contract.firefighters ? 'SÍ' : 'NO' }}
                </VChip>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Debt Concepts Table -->
    <VCard class="mt-6 detail-card overflow-hidden">
      <VCardTitle class="text-h6 font-weight-bold px-6 pt-5 pb-0 d-flex align-center">
        <VIcon
          icon="tabler-receipt-2"
          class="me-2"
          color="primary"
        />
        Conceptos de Deuda
      </VCardTitle>
      <VCardText class="pa-0">
        <VDataTable
          :headers="[
            { title: 'Concepto', key: 'concept_name' },
            { title: 'Cant.', key: 'quantity', align: 'end' },
            { title: 'P. Unitario', key: 'unit_price', align: 'end' },
            { title: 'Subtotal', key: 'subtotal', align: 'end' },
            { title: 'IVA', key: 'iva_amount', align: 'end' },
            { title: 'Total', key: 'total', align: 'end' }
          ]"
          :items="contract.debt_concepts"
          hide-default-footer
          class="concepts-table"
        >
          <template v-slot:item.concept_name="{ item }">
            <div class="font-weight-medium">
              {{ getConceptLabel(item) }}
            </div>
          </template>
          <template v-slot:item.unit_price="{ item }">
            {{ formatCurrency(item.unit_price) }}
          </template>
          <template v-slot:item.subtotal="{ item }">
            {{ formatCurrency(item.subtotal) }}
          </template>
          <template v-slot:item.iva_amount="{ item }">
            {{ formatCurrency(item.iva_amount) }}
          </template>
          <template v-slot:item.total="{ item }">
            <span class="font-weight-black text-primary">{{ formatCurrency(item.total) }}</span>
          </template>
        </VDataTable>
      </VCardText>
    </VCard>

    <!-- Charge Concepts Table -->
    <VCard class="mt-6 detail-card overflow-hidden">
      <VCardTitle class="text-h6 font-weight-bold px-6 pt-5 pb-0 d-flex align-center">
        <VIcon
          icon="tabler-currency-dollar-off"
          class="me-2"
          color="secondary"
        />
        Conceptos de Cobro
      </VCardTitle>
      <VCardText class="pa-0">
        <VDataTable
          :headers="[
            { title: 'Concepto', key: 'concept_name' },
            { title: 'Código Externo', key: 'external_concept_id' },
            { title: 'Descargado el', key: 'downloaded_at' }
          ]"
          :items="contract.charge_concepts"
          hide-default-footer
          class="concepts-table"
        >
          <template v-slot:item.concept_name="{ item }">
            <div class="font-weight-medium">
              {{ getConceptLabel(item) }}
            </div>
          </template>
          <template v-slot:item.external_concept_id="{ item }">
            <VChip
              size="x-small"
              variant="outlined"
              color="secondary"
            >
              {{ item.external_concept_id }}
            </VChip>
          </template>
          <template v-slot:item.downloaded_at="{ item }">
            {{ formatDateTime(item.downloaded_at) }}
          </template>
        </VDataTable>
      </VCardText>
    </VCard>

    <!-- Delete Confirmation Modal -->
    <VDialog
      v-model="isDeleteDialogVisible"
      max-width="450"
    >
      <VCard>
        <VCardTitle class="d-flex flex-column align-center pa-6">
          <div class="pa-4 bg-error-lighten-5 rounded-circle mb-3">
             <VIcon
               icon="tabler-alert-triangle"
               color="error"
               size="40"
             />
          </div>
          <span class="text-h5 font-weight-bold">Confirmar Eliminación</span>
        </VCardTitle>

        <VCardText class="text-center px-6 pb-6">
          ¿Estás seguro de que deseas eliminar el contrato <strong>{{ contract.contract_number }}</strong>?
          <div class="text-body-2 text-medium-emphasis mt-2">
            Esta acción realizará un borrado lógico (soft-delete).
          </div>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            color="secondary"
            variant="tonal"
            @click="isDeleteDialogVisible = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="error"
            variant="elevated"
            :loading="loading"
            @click="handleDelete"
          >
            Sí, eliminar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.contract-detail-view {
  padding-bottom: 2rem;
}

.detail-card {
  border: 1px solid rgba(var(--v-border-color), 0.12) !important;
  box-shadow: 0 2px 12px -2px rgba(var(--v-theme-on-surface), 0.08) !important;
  border-radius: 12px !important;
  background-color: rgb(var(--v-theme-surface));
}

.financial-card {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 12px;
  transition: all 0.2s ease-in-out;
  background-color: rgb(var(--v-theme-surface));
}

.financial-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 18px -4px rgba(var(--v-theme-on-surface), 0.12);
  border-color: rgb(var(--v-theme-primary));
}

.action-placeholder {
  border-radius: 12px;
  height: 100%;
  border: 1px dashed rgba(var(--v-border-color), 0.2);
}

.data-list .v-list-item {
  padding-inline: 0 !important;
  margin-bottom: 8px;
}

.data-list .v-icon {
  opacity: 0.8;
  color: rgb(var(--v-theme-primary));
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--v-theme-secondary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

@media (min-width: 960px) {
  .col-custom-20 {
    flex: 0 0 20%;
    max-width: 20%;
  }
  .col-custom-28 {
    flex: 0 0 28%;
    max-width: 28%;
  }
  .col-custom-24 {
    flex: 0 0 24%;
    max-width: 24%;
  }
}
.concepts-table {
  background: transparent !important;
}

.concepts-table :deep(th) {
  text-transform: uppercase !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.5px !important;
  font-weight: 700 !important;
  color: rgb(var(--v-theme-secondary)) !important;
  background-color: rgba(var(--v-theme-on-surface), 0.02) !important;
}

.concepts-table :deep(td) {
  font-size: 0.875rem !important;
  height: 48px !important;
}

.concepts-table :deep(tr:hover) {
  background-color: rgba(var(--v-theme-primary), 0.04) !important;
}
</style>
