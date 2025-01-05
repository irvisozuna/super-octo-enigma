<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const isCurrentPasswordVisible = ref(false);
const isNewPasswordVisible = ref(false);
const isConfirmPasswordVisible = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const passwordRequirements = [
  t('passwordRequirements.minLength'),
  t('passwordRequirements.lowercase'),
  t('passwordRequirements.specialChar'),
];

const serverKeys = [
  {
    name: t('serverKeys.name1'),
    key: '23eaf7f0-f4f7-495e-8b86-fad3261282ac',
    createdOn: '28 Apr 2021, 18:20 GTM+4:10',
    permission: t('serverKeys.permission.fullAccess'),
  },
];

const recentDevicesHeaders = [
  { title: t('recentDevices.headers.browser'), key: 'browser' },
  { title: t('recentDevices.headers.device'), key: 'device' },
  { title: t('recentDevices.headers.location'), key: 'location' },
  { title: t('recentDevices.headers.recentActivity'), key: 'recentActivity' },
];

const recentDevices = [
  {
    browser: 'Chrome on Windows',
    device: 'HP Spectre 360',
    location: 'New York, NY',
    recentActivity: '28 Apr 2022, 18:20',
    deviceIcon: { icon: 'tabler-brand-windows', color: 'primary' },
  },
];

const isOneTimePasswordDialogVisible = ref(false);
</script>

<template>
  <VRow>
    <!-- Change Password Section -->
    <VCol cols="12">
      <VCard :title="t('changePassword.title')">
        <VForm>
          <VCardText class="pt-0">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField v-model="currentPassword" :type="isCurrentPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isCurrentPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :label="t('changePassword.currentPassword')" autocomplete="on" placeholder="············"
                  @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible" />
              </VCol>
            </VRow>

            <VRow>
              <VCol cols="12" md="6">
                <AppTextField v-model="newPassword" :type="isNewPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isNewPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :label="t('changePassword.newPassword')" autocomplete="on" placeholder="············"
                  @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible" />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField v-model="confirmPassword" :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :label="t('changePassword.confirmPassword')" autocomplete="on" placeholder="············"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible" />
              </VCol>
            </VRow>
          </VCardText>

          <VCardText>
            <h6 class="text-h6 text-medium-emphasis mb-4">{{ t('passwordRequirements.title') }}</h6>

            <VList class="card-list">
              <VListItem v-for="item in passwordRequirements" :key="item" :title="item" class="text-medium-emphasis">
                <template #prepend>
                  <VIcon size="10" icon="tabler-circle-filled" />
                </template>
              </VListItem>
            </VList>
          </VCardText>

          <VCardText class="d-flex flex-wrap gap-4">
            <VBtn>{{ t('actions.saveChanges') }}</VBtn>
            <VBtn type="reset" color="secondary" variant="tonal">{{ t('actions.reset') }}</VBtn>
          </VCardText>
        </VForm>
      </VCard>
    </VCol>

    <!-- Two-Step Verification Section -->
    <!-- <VCol cols="12">
      <VCard :title="t('twoStep.title')">
        <VCardText>
          <h5 class="text-h5 text-medium-emphasis mb-4">{{ t('twoStep.notEnabled') }}</h5>
          <p class="mb-6">
            {{ t('twoStep.description') }}
            <a href="javascript:void(0)" class="text-decoration-none">{{ t('twoStep.learnMore') }}</a>
          </p>
          <VBtn @click="isOneTimePasswordDialogVisible = true">{{ t('twoStep.enable') }}</VBtn>
        </VCardText>
      </VCard>
    </VCol> -->

    <!-- API Key Creation Section -->
    <!-- <VCol cols="12">
      <VCard :title="t('apiKey.title')">
        <VRow no-gutters>
          <VCol cols="12" md="5" order-md="0" order="1">
            <VCardText class="pt-1">
              <VForm @submit.prevent="() => { }">
                <VRow>
                  <VCol cols="12">
                    <AppSelect :label="t('apiKey.selectType')" :placeholder="t('apiKey.selectTypePlaceholder')"
                      :items="['Full Control', 'Modify', 'Read & Execute', 'List Folder Contents', 'Read Only', 'Read & Write']" />
                  </VCol>

                  <VCol cols="12">
                    <AppTextField :label="t('apiKey.name')" :placeholder="t('apiKey.namePlaceholder')" />
                  </VCol>

                  <VCol cols="12">
                    <VBtn type="submit" block>{{ t('apiKey.create') }}</VBtn>
                  </VCol>
                </VRow>
              </VForm>
            </VCardText>
          </VCol>

          <VCol cols="12" md="7" order="0" order-md="1" class="d-flex flex-column justify-center align-center">
            <VImg :src="laptopGirl" :width="$vuetify.display.smAndDown ? '150' : '200'"
              :style="$vuetify.display.smAndDown ? 'margin-block-end: 24px' : 'position: absolute; bottom: 0;'" />
          </VCol>
        </VRow>
      </VCard>
    </VCol> -->

    <!-- API Keys List Section -->
    <!-- <VCol cols="12">
      <VCard>
        <VCardItem class="pb-4">
          <VCardTitle>{{ t('apiKey.listTitle') }}</VCardTitle>
        </VCardItem>
        <VCardText>{{ t('apiKey.listDescription') }}</VCardText>

        <VCardText class="d-flex flex-column gap-y-6">
          <VCard v-for="serverKey in serverKeys" :key="serverKey.key" flat class="pa-4"
            color="rgba(var(--v-theme-on-surface),var(--v-hover-opacity))">
            <div class="d-flex flex-column gap-y-2">
              <div class="d-flex align-center flex-wrap">
                <h5 class="text-h5 me-3">{{ serverKey.name }}</h5>
                <VChip label color="primary" size="small">{{ serverKey.permission }}</VChip>
              </div>
              <div class="d-flex align-center text-base font-weight-medium">
                <h6 class="text-h6 text-medium-emphasis me-3">{{ serverKey.key }}</h6>
                <div class="cursor-pointer">
                  <VIcon icon="tabler-copy" size="20" />
                </div>
              </div>
              <div class="text-disabled">{{ t('apiKey.createdOn', { date: serverKey.createdOn }) }}</div>
            </div>
          </VCard>
        </VCardText>
      </VCard>
    </VCol> -->

    <!-- Recent Devices Section -->
    <VCol cols="12">
      <VCard :title="t('recentDevices.title')">
        <VDivider />
        <VDataTable :headers="recentDevicesHeaders" :items="recentDevices" hide-default-footer class="text-no-wrap">
          <template #item.browser="{ item }">
            <div class="d-flex">
              <VIcon start size="22" :icon="item.deviceIcon.icon" :color="item.deviceIcon.color" />
              <div class="text-high-emphasis text-body-1 font-weight-medium">{{ item.browser }}</div>
            </div>
          </template>
          <template #bottom />
        </VDataTable>
      </VCard>
    </VCol>
  </VRow>
  <!-- <TwoFactorAuthDialog v-model:isDialogVisible="isOneTimePasswordDialogVisible" /> -->
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}

.server-close-btn {
  inset-inline-end: 0.5rem;
}
</style>
