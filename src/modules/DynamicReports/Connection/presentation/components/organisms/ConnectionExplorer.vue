<script setup lang="ts">
import { ref } from 'vue'
import SchemaExplorer from '../molecules/SchemaExplorer.vue'
import QueryTester from '../molecules/QueryTester.vue'
import type { ProcedureInfoDto, TableInfoDto, TestQueryResponseDto } from '../../application/dtos/ConnectionDtos'

interface Props {
  connectionId: string
  connectionName: string
  driver: string
}

interface Emits {
  (e: 'table-selected', table: TableInfoDto): void
  (e: 'procedure-selected', procedure: ProcedureInfoDto): void
  (e: 'query-result', result: TestQueryResponseDto): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const activeTab = ref('schema')

function handleTableSelected(table: TableInfoDto) {
  emit('table-selected', table)
}

function handleProcedureSelected(procedure: ProcedureInfoDto) {
  emit('procedure-selected', procedure)
}

function handleQueryResult(result: TestQueryResponseDto) {
  emit('query-result', result)
}
</script>

<template>
  <VCard
    variant="outlined"
    class="connection-explorer"
  >
    <VCardTitle class="text-h5 mb-4">
      <VIcon
        icon="mdi-database-cog"
        class="me-2"
      />
      Connection Explorer - {{ connectionName }}
    </VCardTitle>

    <VCardText>
      <VTabs
        v-model="activeTab"
        class="mb-4"
      >
        <VTab value="schema">
          <VIcon
            icon="mdi-database-search"
            class="me-2"
          />
          Schema Explorer
        </VTab>
        <VTab value="query">
          <VIcon
            icon="mdi-code-braces"
            class="me-2"
          />
          Query Tester
        </VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <VWindowItem value="schema">
          <SchemaExplorer
            :connection-id="connectionId"
            :connection-name="connectionName"
            :driver="driver"
            @table-selected="handleTableSelected"
            @procedure-selected="handleProcedureSelected"
          />
        </VWindowItem>

        <VWindowItem value="query">
          <QueryTester
            :connection-id="connectionId"
            :connection-name="connectionName"
            @query-result="handleQueryResult"
          />
        </VWindowItem>
      </VWindow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.connection-explorer {
  inline-size: 100%;
}
</style>
