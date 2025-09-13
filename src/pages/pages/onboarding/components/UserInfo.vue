<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UserInfoType } from '../../../../types/types'

const props = defineProps<{
  formData: UserInfoType
}>()

const emit = defineEmits<{
  (e: 'update:formData', value: UserInfoType): void
  (e: 'complete', value: UserInfoType): void
}>()

const { t } = useI18n()

const formData = ref<UserInfoType>({ ...props.formData })

watch(formData, () => {
  emit('update:formData', formData.value)
})

const isPhoneValid = ref(true)

const rules = [
  (value, phone, { label, country, example }) => phone.valid ? isPhoneValid.value = true : isPhoneValid.value = false,
]

console.log(rules[0])

// Function to generate initials image
const generateInitialsImage = (initials: string) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  const size = 120

  canvas.width = size
  canvas.height = size

  // Background
  context.fillStyle = '#ccc'
  context.fillRect(0, 0, size, size)

  // Text
  context.fillStyle = '#fff'
  context.font = `${size / 2}px Arial`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(initials, size / 2, size / 2)

  return canvas.toDataURL()
}

// Computed property for initials
const initials = computed(() => {
  const firstNameInitial = formData.value.firstName ? formData.value.firstName.charAt(0).toUpperCase() : ''
  const lastNameInitial = formData.value.lastName ? formData.value.lastName.charAt(0).toUpperCase() : ''

  return firstNameInitial + lastNameInitial
})

// Computed property for initials image
const initialsImage = computed(() => generateInitialsImage(initials.value))

const isComplete = computed(() => {
  return !!formData.value.firstName
         && !!formData.value.lastName
         && !!formData.value.contact && isPhoneValid.value // Assuming contact is not nullish when valid
})

// Watch for completion status
watch(isComplete, complete => {
  if (complete) {
    nextTick(() => {
      emit('complete', formData.value)
    })
  }
})

// Function to update contact number
const updateContact = (contact: string) => {
  formData.value.contact = contact
}

// Function to validate phone
const validatePhone = () => {
  // Phone validation logic can be added here if needed
  // For now, we rely on the VPhoneInput component's built-in validation
}

const imageError = ref('') // Mensaje de error para la imagen
const maxImageSizeKB = 5000 // Tamaño máximo en KB
const allowedTypes = ['image/png', 'image/jpeg'] // Tipos permitidos
const maxWidth = 800 // Ancho máximo en píxeles
const maxHeight = 600 // Alto máximo en píxeles

const onFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    imageError.value = '' // Limpiar mensaje de error anterior

    // Validar tipo de archivo
    if (!allowedTypes.includes(file.type)) {
      imageError.value = 'Solo se permiten imágenes PNG o JPEG.'

      return
    }

    // Validar tamaño en KB
    if (file.size > maxImageSizeKB * 1024) {
      imageError.value = `El tamaño de la imagen no debe exceder ${maxImageSizeKB} KB.`

      return
    }

    // Validar dimensiones de la imagen
    const img = new Image()

    img.onload = () => {
      if (img.width > maxWidth || img.height > maxHeight) {
        imageError.value = `Las dimensiones de la imagen deben ser máximo ${maxWidth}x${maxHeight} píxeles.`

        return
      }

      // Si todas las validaciones pasan, cargar la imagen
      const reader = new FileReader()

      reader.onload = () => {
        formData.value.profileImage = reader.result as string
      }
      reader.readAsDataURL(file)
    }
    img.src = URL.createObjectURL(file)
  }
}
</script>

<template>
  <div class="user-info-container">
    <h2 class="title">
      {{ $t('onboarding.userInfoTitle') }}
    </h2>
    <p class="subtitle">
      {{ $t('onboarding.userInfoSubtitle') }}
    </p>
    <div class="profile-image-wrapper">
      <label
        for="profile-image-upload"
        class="profile-image-label"
      >
        <img
          v-if="formData.profileImage"
          :src="formData.profileImage"
          alt="Profile Image"
          class="profile-preview"
        >
        <div
          v-else
          class="initials-placeholder"
        >
          {{ initials }}
          <VIcon
            icon="tabler-camera-plus"
            size="24"
            class="add-photo-icon"
          />
        </div>
      </label>
      <input
        id="profile-image-upload"
        type="file"
        class="profile-image-input"
        @change="onFileChange"
      >
    </div>
    <div
      v-if="imageError"
      class="error-message"
    >
      {{ imageError }}
    </div>
    <VForm>
      <VRow>
        <VCol cols="12">
          <!-- 👉 First Name -->
          <AppTextField
            v-model="formData.firstName"
            :label="$t('First Name')"
            placeholder="Tu nombre"
          />
        </VCol>

        <VCol cols="12">
          <!-- 👉 Last Name -->
          <AppTextField
            v-model="formData.lastName"
            :label="$t('Last Name')"
            placeholder="Tus apellidos"
          />
        </VCol>

        <VCol cols="12">
          <!-- 👉 WhatsApp -->
          <!--
            <vue-tel-input
            v-model="formData.contact"
            defaultCountry="mx"
            :preferredCountries="['mx', 'us']"
            @on-input="updateContact"
            placeholder="Número de 10 dígitos"
            />
          -->
          <VPhoneInput
            v-model="formData.contact"
            :label="$t('phone')"
            country-icon-mode="svg"
            :guess-country="true"
            :country-label="$t('Country')"
            :rules="rules"
            :error:isPhoneValid="!isPhoneValid"
            @blur="validatePhone"
          />
          <div
            v-if="!isPhoneValid"
            class="error-message"
          >
            Número de teléfono inválido
          </div>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<style scoped>
.user-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.title {
  font-size: 24px;
  margin-block-end: 8px;
}

.subtitle {
  color: #666;
  font-size: 16px;
  margin-block-end: 24px;
}

.profile-image-wrapper {
  position: relative;
  overflow: hidden;
  block-size: 120px;
  inline-size: 120px;
  margin-block-end: 24px;
}

.initials-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #9e9e9e; /* Placeholder background color */
  block-size: 100%;
  color: #fff; /* Or a suitable color */
  font-size: 32px; /* Adjust as needed */
  inline-size: 100%;
}

.add-photo-icon {
  margin-block-start: 8px; /* Adjust spacing as needed */
}

.profile-image-label {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ccc;
  border-radius: 50%;
  block-size: 100%;
  cursor: pointer;
  inline-size: 100%;
}

.profile-preview {
  block-size: 100%;
  inline-size: 100%;
  object-fit: cover;
}

.profile-image-input {
  display: none;
}

.error-message {
  color: red; /* Color del mensaje de error */
  font-size: 12px; /* Tamaño de fuente del mensaje de error */
  margin-block-start: 5px; /* Espacio superior del mensaje de error */
}
</style>
