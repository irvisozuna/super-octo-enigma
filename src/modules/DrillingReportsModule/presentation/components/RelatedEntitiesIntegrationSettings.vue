<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'saved', settings: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const saving = ref(false)

const integrations = ref({
  weather: {
    enabled: false,
    apiKey: '',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
  },
  maps: {
    enabled: false,
    apiKey: '',
    provider: 'google',
  },
  email: {
    enabled: false,
    smtpHost: '',
    smtpPort: 587,
    username: '',
    password: '',
  },
  storage: {
    enabled: false,
    provider: 'aws',
    bucketName: '',
    accessKey: '',
    secretKey: '',
  },
  google: {
    enabled: false,
    clientId: '',
    clientSecret: '',
    analytics: false,
    maps: false,
  },
  microsoft: {
    enabled: false,
    clientId: '',
    clientSecret: '',
    teams: false,
    office: false,
  },
  webhooks: {
    outgoing: {
      enabled: false,
      url: '',
      secret: '',
      verifySsl: true,
    },
    incoming: {
      enabled: false,
      endpoint: '',
      secret: '',
      requireAuth: true,
    },
  },
  api: {
    version: 'v1',
    rateLimit: 1000,
    cors: true,
    documentation: true,
  },
})

const mapProviderOptions = computed(() => [
  { title: 'Google Maps', value: 'google' },
  { title: 'OpenStreetMap', value: 'osm' },
  { title: 'Mapbox', value: 'mapbox' },
  { title: 'Here Maps', value: 'here' },
])

const storageProviderOptions = computed(() => [
  { title: 'Amazon S3', value: 'aws' },
  { title: 'Google Cloud Storage', value: 'gcp' },
  { title: 'Microsoft Azure', value: 'azure' },
  { title: 'Local Storage', value: 'local' },
])

const handleSave = async () => {
  saving.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('saved', integrations.value)
    emit('update:modelValue', integrations.value)
  }
  catch (error) {
    console.error('Error saving integration settings:', error)
  }
  finally {
    saving.value = false
  }
}

const handleReset = () => {
  integrations.value = {
    weather: {
      enabled: false,
      apiKey: '',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
    },
    maps: {
      enabled: false,
      apiKey: '',
      provider: 'google',
    },
    email: {
      enabled: false,
      smtpHost: '',
      smtpPort: 587,
      username: '',
      password: '',
    },
    storage: {
      enabled: false,
      provider: 'aws',
      bucketName: '',
      accessKey: '',
      secretKey: '',
    },
    google: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      analytics: false,
      maps: false,
    },
    microsoft: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      teams: false,
      office: false,
    },
    webhooks: {
      outgoing: {
        enabled: false,
        url: '',
        secret: '',
        verifySsl: true,
      },
      incoming: {
        enabled: false,
        endpoint: '',
        secret: '',
        requireAuth: true,
      },
    },
    api: {
      version: 'v1',
      rateLimit: 1000,
      cors: true,
      documentation: true,
    },
  }
}

onMounted(() => {
  if (props.modelValue)
    integrations.value = { ...props.modelValue }
})
</script>

<template>
  <div class="related-entities-integration-settings">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-api"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.integrationSettings') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSave">
          <VRow>
            <!-- External APIs -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                {{ $t('DrillingReportsModule.common.externalApis') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-weather-cloudy"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.weatherApi') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="integrations.weather.enabled"
                    :label="$t('DrillingReportsModule.common.enableWeatherApi')"
                  />
                  <VTextField
                    v-model="integrations.weather.apiKey"
                    :label="$t('DrillingReportsModule.common.apiKey')"
                    :disabled="!integrations.weather.enabled"
                    type="password"
                  />
                  <VTextField
                    v-model="integrations.weather.baseUrl"
                    :label="$t('DrillingReportsModule.common.baseUrl')"
                    :disabled="!integrations.weather.enabled"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-map"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.mapsApi') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="integrations.maps.enabled"
                    :label="$t('DrillingReportsModule.common.enableMapsApi')"
                  />
                  <VTextField
                    v-model="integrations.maps.apiKey"
                    :label="$t('DrillingReportsModule.common.apiKey')"
                    :disabled="!integrations.maps.enabled"
                    type="password"
                  />
                  <VSelect
                    v-model="integrations.maps.provider"
                    :items="mapProviderOptions"
                    :label="$t('DrillingReportsModule.common.mapProvider')"
                    :disabled="!integrations.maps.enabled"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-email"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.emailService') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="integrations.email.enabled"
                    :label="$t('DrillingReportsModule.common.enableEmailService')"
                  />
                  <VTextField
                    v-model="integrations.email.smtpHost"
                    :label="$t('DrillingReportsModule.common.smtpHost')"
                    :disabled="!integrations.email.enabled"
                  />
                  <VTextField
                    v-model="integrations.email.smtpPort"
                    :label="$t('DrillingReportsModule.common.smtpPort')"
                    :disabled="!integrations.email.enabled"
                    type="number"
                  />
                  <VTextField
                    v-model="integrations.email.username"
                    :label="$t('DrillingReportsModule.common.username')"
                    :disabled="!integrations.email.enabled"
                  />
                  <VTextField
                    v-model="integrations.email.password"
                    :label="$t('DrillingReportsModule.common.password')"
                    :disabled="!integrations.email.enabled"
                    type="password"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-cloud-upload"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.storageService') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="integrations.storage.enabled"
                    :label="$t('DrillingReportsModule.common.enableStorageService')"
                  />
                  <VSelect
                    v-model="integrations.storage.provider"
                    :items="storageProviderOptions"
                    :label="$t('DrillingReportsModule.common.storageProvider')"
                    :disabled="!integrations.storage.enabled"
                  />
                  <VTextField
                    v-model="integrations.storage.bucketName"
                    :label="$t('DrillingReportsModule.common.bucketName')"
                    :disabled="!integrations.storage.enabled"
                  />
                  <VTextField
                    v-model="integrations.storage.accessKey"
                    :label="$t('DrillingReportsModule.common.accessKey')"
                    :disabled="!integrations.storage.enabled"
                    type="password"
                  />
                  <VTextField
                    v-model="integrations.storage.secretKey"
                    :label="$t('DrillingReportsModule.common.secretKey')"
                    :disabled="!integrations.storage.enabled"
                    type="password"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Third-party Services -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.thirdPartyServices') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-google"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.googleServices') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="integrations.google.enabled"
                    :label="$t('DrillingReportsModule.common.enableGoogleServices')"
                  />
                  <VTextField
                    v-model="integrations.google.clientId"
                    :label="$t('DrillingReportsModule.common.clientId')"
                    :disabled="!integrations.google.enabled"
                  />
                  <VTextField
                    v-model="integrations.google.clientSecret"
                    :label="$t('DrillingReportsModule.common.clientSecret')"
                    :disabled="!integrations.google.enabled"
                    type="password"
                  />
                  <VCheckbox
                    v-model="integrations.google.analytics"
                    :label="$t('DrillingReportsModule.common.googleAnalytics')"
                    :disabled="!integrations.google.enabled"
                  />
                  <VCheckbox
                    v-model="integrations.google.maps"
                    :label="$t('DrillingReportsModule.common.googleMaps')"
                    :disabled="!integrations.google.enabled"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-microsoft"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.microsoftServices') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="integrations.microsoft.enabled"
                    :label="$t('DrillingReportsModule.common.enableMicrosoftServices')"
                  />
                  <VTextField
                    v-model="integrations.microsoft.clientId"
                    :label="$t('DrillingReportsModule.common.clientId')"
                    :disabled="!integrations.microsoft.enabled"
                  />
                  <VTextField
                    v-model="integrations.microsoft.clientSecret"
                    :label="$t('DrillingReportsModule.common.clientSecret')"
                    :disabled="!integrations.microsoft.enabled"
                    type="password"
                  />
                  <VCheckbox
                    v-model="integrations.microsoft.teams"
                    :label="$t('DrillingReportsModule.common.microsoftTeams')"
                    :disabled="!integrations.microsoft.enabled"
                  />
                  <VCheckbox
                    v-model="integrations.microsoft.office"
                    :label="$t('DrillingReportsModule.common.microsoftOffice')"
                    :disabled="!integrations.microsoft.enabled"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Webhooks -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.webhooks') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-webhook"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.outgoingWebhooks') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="integrations.webhooks.outgoing.enabled"
                    :label="$t('DrillingReportsModule.common.enableOutgoingWebhooks')"
                  />
                  <VTextField
                    v-model="integrations.webhooks.outgoing.url"
                    :label="$t('DrillingReportsModule.common.webhookUrl')"
                    :disabled="!integrations.webhooks.outgoing.enabled"
                  />
                  <VTextField
                    v-model="integrations.webhooks.outgoing.secret"
                    :label="$t('DrillingReportsModule.common.webhookSecret')"
                    :disabled="!integrations.webhooks.outgoing.enabled"
                    type="password"
                  />
                  <VCheckbox
                    v-model="integrations.webhooks.outgoing.verifySsl"
                    :label="$t('DrillingReportsModule.common.verifySsl')"
                    :disabled="!integrations.webhooks.outgoing.enabled"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-webhook"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.incomingWebhooks') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="integrations.webhooks.incoming.enabled"
                    :label="$t('DrillingReportsModule.common.enableIncomingWebhooks')"
                  />
                  <VTextField
                    v-model="integrations.webhooks.incoming.endpoint"
                    :label="$t('DrillingReportsModule.common.webhookEndpoint')"
                    :disabled="!integrations.webhooks.incoming.enabled"
                  />
                  <VTextField
                    v-model="integrations.webhooks.incoming.secret"
                    :label="$t('DrillingReportsModule.common.webhookSecret')"
                    :disabled="!integrations.webhooks.incoming.enabled"
                    type="password"
                  />
                  <VCheckbox
                    v-model="integrations.webhooks.incoming.requireAuth"
                    :label="$t('DrillingReportsModule.common.requireAuthentication')"
                    :disabled="!integrations.webhooks.incoming.enabled"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- API Configuration -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.apiConfiguration') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="integrations.api.version"
                :label="$t('DrillingReportsModule.common.apiVersion')"
                :rules="[v => !!v || 'La versión de API es requerida']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="integrations.api.rateLimit"
                :label="$t('DrillingReportsModule.common.rateLimit')"
                suffix="requests/minute"
                :rules="[v => !!v || 'El límite de velocidad es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="integrations.api.cors"
                :label="$t('DrillingReportsModule.common.enableCors')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="integrations.api.documentation"
                :label="$t('DrillingReportsModule.common.enableApiDocumentation')"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol
              cols="12"
              class="d-flex justify-end"
            >
              <VBtn
                color="grey"
                variant="text"
                @click="handleReset"
              >
                {{ $t('DrillingReportsModule.common.reset') }}
              </VBtn>
              <VBtn
                color="primary"
                type="submit"
                :loading="saving"
              >
                {{ $t('DrillingReportsModule.common.save') }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.related-entities-integration-settings {
  inline-size: 100%;
}
</style>
