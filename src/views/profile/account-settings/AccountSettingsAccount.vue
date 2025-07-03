<script lang="ts" setup>
import avatar1 from '@images/avatars/avatar-1.png';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';


import countries from '@/data/countries';
import currencies from '@/data/currencies';
import languages from '@/data/languages';
import timezones from '@/data/timezones';
import { useProfileValidation } from '@/validations/profileValidation';
import { useField, useForm } from 'vee-validate';

const userData = useCookie<any>('userData');
const profile = useCookie<any>('profile');
const company = useCookie<any>('company');


const { t } = useI18n();
const validationSchema = useProfileValidation();

const accountData = {
  avatarImg: avatar1,
  first_name: profile.value?.first_name,
  last_name: profile.value?.last_name,
  email: userData.value?.email,
  org: company.value?.name,
  phone: profile.value?.phone ?? '',
  address_line: profile.value?.address_line ?? '',
  state: profile.value?.state ?? '',
  postal_code: profile.value?.postal_code ?? '',
  country: profile.value?.country ?? 'México',
  language: profile.value?.language ?? 'Spanish',
  timezone: profile.value?.timezone ?? company.value?.timezone ?? '(GMT-04:00) Eastern Time (US & Canada)',
  currency: profile.value?.currency ?? company.value?.currency ?? 'MXN',
};

const { handleSubmit, resetForm, errors } = useForm({
  validationSchema: validationSchema,
  initialValues: accountData,
});




const { value: first_name } = useField('first_name');
const { value: last_name } = useField('last_name');
const { value: email } = useField('email');
const { value: phone } = useField('phone');
const { value: address_line } = useField('address_line');
const { value: state } = useField('state');
const { value: postal_code } = useField('postal_code');
const { value: country } = useField('country');
const { value: language } = useField('language');
const { value: timezone } = useField('timezone');
const { value: currency } = useField('currency');


const refInputEl = ref<HTMLElement>();

const isConfirmDialogOpen = ref(false);
const accountDataLocal = ref(structuredClone(accountData));




// changeAvatar function
const changeAvatar = (file: Event) => {
  const fileReader = new FileReader();
  const { files } = file.target as HTMLInputElement;

  if (files && files.length) {
    fileReader.readAsDataURL(files[0]);
    fileReader.onload = () => {
      if (typeof fileReader.result === 'string')
        accountDataLocal.value.avatarImg = fileReader.result;
    };
  }
};

// reset avatar image
const resetAvatar = () => {
  accountDataLocal.value.avatarImg = accountData.avatarImg;
};

// Enviar el formulario
async function onFormSubmit(values: any) {
  //quitar del values el correo electrinico
  delete values.email;
  try {
    const uuid = profile.value.id;
    debugger
    const response = await $api(`/profiles/update/${uuid}`, {
      method: 'PUT',
      body: values,
    });
    //actualizar el perfil en cookies
    useCookie('profile').value = response;
  } catch (error) {
    console.error('Error al editar el usuario:', error);
  }
}

</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardText class="d-flex">
          <VAvatar rounded size="100" class="me-6" :image="accountDataLocal.avatarImg" />


          <form class="d-flex flex-column justify-center gap-4">
            <div class="d-flex flex-wrap gap-4">
              <VBtn color="primary" size="small" @click="refInputEl?.click()">
                <VIcon icon="tabler-cloud-upload" class="d-sm-none" />
                <span class="d-none d-sm-block">{{ t('uploadNewPhoto') }}</span>
              </VBtn>

              <input ref="refInputEl" type="file" name="file" accept=".jpeg,.png,.jpg,GIF" hidden @input="changeAvatar">

              <VBtn type="reset" size="small" color="secondary" variant="tonal" @click="resetAvatar">
                <span class="d-none d-sm-block">{{ t('reset') }}</span>
                <VIcon icon="tabler-refresh" class="d-sm-none" />
              </VBtn>
            </div>

            <p class="text-body-1 mb-0">{{ t('allowedFormats') }}</p>
          </form>
        </VCardText>

        <VCardText class="pt-2">
          <VForm class="mt-6" :onSubmit="handleSubmit(onFormSubmit)">
            <VRow>
              <VCol md="6" cols="12">
                <AppTextField v-model="first_name" placeholder="Juan" :label="t('fields.first_name')"
                  :error="!!errors.first_name" :error-messages="errors.first_name ? [errors.first_name] : []" />
              </VCol>

              <VCol md="6" cols="12">
                <AppTextField v-model="last_name" placeholder="Perez" :label="t('fields.last_name')"
                  :error="!!errors.last_name" :error-messages="errors.last_name ? [errors.last_name] : []" />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField v-model="email" :label="t('email')" :placeholder="t('placeholderEmail')" disabled
                  :error="!!errors.email" :error-messages="errors.email ? [errors.email] : []" />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField v-model="phone" :label="t('phone')" :error="!!errors.phone"
                  :error-messages="errors.phone ? [errors.phone] : []" />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField v-model="address_line" :label="t('address')" placeholder="123 Main St, New York, NY 10001"
                  :error="!!errors.address_line" :error-messages="errors.address_line ? [errors.address_line] : []" />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField v-model="state" :label="t('state')" placeholder="New York" :error="!!errors.state"
                  :error-messages="errors.state ? [errors.state] : []" />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField v-model="postal_code" :label="t('zip')" placeholder="10001" :error="!!errors.postal_code"
                  :error-messages="errors.postal_code ? [errors.postal_code] : []" />
              </VCol>

              <VCol cols="12" md="6">
                <AppSelect v-model="country" :label="t('country')" :items="countries" :error="!!errors.country"
                  :error-messages="errors.country ? [errors.country] : []" />
              </VCol>

              <VCol cols="12" md="6">
                <AppSelect v-model="language" :label="t('language')" :items="languages" :error="!!errors.language"
                  :error-messages="errors.language ? [errors.language] : []" />
              </VCol>

              <VCol cols="12" md="6">
                <AppSelect v-model="timezone" :label="t('timezone')" :items="timezones" :error="!!errors.timezone"
                  :error-messages="errors.timezone ? [errors.timezone] : []" :menu-props="{ maxHeight: 200 }" />
              </VCol>

              <VCol cols="12" md="6">
                <AppSelect v-model="currency" :label="t('currency')" :items="currencies" :error="!!errors.currencies"
                  :error-messages="errors.currencies ? [errors.currencies] : []" :menu-props="{ maxHeight: 200 }" />
              </VCol>

              <VCol cols="12" class="d-flex flex-wrap gap-4">
                <VBtn type="submit">{{ t('saveChanges') }}</VBtn>

                <VBtn color="secondary" variant="tonal" type="reset" @click.prevent="resetForm">
                  {{ t('reset') }}
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <ConfirmDialog v-model:isDialogVisible="isConfirmDialogOpen" :confirmation-question="t('confirmDeactivationQuestion')"
    :confirm-title="t('deactivated')" :confirm-msg="t('deactivatedMessage')" :cancel-title="t('cancelled')"
    :cancel-msg="t('cancelledMessage')" />
</template>
