<script setup lang="ts">
import { computed, ref } from 'vue'
import { useConnectionStore } from '../../stores/connectionStore'
import type { TestQueryDto, TestQueryResponseDto } from '../../application/dtos/ConnectionDtos'

interface Props {
  connectionId: string
  connectionName: string
}

interface Emits {
  (e: 'query-result', result: TestQueryResponseDto): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const connectionStore = useConnectionStore()
const queryType = ref<'custom_sql' | 'query_builder'>('custom_sql')
const customSql = ref('')

const queryBuilder = ref({
  select: ['*'],
  from: '',
  where: [],
  limit: 100,
})

const parameters = ref<string[]>([''])
const testing = ref(false)
const result = ref<TestQueryResponseDto | null>(null)

// Computed properties
const loading = computed(() => connectionStore.schemaLoading)

// Add parameter field
function addParameter() {
  parameters.value.push('')
}

// Remove parameter field
function removeParameter(index: number) {
  parameters.value.splice(index, 1)
}

// Add where condition
function addWhereCondition() {
  queryBuilder.value.where.push({
    column: '',
    operator: '=',
    value: '',
  })
}

// Remove where condition
function removeWhereCondition(index: number) {
  queryBuilder.value.where.splice(index, 1)
}

// Test query
async function testQuery() {
  if (!customSql.value && queryType.value === 'custom_sql')
    return

  if (!queryBuilder.value.from && queryType.value === 'query_builder')
    return

  testing.value = true
  result.value = null

  try {
    const testData: TestQueryDto = {
      type: queryType.value,
    }

    if (queryType.value === 'custom_sql') {
      testData.sql = customSql.value
      testData.parameters = parameters.value.filter(p => p.trim() !== '')
    }
    else {
      testData.query = queryBuilder.value
    }

    const response = await connectionStore.testQuery(props.connectionId, testData)

    result.value = response
    emit('query-result', response)
  }
  catch (error) {
    console.error('Failed to test query:', error)
    result.value = {
      success: false,
      data: {
        columns: [],
        rows: [],
        total_rows: 0,
        execution_time_ms: 0,
      },
    }
  }
  finally {
    testing.value = false
  }
}

// Clear results
function clearResults() {
  result.value = null
}
</script>

<template>
  <VCard
    variant="outlined"
    class="query-tester"
  >
    <VCardTitle class="text-h6 mb-4">
      <VIcon
        icon="mdi-database-search"
        class="me-2"
      />
      Query Tester - {{ connectionName }}
    </VCardTitle>

    <VCardText>
      <div class="d-flex flex-column gap-4">
        <!-- Query Type Selection -->
        <VCard
          variant="outlined"
          class="pa-4"
        >
          <VCardTitle class="text-subtitle-1 mb-4">
            Query Type
          </VCardTitle>

          <VBtnToggle
            v-model="queryType"
            mandatory
            class="mb-4"
          >
            <VBtn value="custom_sql">
              <VIcon
                icon="mdi-code-braces"
                class="me-2"
              />
              Custom SQL
            </VBtn>
            <VBtn value="query_builder">
              <VIcon
                icon="mdi-database-cog"
                class="me-2"
              />
              Query Builder
            </VBtn>
          </VBtnToggle>

          <!-- Custom SQL -->
          <div v-if="queryType === 'custom_sql'">
            <VTextarea
              v-model="customSql"
              label="SQL Query"
              placeholder="SELECT * FROM users WHERE status = ?"
              rows="6"
              auto-grow
              class="mb-4"
            />

            <div class="mb-4">
              <h6 class="text-subtitle-2 mb-2">
                Parameters:
              </h6>
              <div class="d-flex flex-column gap-2">
                <div
                  v-for="(param, index) in parameters"
                  :key="index"
                  class="d-flex gap-2"
                >
                  <VTextField
                    v-model="parameters[index]"
                    :label="`Parameter ${index + 1}`"
                    density="compact"
                    hide-details="auto"
                    placeholder="parameter value"
                  />
                  <VBtn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeParameter(index)"
                  >
                    <VIcon icon="mdi-delete" />
                  </VBtn>
                </div>
                <VBtn
                  variant="text"
                  color="primary"
                  size="small"
                  @click="addParameter"
                >
                  <VIcon
                    icon="mdi-plus"
                    class="me-2"
                  />
                  Add Parameter
                </VBtn>
              </div>
            </div>
          </div>

          <!-- Query Builder -->
          <div v-if="queryType === 'query_builder'">
            <div class="d-flex flex-column gap-4">
              <VTextField
                v-model="queryBuilder.from"
                label="From Table"
                placeholder="users"
                density="comfortable"
                hide-details="auto"
              />

              <VTextField
                v-model="queryBuilder.select"
                label="Select Fields (comma-separated)"
                placeholder="id, name, email"
                density="comfortable"
                hide-details="auto"
              />

              <VTextField
                v-model="queryBuilder.limit"
                label="Limit"
                type="number"
                density="comfortable"
                hide-details="auto"
              />

              <div>
                <h6 class="text-subtitle-2 mb-2">
                  Where Conditions:
                </h6>
                <div class="d-flex flex-column gap-2">
                  <div
                    v-for="(condition, index) in queryBuilder.where"
                    :key="index"
                    class="d-flex gap-2"
                  >
                    <VTextField
                      v-model="condition.column"
                      label="Column"
                      density="compact"
                      hide-details="auto"
                      placeholder="status"
                    />
                    <VSelect
                      v-model="condition.operator"
                      :items="['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN']"
                      label="Operator"
                      density="compact"
                      hide-details="auto"
                      style="max-inline-size: 100px;"
                    />
                    <VTextField
                      v-model="condition.value"
                      label="Value"
                      density="compact"
                      hide-details="auto"
                      placeholder="active"
                    />
                    <VBtn
                      icon
                      variant="text"
                      color="error"
                      size="small"
                      @click="removeWhereCondition(index)"
                    >
                      <VIcon icon="mdi-delete" />
                    </VBtn>
                  </div>
                  <VBtn
                    variant="text"
                    color="primary"
                    size="small"
                    @click="addWhereCondition"
                  >
                    <VIcon
                      icon="mdi-plus"
                      class="me-2"
                    />
                    Add Condition
                  </VBtn>
                </div>
              </div>
            </div>
          </div>
        </VCard>

        <!-- Test Button -->
        <div class="d-flex justify-end">
          <VBtn
            color="primary"
            :loading="testing"
            :disabled="(queryType === 'custom_sql' && !customSql) || (queryType === 'query_builder' && !queryBuilder.from)"
            @click="testQuery"
          >
            <VIcon
              icon="mdi-play"
              class="me-2"
            />
            Test Query
          </VBtn>
        </div>

        <!-- Results -->
        <VCard
          v-if="result"
          variant="outlined"
          class="pa-4"
        >
          <VCardTitle class="text-subtitle-1 mb-4 d-flex justify-space-between">
            <span>Query Results</span>
            <VBtn
              icon
              variant="text"
              size="small"
              @click="clearResults"
            >
              <VIcon icon="mdi-close" />
            </VBtn>
          </VCardTitle>

          <VCardText>
            <VAlert
              :type="result.success ? 'success' : 'error'"
              variant="tonal"
              class="mb-4"
            >
              <template v-if="result.success">
                Query executed successfully in {{ result.data?.execution_time_ms }}ms
              </template>
              <template v-else>
                Query execution failed
              </template>
            </VAlert>

            <div v-if="result.success && result.data">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">
                  Total Rows: {{ result.data.total_rows }}
                </span>
                <span class="text-subtitle-2">
                  Execution Time: {{ result.data.execution_time_ms }}ms
                </span>
              </div>

              <!-- Results Table -->
              <VTable
                v-if="result.data.rows.length > 0"
                density="compact"
                class="border"
              >
                <thead>
                  <tr>
                    <th
                      v-for="column in result.data.columns"
                      :key="column"
                      class="text-left"
                    >
                      {{ column }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in result.data.rows"
                    :key="index"
                  >
                    <td
                      v-for="column in result.data.columns"
                      :key="column"
                    >
                      {{ row[column] }}
                    </td>
                  </tr>
                </tbody>
              </VTable>

              <VAlert
                v-else
                type="info"
                variant="tonal"
              >
                No data returned from query
              </VAlert>
            </div>
          </VCardText>
        </VCard>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.query-tester {
  inline-size: 100%;
}
</style>
