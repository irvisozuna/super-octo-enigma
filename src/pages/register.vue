<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </RouterLink>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 100px;"
        >
          <VImg
            max-width="500"
            :src="imageVariant"
            class="auth-illustration mt-16 mb-2"
          />
        </div>

        <img
          class="auth-footer-mask"
          :src="authThemeMask"
          alt="auth-footer-mask"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface));"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            {{ $t('register.title') }} 🚀
          </h4>
          <p class="mb-0">
            {{ $t('register.subtitle') }}
          </p>
        </VCardText>

        <VCardText>
          <VForm ref="refVForm" @submit.prevent="onSubmit">
            <VRow>
              <!-- First Name -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.firstName"
                  :rules="[requiredValidator]"
                  :label="$t('First Name')"
                  placeholder="John"
                  :error-messages="errors.firstName"
                />
              </VCol>

              <!-- Last Name -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.lastName"
                  :rules="[requiredValidator]"
                  :label="$t('Last Name')"
                  placeholder="Doe"
                  :error-messages="errors.lastName"
                />
              </VCol>

              <!-- Email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  :rules="[requiredValidator, emailValidator]"
                  :label="$t('email')"
                  type="email"
                  placeholder="johndoe@email.com"
                  :error-messages="errors.email"
                />
              </VCol>

              <!-- Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  :rules="[requiredValidator]"
                  :label="$t('password')"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  :error-messages="errors.password"
                />

                <div class="d-flex align-center my-6">
                  <VCheckbox
                    id="privacy-policy"
                    v-model="form.privacyPolicies"
                    inline
                  />
                  <VLabel
                    for="privacy-policy"
                    style="opacity: 1;"
                  >
                    <span class="me-1 text-high-emphasis">{{ $t('register.I agree to') }}</span>
                    <a
                      href="javascript:void(0)"
                      class="text-primary"
                    >{{ $t('register.terms & conditions') }}</a>
                  </VLabel>
                </div>

                <VBtn
                  block
                  type="submit"
                >
                  {{ $t('register.sign up') }}
                </VBtn>
              </VCol>

              <!-- Already have an account -->
              <VCol
                cols="12"
                class="text-center text-base"
              >
                <span class="d-inline-block">{{ $t('register.Already have an account?') }}</span>
                <RouterLink
                  class="text-primary ms-1 d-inline-block"
                  :to="{ name: 'login' }"
                >
                  {{ $t('register.Sign in instead') }}
                </RouterLink>
              </VCol>

              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <span class="mx-4">{{ $t('or') }}</span>
                <VDivider />
              </VCol>

              <!-- Auth providers -->
              <VCol
                cols="12"
                class="text-center"
              >
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
<script setup lang="ts">
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'

import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VForm } from 'vuetify/components/VForm'

import authV2RegisterIllustrationBorderedDark from '@images/pages/auth-v2-register-illustration-bordered-dark.png'
import authV2RegisterIllustrationBorderedLight from '@images/pages/auth-v2-register-illustration-bordered-light.png'
import authV2RegisterIllustrationDark from '@images/pages/auth-v2-register-illustration-dark.png'
import authV2RegisterIllustrationLight from '@images/pages/auth-v2-register-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

const imageVariant = useGenerateImageVariant(
  authV2RegisterIllustrationLight,
  authV2RegisterIllustrationDark,
  authV2RegisterIllustrationBorderedLight,
  authV2RegisterIllustrationBorderedDark,
  true
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const form = ref({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  privacyPolicies: false,
})

const isPasswordVisible = ref(false)

const errors = ref<Record<string, string | undefined>>({
  firstName: undefined,
  lastName: undefined,
  email: undefined,
  password: undefined,
})

const refVForm = ref<VForm>()

const route = useRoute()
const router = useRouter()

const ability = useAbility()

const login = async (email: string, password: string) => {
  try {
    const res = await $api('/auth/login', {
      method: 'POST',
      body: {
        email,
        password,
      },
      onResponseError({ response }) {
        errors.value = response._data.errors
      },
    })

    const { accessToken, userData, userAbilityRules } = res

    useCookie('userAbilityRules').value = userAbilityRules
    ability.update(userAbilityRules)

    useCookie('userData').value = userData
    useCookie('accessToken').value = accessToken

    // Redirect to `to` query if exist or redirect to index route
    // ❗ nextTick is required to wait for DOM updates and later redirect
    await nextTick(() => {
      router.replace(route.query.to ? String(route.query.to) : '/')
    })
  } catch (err) {
    console.error(err)
  }
}

const register = async () => {
  try {
    const res = await $api('/auth/register', {
      method: 'POST',
      body: {
        first_name: form.value.firstName,
        last_name: form.value.lastName,
        email: form.value.email,
        password: form.value.password,
      },
      onResponseError({ response }) {
        errors.value = response._data.errors
      },
    })

    // Perform login after successful registration
    //await login(form.value.email, form.value.password)
    router.replace('/')
  } catch (err) {
    console.error(err)
  }
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) register()
  })
}
</script>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>
