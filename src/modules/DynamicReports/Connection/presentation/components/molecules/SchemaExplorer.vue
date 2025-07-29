<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConnectionStore } from '../../stores/connectionStore'
import type { ProcedureInfoDto, TableInfoDto } from '../../application/dtos/ConnectionDtos'

interface Props {
  connectionId: string
  connectionName: string
  driver: string
}

interface Emits {
  (e: 'table-selected', table: TableInfoDto): void
  (e: 'procedure-selected', procedure: ProcedureInfoDto): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const connectionStore = useConnectionStore()
const activeTab = ref('tables')
const selectedTable = ref<TableInfoDto | null>(null)
const selectedProcedure = ref<ProcedureInfoDto | null>(null)

// Computed properties
const tables = computed(() => connectionStore.tables)
const procedures = computed(() => connectionStore.procedures)
const columns = computed(() => connectionStore.columns)
const loading = computed(() => connectionStore.schemaLoading)

// Load schema data
async function loadTables() {
  try {
    await connectionStore.fetchTablesAndViews(props.connectionId)
  }
  catch (error) {
    console.error('Failed to load tables:', error)
  }
}

async function loadProcedures() {
  try {
    await connectionStore.fetchProcedures(props.connectionId)
  }
  catch (error) {
    console.error('Failed to load procedures:', error)
  }
}

async function loadColumns(tableOrProcedure: string, type: 'table' | 'procedure' = 'table') {
  try {
    const params = type === 'table' ? { table: tableOrProcedure } : { procedure: tableOrProcedure }

    await connectionStore.fetchColumns(props.connectionId, params)
  }
  catch (error) {
    console.error('Failed to load columns:', error)
  }
}

function selectTable(table: TableInfoDto) {
  selectedTable.value = table
  selectedProcedure.value = null
  loadColumns(table.name, 'table')
  emit('table-selected', table)
}

function selectProcedure(procedure: ProcedureInfoDto) {
  selectedProcedure.value = procedure
  selectedTable.value = null
  loadColumns(procedure.name, 'procedure')
  emit('procedure-selected', procedure)
}

// Load initial data
loadTables()
if (['mysql', 'postgresql', 'sqlserver', 'oracle'].includes(props.driver))
  loadProcedures()
</script>

<template>
  <VCard
    variant="outlined"
    class="schema-explorer"
  >
    <VCardTitle class="text-h6 mb-4">
      <VIcon
        icon="mdi-database-search"
        class="me-2"
      />
      Schema Explorer - {{ connectionName }}
    </VCardTitle>

    <VCardText>
      <VTabs
        v-model="activeTab"
        class="mb-4"
      >
        <VTab value="tables">
          <VIcon
            icon="mdi-table"
            class="me-2"
          />
          Tables & Views
        </VTab>
        <VTab
          v-if="['mysql', 'postgresql', 'sqlserver', 'oracle'].includes(driver)"
          value="procedures"
        >
          <VIcon
            icon="mdi-function"
            class="me-2"
          />
          Stored Procedures
        </VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <!-- Tables and Views -->
        <VWindowItem value="tables">
          <div class="d-flex gap-4">
            <!-- Tables List -->
            <div class="flex-grow-1">
              <VCard variant="outlined">
                <VCardTitle class="text-subtitle-1 pa-4">
                  Tables & Views
                  <VProgressLinear
                    v-if="loading"
                    indeterminate
                    class="mt-2"
                  />
                </VCardTitle>
                <VCardText class="pa-0">
                  <VList density="compact">
                    <VListItem
                      v-for="table in tables"
                      :key="table.name"
                      :active="selectedTable?.name === table.name"
                      @click="selectTable(table)"
                    >
                      <template #prepend>
                        <VIcon
                          :icon="table.type === 'table' ? 'mdi-table' : 'mdi-view-dashboard'"
                          :color="table.type === 'table' ? 'primary' : 'secondary'"
                        />
                      </template>
                      <VListItemTitle>{{ table.name }}</VListItemTitle>
                      <template #append>
                        <VChip
                          size="x-small"
                          :color="table.type === 'table' ? 'primary' : 'secondary'"
                          variant="tonal"
                        >
                          {{ table.type }}
                        </VChip>
                      </template>
                    </VListItem>
                    <VListItem v-if="tables.length === 0 && !loading">
                      <VListItemTitle class="text-center text-disabled">
                        No tables found
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </VCardText>
              </VCard>
            </div>

            <!-- Columns -->
            <div
              v-if="selectedTable"
              class="flex-grow-1"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-subtitle-1 pa-4">
                  Columns - {{ selectedTable.name }}
                  <VProgressLinear
                    v-if="loading"
                    indeterminate
                    class="mt-2"
                  />
                </VCardTitle>
                <VCardText class="pa-0">
                  <VList density="compact">
                    <VListItem
                      v-for="column in columns"
                      :key="column.name"
                    >
                      <template #prepend>
                        <VIcon
                          icon="mdi-table-column"
                          color="info"
                        />
                      </template>
                      <VListItemTitle>{{ column.name }}</VListItemTitle>
                      <template #append>
                        <VChip
                          size="x-small"
                          color="info"
                          variant="tonal"
                        >
                          {{ column.type }}
                        </VChip>
                      </template>
                    </VListItem>
                    <VListItem v-if="columns.length === 0 && !loading">
                      <VListItemTitle class="text-center text-disabled">
                        No columns found
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </VCardText>
              </VCard>
            </div>
          </div>
        </VWindowItem>

        <!-- Stored Procedures -->
        <VWindowItem value="procedures">
          <div class="d-flex gap-4">
            <!-- Procedures List -->
            <div class="flex-grow-1">
              <VCard variant="outlined">
                <VCardTitle class="text-subtitle-1 pa-4">
                  Stored Procedures
                  <VProgressLinear
                    v-if="loading"
                    indeterminate
                    class="mt-2"
                  />
                </VCardTitle>
                <VCardText class="pa-0">
                  <VList density="compact">
                    <VListItem
                      v-for="procedure in procedures"
                      :key="procedure.name"
                      :active="selectedProcedure?.name === procedure.name"
                      @click="selectProcedure(procedure)"
                    >
                      <template #prepend>
                        <VIcon
                          icon="mdi-function"
                          color="success"
                        />
                      </template>
                      <VListItemTitle>{{ procedure.name }}</VListItemTitle>
                      <template #append>
                        <VChip
                          v-if="procedure.params?.length"
                          size="x-small"
                          color="success"
                          variant="tonal"
                        >
                          {{ procedure.params.length }} params
                        </VChip>
                      </template>
                    </VListItem>
                    <VListItem v-if="procedures.length === 0 && !loading">
                      <VListItemTitle class="text-center text-disabled">
                        No procedures found
                      </VListItemTitle>
                    </VListItem>
                  </VList>
                </VCardText>
              </VCard>
            </div>

            <!-- Procedure Details -->
            <div
              v-if="selectedProcedure"
              class="flex-grow-1"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-subtitle-1 pa-4">
                  Procedure Details - {{ selectedProcedure.name }}
                  <VProgressLinear
                    v-if="loading"
                    indeterminate
                    class="mt-2"
                  />
                </VCardTitle>
                <VCardText>
                  <div
                    v-if="selectedProcedure.params?.length"
                    class="mb-4"
                  >
                    <h6 class="text-subtitle-2 mb-2">
                      Parameters:
                    </h6>
                    <VList density="compact">
                      <VListItem
                        v-for="param in selectedProcedure.params"
                        :key="param.name"
                      >
                        <template #prepend>
                          <VIcon
                            icon="mdi-variable"
                            color="warning"
                          />
                        </template>
                        <VListItemTitle>{{ param.name }}</VListItemTitle>
                        <template #append>
                          <VChip
                            size="x-small"
                            color="warning"
                            variant="tonal"
                          >
                            {{ param.type }}
                          </VChip>
                        </template>
                      </VListItem>
                    </VList>
                  </div>

                  <div v-if="columns.length > 0">
                    <h6 class="text-subtitle-2 mb-2">
                      Result Columns:
                    </h6>
                    <VList density="compact">
                      <VListItem
                        v-for="column in columns"
                        :key="column.name"
                      >
                        <template #prepend>
                          <VIcon
                            icon="mdi-table-column"
                            color="info"
                          />
                        </template>
                        <VListItemTitle>{{ column.name }}</VListItemTitle>
                        <template #append>
                          <VChip
                            size="x-small"
                            color="info"
                            variant="tonal"
                          >
                            {{ column.type }}
                          </VChip>
                        </template>
                      </VListItem>
                    </VList>
                  </div>
                </VCardText>
              </VCard>
            </div>
          </div>
        </VWindowItem>
      </VWindow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.schema-explorer {
  inline-size: 100%;
}
</style>
