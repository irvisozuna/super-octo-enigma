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
  defaultPageSize: 20,
  defaultLanguage: 'es',
  defaultTimezone: 'America/Mexico_City',
  defaultCurrency: 'MXN',
  notifications: {
    email: true,
    push: true,
    sms: false,
    daily: true,
  },
  security: {
    twoFactor: false,
    sessionTimeout: true,
    sessionTimeoutMinutes: 30,
    auditLog: true,
  },
  data: {
    autoSave: true,
    autoSaveInterval: 30,
    dataValidation: true,
    dataEncryption: false,
  },
  export: {
    defaultFormat: 'xlsx',
    includeMetadata: true,
    compressFiles: true,
    maxFileSize: 100,
  },
})

const languageOptions = computed(() => [
  { title: 'Español', value: 'es' },
  { title: 'English', value: 'en' },
  { title: 'Português', value: 'pt' },
  { title: 'Français', value: 'fr' },
])

const timezoneOptions = computed(() => [
  { title: 'America/Mexico_City', value: 'America/Mexico_City' },
  { title: 'America/New_York', value: 'America/New_York' },
  { title: 'America/Los_Angeles', value: 'America/Los_Angeles' },
  { title: 'Europe/London', value: 'Europe/London' },
  { title: 'Europe/Paris', value: 'Europe/Paris' },
  { title: 'Asia/Tokyo', value: 'Asia/Tokyo' },
])

const currencyOptions = computed(() => [
  { title: 'MXN - Peso Mexicano', value: 'MXN' },
  { title: 'USD - Dólar Americano', value: 'USD' },
  { title: 'EUR - Euro', value: 'EUR' },
  { title: 'GBP - Libra Esterlina', value: 'GBP' },
  { title: 'JPY - Yen Japonés', value: 'JPY' },
])

const exportFormatOptions = computed(() => [
  { title: 'Excel (.xlsx)', value: 'xlsx' },
  { title: 'CSV (.csv)', value: 'csv' },
  { title: 'PDF (.pdf)', value: 'pdf' },
  { title: 'JSON (.json)', value: 'json' },
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
    defaultPageSize: 20,
    defaultLanguage: 'es',
    defaultTimezone: 'America/Mexico_City',
    defaultCurrency: 'MXN',
    notifications: {
      email: true,
      push: true,
      sms: false,
      daily: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: true,
      sessionTimeoutMinutes: 30,
      auditLog: true,
    },
    data: {
      autoSave: true,
      autoSaveInterval: 30,
      dataValidation: true,
      dataEncryption: false,
    },
    export: {
      defaultFormat: 'xlsx',
      includeMetadata: true,
      compressFiles: true,
      maxFileSize: 100,
    },
  }
}

onMounted(() => {
  if (props.modelValue)
    settings.value = { ...props.modelValue }
})
</script>

<template>
  <div class="related-entities-settings">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-cog"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.settings') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSave">
          <VRow>
            <!-- General Settings -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                {{ $t('DrillingReportsModule.common.generalSettings') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.defaultPageSize"
                :label="$t('DrillingReportsModule.common.defaultPageSize')"
                type="number"
                :rules="[v => !!v || 'Debe especificar un tamaño de página']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="settings.defaultLanguage"
                :items="languageOptions"
                :label="$t('DrillingReportsModule.common.defaultLanguage')"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="settings.defaultTimezone"
                :items="timezoneOptions"
                :label="$t('DrillingReportsModule.common.defaultTimezone')"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="settings.defaultCurrency"
                :items="currencyOptions"
                :label="$t('DrillingReportsModule.common.defaultCurrency')"
                required
              />
            </VCol>

            <!-- Notification Settings -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.notificationSettings') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.notifications.email"
                :label="$t('DrillingReportsModule.common.emailNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.notifications.push"
                :label="$t('DrillingReportsModule.common.pushNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.notifications.sms"
                :label="$t('DrillingReportsModule.common.smsNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.notifications.daily"
                :label="$t('DrillingReportsModule.common.dailyDigest')"
              />
            </VCol>

            <!-- Security Settings -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.securitySettings') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.security.twoFactor"
                :label="$t('DrillingReportsModule.common.twoFactorAuthentication')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.security.sessionTimeout"
                :label="$t('DrillingReportsModule.common.sessionTimeout')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.security.sessionTimeoutMinutes"
                :label="$t('DrillingReportsModule.common.sessionTimeoutMinutes')"
                type="number"
                :disabled="!settings.security.sessionTimeout"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.security.auditLog"
                :label="$t('DrillingReportsModule.common.auditLogging')"
              />
            </VCol>

            <!-- Data Settings -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.dataSettings') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.data.autoSave"
                :label="$t('DrillingReportsModule.common.autoSave')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.data.autoSaveInterval"
                :label="$t('DrillingReportsModule.common.autoSaveInterval')"
                type="number"
                :disabled="!settings.data.autoSave"
                suffix="segundos"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.data.dataValidation"
                :label="$t('DrillingReportsModule.common.dataValidation')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.data.dataEncryption"
                :label="$t('DrillingReportsModule.common.dataEncryption')"
              />
            </VCol>

            <!-- Export Settings -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.exportSettings') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="settings.export.defaultFormat"
                :items="exportFormatOptions"
                :label="$t('DrillingReportsModule.common.defaultExportFormat')"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.export.includeMetadata"
                :label="$t('DrillingReportsModule.common.includeMetadata')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.export.compressFiles"
                :label="$t('DrillingReportsModule.common.compressFiles')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.export.maxFileSize"
                :label="$t('DrillingReportsModule.common.maxFileSize')"
                type="number"
                suffix="MB"
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
.related-entities-settings {
  inline-size: 100%;
}
</style>
