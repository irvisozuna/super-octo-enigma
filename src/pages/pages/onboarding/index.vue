<template>
  <div class="wizard-container">
    <VCard class="wizard-card">
      <VRow no-gutters>
        <VCol
          cols="12"
          md="3"
          :class="$vuetify.display.smAndDown ? 'border-b' : 'border-e'"
        >
          <VCardText>
            <AppStepper
              v-model:current-step="onboardingStore.currentStep"
              :items="propertyListingSteps"
              direction="vertical"
              icon-size="22"
              class="stepper-icon-step-bg"
              :isStepDisabled="isStepDisabled" 
            />
          </VCardText>
        </VCol>

        <VCol
          cols="12"
          md="9"
        >
          <VCardText>
            <VWindow
              v-model="onboardingStore.currentStep"
              class="disable-tab-transition"
            >
              <VWindowItem>
                <UserInfo v-model:form-data="onboardingStore.propertyListingData.userInfo"  @complete="handleCompleteUserInfo" />
              </VWindowItem>
              <VWindowItem>
                <CompanyInfo v-model:form-data="onboardingStore.propertyListingData.companyInfo" @complete="handleCompleteCompanyInfo"/>
              </VWindowItem>
            </VWindow>

            <div class="d-flex flex-wrap gap-4 justify-space-between mt-6">
              <VBtn
                color="secondary"
                variant="tonal"
                :disabled="onboardingStore.currentStep === 0"
                @click="previousStep"
              >
                <VIcon
                  icon="tabler-arrow-left"
                  start
                  class="flip-in-rtl"
                />
                {{ $t('previous') }}
              </VBtn>

              <VBtn
                v-if="propertyListingSteps.length - 1 === onboardingStore.currentStep"
                color="success"
                :disabled="!onboardingStore.isUserInfoComplete || !onboardingStore.isCompanyInfoComplete"
                @click="submitCompanyInfo"
              >
                {{ $t('finish') }}
              </VBtn>

              <VBtn
                v-else
                @click="nextStep"
                :disabled="!onboardingStore.isUserInfoComplete"
              >
                {{ $t('next') }}
                <VIcon
                  icon="tabler-arrow-right"
                  end
                  class="flip-in-rtl"
                />
              </VBtn>
            </div>

            <!-- <VDialog v-model="dialog" max-width="400">
              <VCard>
                <VCardTitle>
                  <span v-if="isLoading">{{ $t('Loading...') }}</span>
                  <span v-else>{{ $t('Error') }}</span>
                </VCardTitle>
                <VCardText>
                  <div v-if="isLoading">
                    <VSkeletonLoader type="list-item-two-line" />
                  </div>
                  <div v-else>
                    <p>{{ error }}</p>
                  </div>
                </VCardText>
                <VCardActions v-if="!isLoading">
                  <VBtn color="primary" text @click="dialog = false">{{ $t('OK') }}</VBtn>
                </VCardActions>
              </VCard>
            </VDialog> -->

          </VCardText>
        </VCol>
      </VRow>
    </VCard>
  </div>
</template>

<script setup lang="ts">
import { useOnboarding } from '@/composables/useOnboarding';
import { User } from '@/types/types';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CompanyInfo from './components/CompanyInfo.vue';
import UserInfo from './components/UserInfo.vue';
const userData: User = useCookie('userData').value as unknown as User;

const { t } = useI18n();
const { onboardingStore, handleCompleteUserInfo, handleCompleteCompanyInfo, currentStep , nextStep, previousStep, isStepDisabled, submitCompanyInfo, isLoading, error } = useOnboarding();

onboardingStore.propertyListingData.userInfo.firstName = userData.firstName;
onboardingStore.propertyListingData.userInfo.lastName = userData.lastName;
const dialog = ref(false);

  watch([isLoading, error], () => {
    if (isLoading.value || error.value) {
      dialog.value = true;
    }
  });

  definePage({
    meta: {
      layout: 'blank',
    },
  });

  const propertyListingSteps = [
    {
      title: t('userInfo'),
      icon: 'tabler-users',
    },
    {
      title: t('companyInfo'),
      icon: 'tabler-home',
    },
  ];
</script>

<style scoped>
  .wizard-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background-color: #f5f5f5;
    block-size: 100vh;
  }

  .wizard-card {
    inline-size: 100%;
    max-inline-size: 900px;
  }
</style>
