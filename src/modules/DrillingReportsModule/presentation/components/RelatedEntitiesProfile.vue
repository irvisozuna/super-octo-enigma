<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'saved', profile: any): void
  (e: 'avatarChanged', avatar: string): void
  (e: 'passwordChanged'): void
  (e: 'twoFactorEnabled'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const saving = ref(false)

const profile = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  avatar: '',
  language: 'es',
  timezone: 'America/Mexico_City',
  currency: 'MXN',
  dateFormat: 'DD/MM/YYYY',
  notifications: {
    email: true,
    push: true,
    sms: false,
    daily: true,
  },
})

const departmentOptions = computed(() => [
  { title: t('DrillingReportsModule.employees.departments.operations'), value: 'operations' },
  { title: t('DrillingReportsModule.employees.departments.engineering'), value: 'engineering' },
  { title: t('DrillingReportsModule.employees.departments.safety'), value: 'safety' },
  { title: t('DrillingReportsModule.employees.departments.geology'), value: 'geology' },
  { title: t('DrillingReportsModule.employees.departments.management'), value: 'management' },
  { title: t('DrillingReportsModule.employees.departments.technical'), value: 'technical' },
  { title: t('DrillingReportsModule.employees.departments.quality'), value: 'quality' },
  { title: t('DrillingReportsModule.employees.departments.maintenance'), value: 'maintenance' },
])

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

const dateFormatOptions = computed(() => [
  { title: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { title: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { title: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
  { title: 'DD-MM-YYYY', value: 'DD-MM-YYYY' },
])

const handleSave = async () => {
  saving.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('saved', profile.value)
    emit('update:modelValue', profile.value)
  }
  catch (error) {
    console.error('Error saving profile:', error)
  }
  finally {
    saving.value = false
  }
}

const handleCancel = () => {
  // Reset to original values
  if (props.modelValue)
    profile.value = { ...props.modelValue }
}

const handleUploadAvatar = () => {
  // Simulate file upload
  const input = document.createElement('input')

  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()

      reader.onload = (e: any) => {
        profile.value.avatar = e.target.result
        emit('avatarChanged', e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

const handleRemoveAvatar = () => {
  profile.value.avatar = ''
  emit('avatarChanged', '')
}

const handleChangePassword = () => {
  emit('passwordChanged')
}

const handleEnableTwoFactor = () => {
  emit('twoFactorEnabled')
}

onMounted(() => {
  if (props.modelValue)
    profile.value = { ...props.modelValue }
})
</script>

<template>
  <div class="related-entities-profile">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-account"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.userProfile') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSave">
          <VRow>
            <!-- Personal Information -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                {{ $t('DrillingReportsModule.common.personalInformation') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="profile.firstName"
                :label="$t('DrillingReportsModule.employees.firstName')"
                :rules="[v => !!v || 'El nombre es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="profile.lastName"
                :label="$t('DrillingReportsModule.employees.lastName')"
                :rules="[v => !!v || 'El apellido es requerido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="profile.email"
                :label="$t('DrillingReportsModule.employees.email')"
                type="email"
                :rules="[v => !!v || 'El correo es requerido', v => /.+@.+\..+/.test(v) || 'Correo inválido']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="profile.phone"
                :label="$t('DrillingReportsModule.employees.phone')"
                type="tel"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="profile.position"
                :label="$t('DrillingReportsModule.employees.position')"
                :rules="[v => !!v || 'La posición es requerida']"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="profile.department"
                :items="departmentOptions"
                :label="$t('DrillingReportsModule.employees.department')"
                :rules="[v => !!v || 'El departamento es requerido']"
                required
              />
            </VCol>

            <!-- Profile Picture -->
            <VCol cols="12">
              <div class="d-flex align-center">
                <VAvatar
                  size="80"
                  class="me-4"
                >
                  <img
                    v-if="profile.avatar"
                    :src="profile.avatar"
                    alt="Avatar"
                  >
                  <VIcon
                    v-else
                    icon="mdi-account"
                    size="40"
                  />
                </VAvatar>
                <div>
                  <VBtn
                    color="primary"
                    variant="outlined"
                    @click="handleUploadAvatar"
                  >
                    {{ $t('DrillingReportsModule.common.changeAvatar') }}
                  </VBtn>
                  <VBtn
                    v-if="profile.avatar"
                    color="error"
                    variant="text"
                    @click="handleRemoveAvatar"
                  >
                    {{ $t('DrillingReportsModule.common.removeAvatar') }}
                  </VBtn>
                </div>
              </div>
            </VCol>

            <!-- Preferences -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.preferences') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="profile.language"
                :items="languageOptions"
                :label="$t('DrillingReportsModule.common.language')"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="profile.timezone"
                :items="timezoneOptions"
                :label="$t('DrillingReportsModule.common.timezone')"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="profile.currency"
                :items="currencyOptions"
                :label="$t('DrillingReportsModule.common.currency')"
                required
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="profile.dateFormat"
                :items="dateFormatOptions"
                :label="$t('DrillingReportsModule.common.dateFormat')"
                required
              />
            </VCol>

            <!-- Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.notifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="profile.notifications.email"
                :label="$t('DrillingReportsModule.common.emailNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="profile.notifications.push"
                :label="$t('DrillingReportsModule.common.pushNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="profile.notifications.sms"
                :label="$t('DrillingReportsModule.common.smsNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="profile.notifications.daily"
                :label="$t('DrillingReportsModule.common.dailyDigest')"
              />
            </VCol>

            <!-- Security -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.security') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VBtn
                color="primary"
                variant="outlined"
                @click="handleChangePassword"
              >
                {{ $t('DrillingReportsModule.common.changePassword') }}
              </VBtn>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VBtn
                color="warning"
                variant="outlined"
                @click="handleEnableTwoFactor"
              >
                {{ $t('DrillingReportsModule.common.enableTwoFactor') }}
              </VBtn>
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
                @click="handleCancel"
              >
                {{ $t('DrillingReportsModule.common.cancel') }}
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
.related-entities-profile {
  inline-size: 100%;
}
</style>
