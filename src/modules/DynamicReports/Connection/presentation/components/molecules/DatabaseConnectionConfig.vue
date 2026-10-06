<script setup lang="ts">
import type { DatabaseDriver } from '../../../domain/entities/Connection'

interface Props {
  modelValue: {
    host: string
    port: number
    database_name: string
    username: string
    password: string
    options?: Record<string, any>
  }
  driver: DatabaseDriver
  errors?: Record<string, string>
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  disabled: false,
})

const emit = defineEmits<Emits>()

// Default ports for different database drivers
const defaultPorts = {
  mysql: 3306,
  postgresql: 5432,
  sqlserver: 1433,
  oracle: 1521,
  sqlite: 0, // SQLite doesn't use a port
}

// Update individual field
function updateField(field: keyof Props['modelValue'], value: any) {
  const updated = { ...props.modelValue, [field]: value }

  emit('update:modelValue', updated)
}

// Set default port when driver changes
watch(() => props.driver, newDriver => {
  if (newDriver && defaultPorts[newDriver] && props.modelValue.port !== defaultPorts[newDriver])
    updateField('port', defaultPorts[newDriver])
}, { immediate: true })
</script>

<template>
  <div class="database-config">
    <VCard
      variant="outlined"
      class="pa-4"
    >
      <VCardTitle class="text-h6 mb-4">
        <VIcon
          icon="mdi-database"
          class="me-2"
        />
        Database Configuration
      </VCardTitle>

      <div class="d-flex flex-column gap-4">
        <!-- Host and Port -->
        <div class="d-flex gap-4">
          <VTextField
            :model-value="modelValue.host"
            label="Host"
            :error-messages="errors.host"
            class="flex-grow-1"
            density="comfortable"
            hide-details="auto"
            :disabled="disabled"
            placeholder="localhost"
            @update:model-value="val => updateField('host', val)"
          />
          <VTextField
            :model-value="modelValue.port"
            label="Port"
            :error-messages="errors.port"
            style="max-inline-size: 120px;"
            density="comfortable"
            hide-details="auto"
            :disabled="disabled"
            type="number"
            :placeholder="String(defaultPorts[driver])"
            @update:model-value="val => updateField('port', Number(val))"
          />
        </div>

        <!-- Database Name -->
        <VTextField
          :model-value="modelValue.database_name"
          label="Database Name"
          :error-messages="errors.database_name"
          density="comfortable"
          hide-details="auto"
          :disabled="disabled"
          placeholder="my_database"
          @update:model-value="val => updateField('database_name', val)"
        />

        <!-- Username and Password -->
        <div class="d-flex gap-4">
          <VTextField
            :model-value="modelValue.username"
            label="Username"
            :error-messages="errors.username"
            class="flex-grow-1"
            density="comfortable"
            hide-details="auto"
            :disabled="disabled"
            placeholder="db_user"
            @update:model-value="val => updateField('username', val)"
          />
          <VTextField
            :model-value="modelValue.password"
            label="Password"
            :error-messages="errors.password"
            class="flex-grow-1"
            density="comfortable"
            hide-details="auto"
            :disabled="disabled"
            type="password"
            placeholder="••••••••"
            @update:model-value="val => updateField('password', val)"
          />
        </div>

        <!-- Advanced Options (collapsible) -->
        <VExpansionPanels variant="accordion">
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon
                icon="mdi-cog"
                class="me-2"
              />
              Advanced Options
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <VTextarea
                :model-value="JSON.stringify(modelValue.options || {}, null, 2)"
                label="Connection Options (JSON)"
                :error-messages="errors.options"
                density="comfortable"
                hide-details="auto"
                :disabled="disabled"
                rows="4"
                placeholder="{&quot;charset&quot;: &quot;utf8mb4&quot;, &quot;timezone&quot;: &quot;+00:00&quot;}"
                @update:model-value="val => {
                  try {
                    updateField('options', JSON.parse(val))
                  }
                  catch {
                    // Invalid JSON, keep as string
                  }
                }"
              />
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>
    </VCard>
  </div>
</template>

<style scoped>
.database-config {
  inline-size: 100%;
}
</style>
