// stores/onboarding.ts
import { defineStore } from 'pinia';

export const useOnboardingStore = defineStore('onboarding', {
  state: () => (
    {
    currentStep: 0,
    wizardStep: 0,
    propertyListingData: {
      userInfo: {
        firstName: '',
        lastName: '',
        contact: null,
        profileImage: null,
      },
      companyInfo: {
        companyName: '',
        activity: '',
        address: '',
        location: {
          lat: 0,
          lng: 0,
        },
      },
      wizardStep: 0,
    },
    isUserInfoComplete: false,
    isCompanyInfoComplete: false,
  }),
  actions: {
    updateUserInfo(updatedInfo: any) {
      this.propertyListingData.userInfo = updatedInfo;
      this.isUserInfoComplete = true;
      this.wizardStep = 1;
    },
    updateCompanyInfo(updatedInfo: any) {
      this.propertyListingData.companyInfo = updatedInfo;
      this.isCompanyInfoComplete = true;
      this.wizardStep = 2;
    },
    nextStep() {
      if (this.currentStep < 1) {
        this.currentStep++;
      }
    },
    previousStep() {
      if (this.currentStep > 0) {
        this.currentStep--;
      }
    },
  },
});
