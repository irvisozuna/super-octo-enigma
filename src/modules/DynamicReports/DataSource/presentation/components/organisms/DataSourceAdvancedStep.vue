<script setup lang="ts">
import { computed } from 'vue'
import { useWizardPreviewStore } from '@/stores/wizardPreview.store'
import type { CacheConfig, PaginationConfig, WizardData } from '@/modules/DynamicReports/domain/wizardData'

const emit = defineEmits(['next', 'back'])

const wizardPreviewStore = useWizardPreviewStore()

// Computed para acceder al wizardData del store
const wizardData = computed<WizardData>(() => wizardPreviewStore.wizardData)

// Computed para acceder y actualizar los campos
const pagination = computed<PaginationConfig>({
  get: () => wizardData.value.pagination || { enabled: false, pageSize: 50 },
  set: val => wizardPreviewStore.updateWizardData({ pagination: val }),
})

const cacheConfig = computed<CacheConfig>({
  get: () => wizardData.value.cacheConfig || { enabled: false, ttl: 300 },
  set: val => wizardPreviewStore.updateWizardData({ cacheConfig: val }),
})

const isActive = computed<boolean>({
  get: () => wizardData.value.isActive !== undefined ? wizardData.value.isActive : true,
  set: val => wizardPreviewStore.updateWizardData({ isActive: val }),
})

function nextStep() {
  emit('next')
}

function backStep() {
  emit('back')
}

const setPaginationEnabled = (val: boolean) => {
  pagination.value = { ...pagination.value, enabled: val }
}

const setPaginationPageSize = (val: number) => {
  pagination.value = { ...pagination.value, pageSize: val }
}

const setCacheEnabled = (val: boolean) => {
  cacheConfig.value = { ...cacheConfig.value, enabled: val }
}

const setCacheTtl = (val: number) => {
  cacheConfig.value = { ...cacheConfig.value, ttl: val }
}
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-database"
              class="me-2"
            />
            Resumen de Configuración
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="6">
                <div class="text-caption">
                  Conexión:
                </div>
                <div class="text-body-1">
                  {{ wizardData.connection_name }}
                </div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption">
                  Tipo:
                </div>
                <div class="text-body-1">
                  {{ wizardData.type === 'custom_sql' ? 'SQL Personalizado'
                    : wizardData.type === 'table' ? 'Tabla/Vista' : 'Stored Procedure' }}
                </div>
              </VCol>
            </VRow>
            <VRow v-if="wizardData.type === 'table'">
              <VCol cols="6">
                <div class="text-caption">
                  Tabla:
                </div>
                <div class="text-body-1">
                  {{ wizardData.table }}
                </div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption">
                  Campos:
                </div>
                <div class="text-body-1">
                  {{ wizardData.selectedFields?.length || 0 }} seleccionados
                </div>
              </VCol>
            </VRow>
            <VRow v-if="wizardData.description">
              <VCol cols="12">
                <div class="text-caption">
                  Descripción:
                </div>
                <div class="text-body-1">
                  {{ wizardData.description }}
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Paginación -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-page-layout-body"
              class="me-2"
            />
            Paginación
          </VCardTitle>
          <VCardText>
            <VSwitch
              :model-value="pagination.enabled"
              label="Habilitar paginación"
              color="primary"
              @update:model-value="setPaginationEnabled"
            />

            <div
              v-if="pagination.enabled"
              class="mt-4"
            >
              <VTextField
                :model-value="pagination.pageSize"
                label="Tamaño de página"
                type="number"
                min="1"
                max="1000"
                :hint="`Máximo ${pagination.pageSize} registros por página`"
                persistent-hint
                @update:model-value="setPaginationPageSize"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Cache -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-cached"
              class="me-2"
            />
            Cache
          </VCardTitle>
          <VCardText>
            <VSwitch
              :model-value="cacheConfig.enabled"
              label="Habilitar cache"
              color="primary"
              @update:model-value="setCacheEnabled"
            />

            <div
              v-if="cacheConfig.enabled"
              class="mt-4"
            >
              <VTextField
                :model-value="cacheConfig.ttl"
                label="Tiempo de vida (segundos)"
                type="number"
                min="60"
                max="86400"
                :hint="`Los resultados se cachearán por ${cacheConfig.ttl} segundos`"
                persistent-hint
                @update:model-value="setCacheTtl"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Estado -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-toggle-switch"
              class="me-2"
            />
            Estado
          </VCardTitle>
          <VCardText>
            <VSwitch
              v-model="isActive"
              label="Data Source activo"
              color="primary"
              :hint="isActive ? 'El Data Source estará disponible para reportes' : 'El Data Source estará deshabilitado'"
              persistent-hint
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <div class="d-flex justify-space-between mt-6">
      <VBtn
        variant="outlined"
        @click="backStep"
      >
        <VIcon
          icon="tabler-arrow-left"
          class="me-2"
        />
        Anterior
      </VBtn>
      <VBtn
        color="primary"
        @click="nextStep"
      >
        Siguiente
        <VIcon
          icon="tabler-arrow-right"
          class="ms-2"
        />
      </VBtn>
    </div>
  </div>
</template>
