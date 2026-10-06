<script setup lang="ts">
import type { ApiAuthType } from '../../../domain/entities/Connection'

interface Props {
  modelValue: {
    api_base_url: string
    api_auth_type: ApiAuthType
    api_auth_config?: {
      token?: string
      username?: string
      password?: string
      api_key?: string
      headers?: Record<string, string>
    }
  }
  errors?: Record<string, string>
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: Props['modelValue']): void
  (e: 'blur-base-url'): void
  (e: 'blur-auth-type'): void
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
  disabled: false,
})

const emit = defineEmits<Emits>()

const authTypeOptions = [
  { title: 'No Authentication', value: 'none' },
  { title: 'Bearer Token', value: 'bearer' },
  { title: 'Basic Authentication', value: 'basic' },
  { title: 'API Key', value: 'api_key' },
]

// Update individual field
function updateField(field: keyof Props['modelValue'], value: any) {
  const updated = { ...props.modelValue, [field]: value }

  emit('update:modelValue', updated)
}

// Update auth config field
function updateAuthConfig(field: string, value: any) {
  const updated = {
    ...props.modelValue,
    api_auth_config: {
      ...props.modelValue.api_auth_config,
      [field]: value,
    },
  }

  emit('update:modelValue', updated)
}

// Update headers
function updateHeaders(headers: Record<string, string>) {
  updateAuthConfig('headers', headers)
}

// Parse headers from string
function parseHeaders(headersString: string): Record<string, string> {
  try {
    return JSON.parse(headersString)
  }
  catch {
    return {}
  }
}
</script>

<template>
  <div class="api-config">
    <VCard
      variant="outlined"
      class="pa-4"
    >
      <VCardTitle class="text-h6 mb-4">
        <VIcon
          icon="mdi-web"
          class="me-2"
        />
        API Configuration
      </VCardTitle>

      <div class="d-flex flex-column gap-4">
        <!-- Base URL -->
        <VTextField
          :model-value="modelValue.api_base_url"
          label="API Base URL"
          :error-messages="errors.api_base_url"
          density="comfortable"
          hide-details="auto"
          :disabled="disabled"
          placeholder="https://api.example.com"
          @update:model-value="val => updateField('api_base_url', val)"
          @blur="$emit('blur-base-url')"
        />

        <!-- Authentication Type -->
        <VSelect
          :model-value="modelValue.api_auth_type"
          label="Authentication Type"
          :error-messages="errors.api_auth_type"
          :items="authTypeOptions"
          density="comfortable"
          hide-details="auto"
          :disabled="disabled"
          @update:model-value="val => updateField('api_auth_type', val)"
          @blur="$emit('blur-auth-type')"
        />

        <!-- Authentication Configuration -->
        <VExpansionPanels
          v-if="modelValue.api_auth_type !== 'none'"
          variant="accordion"
        >
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon
                icon="mdi-shield-key"
                class="me-2"
              />
              Authentication Configuration
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <div class="d-flex flex-column gap-4">
                <!-- Bearer Token -->
                <VTextField
                  v-if="modelValue.api_auth_type === 'bearer'"
                  :model-value="modelValue.api_auth_config?.token"
                  label="Bearer Token"
                  :error-messages="errors.token"
                  density="comfortable"
                  hide-details="auto"
                  :disabled="disabled"
                  type="password"
                  placeholder="your-api-token"
                  @update:model-value="val => updateAuthConfig('token', val)"
                />

                <!-- Basic Auth -->
                <template v-if="modelValue.api_auth_type === 'basic'">
                  <VTextField
                    :model-value="modelValue.api_auth_config?.username"
                    label="Username"
                    :error-messages="errors.username"
                    density="comfortable"
                    hide-details="auto"
                    :disabled="disabled"
                    placeholder="api_username"
                    @update:model-value="val => updateAuthConfig('username', val)"
                  />
                  <VTextField
                    :model-value="modelValue.api_auth_config?.password"
                    label="Password"
                    :error-messages="errors.password"
                    density="comfortable"
                    hide-details="auto"
                    :disabled="disabled"
                    type="password"
                    placeholder="••••••••"
                    @update:model-value="val => updateAuthConfig('password', val)"
                  />
                </template>

                <!-- API Key -->
                <VTextField
                  v-if="modelValue.api_auth_type === 'api_key'"
                  :model-value="modelValue.api_auth_config?.api_key"
                  label="API Key"
                  :error-messages="errors.api_key"
                  density="comfortable"
                  hide-details="auto"
                  :disabled="disabled"
                  type="password"
                  placeholder="your-api-key"
                  @update:model-value="val => updateAuthConfig('api_key', val)"
                />

                <!-- Custom Headers -->
                <VExpansionPanels variant="accordion">
                  <VExpansionPanel>
                    <VExpansionPanelTitle>
                      <VIcon
                        icon="mdi-format-header-pound"
                        class="me-2"
                      />
                      Custom Headers
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      <VTextarea
                        :model-value="JSON.stringify(modelValue.api_auth_config?.headers || {}, null, 2)"
                        label="Custom Headers (JSON)"
                        :error-messages="errors.headers"
                        density="comfortable"
                        hide-details="auto"
                        :disabled="disabled"
                        rows="4"
                        placeholder="{&quot;Accept&quot;: &quot;application/json&quot;, &quot;User-Agent&quot;: &quot;DynamicReports/1.0&quot;}"
                        @update:model-value="val => updateHeaders(parseHeaders(val))"
                      />
                    </VExpansionPanelText>
                  </VExpansionPanel>
                </VExpansionPanels>
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>
    </VCard>
  </div>
</template>

<style scoped>
.api-config {
  inline-size: 100%;
}
</style>
