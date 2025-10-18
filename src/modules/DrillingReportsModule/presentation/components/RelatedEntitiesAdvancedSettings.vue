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

const settings = ref({
  api: {
    baseUrl: 'https://api.drillingreports.com',
    timeout: 30000,
    retryAttempts: 3,
    cacheEnabled: true,
  },
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    name: 'drilling_reports',
    username: 'admin',
    password: '',
  },
  security: {
    jwtSecret: '',
    jwtExpiration: 24,
    httpsOnly: true,
    corsEnabled: true,
    corsOrigins: 'http://localhost:3000,https://example.com',
    rateLimiting: true,
  },
  logging: {
    level: 'info',
    filePath: '/var/log/drilling-reports',
    consoleEnabled: true,
    fileEnabled: true,
    maxFileSize: 100,
    maxFiles: 10,
  },
  performance: {
    maxConnections: 100,
    connectionTimeout: 5000,
    compressionEnabled: true,
    cachingEnabled: true,
    cacheSize: 512,
    cacheExpiration: 60,
  },
})

const databaseTypeOptions = computed(() => [
  { title: 'PostgreSQL', value: 'postgresql' },
  { title: 'MySQL', value: 'mysql' },
  { title: 'SQLite', value: 'sqlite' },
  { title: 'MongoDB', value: 'mongodb' },
])

const loggingLevelOptions = computed(() => [
  { title: 'Error', value: 'error' },
  { title: 'Warn', value: 'warn' },
  { title: 'Info', value: 'info' },
  { title: 'Debug', value: 'debug' },
  { title: 'Verbose', value: 'verbose' },
])

const handleSave = async () => {
  saving.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('saved', settings.value)
    emit('update:modelValue', settings.value)
  }
  catch (error) {
    console.error('Error saving settings:', error)
  }
  finally {
    saving.value = false
  }
}

const handleReset = () => {
  settings.value = {
    api: {
      baseUrl: 'https://api.drillingreports.com',
      timeout: 30000,
      retryAttempts: 3,
      cacheEnabled: true,
    },
    database: {
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      name: 'drilling_reports',
      username: 'admin',
      password: '',
    },
    security: {
      jwtSecret: '',
      jwtExpiration: 24,
      httpsOnly: true,
      corsEnabled: true,
      corsOrigins: 'http://localhost:3000,https://example.com',
      rateLimiting: true,
    },
    logging: {
      level: 'info',
      filePath: '/var/log/drilling-reports',
      consoleEnabled: true,
      fileEnabled: true,
      maxFileSize: 100,
      maxFiles: 10,
    },
    performance: {
      maxConnections: 100,
      connectionTimeout: 5000,
      compressionEnabled: true,
      cachingEnabled: true,
      cacheSize: 512,
      cacheExpiration: 60,
    },
  }
}

onMounted(() => {
  if (props.modelValue)
    settings.value = { ...props.modelValue }
})
</script>

<template>
  <div class="related-entities-advanced-settings">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-settings"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.advancedSettings') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSave">
          <VRow>
            <!-- API Configuration -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                {{ $t('DrillingReportsModule.common.apiConfiguration') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.api.baseUrl"
                :label="$t('DrillingReportsModule.common.baseUrl')"
                :rules="[v => !!v || 'La URL base es requerida']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.api.timeout"
                :label="$t('DrillingReportsModule.common.timeout')"
                type="number"
                suffix="ms"
                :rules="[v => !!v || 'El timeout es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.api.retryAttempts"
                :label="$t('DrillingReportsModule.common.retryAttempts')"
                type="number"
                :rules="[v => !!v || 'Los intentos de reintento son requeridos']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.api.cacheEnabled"
                :label="$t('DrillingReportsModule.common.enableCache')"
              />
            </VCol>

            <!-- Database Configuration -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.databaseConfiguration') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="settings.database.type"
                :items="databaseTypeOptions"
                :label="$t('DrillingReportsModule.common.databaseType')"
                :rules="[v => !!v || 'El tipo de base de datos es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.database.host"
                :label="$t('DrillingReportsModule.common.host')"
                :rules="[v => !!v || 'El host es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.database.port"
                :label="$t('DrillingReportsModule.common.port')"
                type="number"
                :rules="[v => !!v || 'El puerto es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.database.name"
                :label="$t('DrillingReportsModule.common.databaseName')"
                :rules="[v => !!v || 'El nombre de la base de datos es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.database.username"
                :label="$t('DrillingReportsModule.common.username')"
                :rules="[v => !!v || 'El nombre de usuario es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.database.password"
                :label="$t('DrillingReportsModule.common.password')"
                type="password"
                :rules="[v => !!v || 'La contraseña es requerida']"
                required
              />
            </VCol>

            <!-- Security Configuration -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.securityConfiguration') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.security.jwtSecret"
                :label="$t('DrillingReportsModule.common.jwtSecret')"
                type="password"
                :rules="[v => !!v || 'El secreto JWT es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.security.jwtExpiration"
                :label="$t('DrillingReportsModule.common.jwtExpiration')"
                suffix="hours"
                :rules="[v => !!v || 'La expiración JWT es requerida']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.security.httpsOnly"
                :label="$t('DrillingReportsModule.common.httpsOnly')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.security.corsEnabled"
                :label="$t('DrillingReportsModule.common.corsEnabled')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.security.corsOrigins"
                :label="$t('DrillingReportsModule.common.corsOrigins')"
                :disabled="!settings.security.corsEnabled"
                placeholder="http://localhost:3000,https://example.com"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.security.rateLimiting"
                :label="$t('DrillingReportsModule.common.rateLimiting')"
              />
            </VCol>

            <!-- Logging Configuration -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.loggingConfiguration') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="settings.logging.level"
                :items="loggingLevelOptions"
                :label="$t('DrillingReportsModule.common.logLevel')"
                :rules="[v => !!v || 'El nivel de log es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.logging.filePath"
                :label="$t('DrillingReportsModule.common.logFilePath')"
                :rules="[v => !!v || 'La ruta del archivo de log es requerida']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.logging.consoleEnabled"
                :label="$t('DrillingReportsModule.common.consoleLogging')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.logging.fileEnabled"
                :label="$t('DrillingReportsModule.common.fileLogging')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.logging.maxFileSize"
                :label="$t('DrillingReportsModule.common.maxLogFileSize')"
                suffix="MB"
                :rules="[v => !!v || 'El tamaño máximo del archivo de log es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.logging.maxFiles"
                :label="$t('DrillingReportsModule.common.maxLogFiles')"
                type="number"
                :rules="[v => !!v || 'El número máximo de archivos de log es requerido']"
                required
              />
            </VCol>

            <!-- Performance Configuration -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.performanceConfiguration') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.performance.maxConnections"
                :label="$t('DrillingReportsModule.common.maxConnections')"
                type="number"
                :rules="[v => !!v || 'El número máximo de conexiones es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.performance.connectionTimeout"
                :label="$t('DrillingReportsModule.common.connectionTimeout')"
                type="number"
                suffix="ms"
                :rules="[v => !!v || 'El timeout de conexión es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.performance.compressionEnabled"
                :label="$t('DrillingReportsModule.common.compressionEnabled')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.performance.cachingEnabled"
                :label="$t('DrillingReportsModule.common.cachingEnabled')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.performance.cacheSize"
                :label="$t('DrillingReportsModule.common.cacheSize')"
                suffix="MB"
                :rules="[v => !!v || 'El tamaño de la caché es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.performance.cacheExpiration"
                :label="$t('DrillingReportsModule.common.cacheExpiration')"
                suffix="minutes"
                :rules="[v => !!v || 'La expiración de la caché es requerida']"
                required
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
.related-entities-advanced-settings {
  inline-size: 100%;
}
</style>
