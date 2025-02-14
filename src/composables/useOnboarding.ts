import { ApiService } from '@/services/apiService';
import { useOnboardingStore } from '@/stores/onboarding';
import { OnboardingResponse } from '@/types/responses/onboarding';
import { CompanyInfoType, User, UserInfoType } from '@/types/types';
import { ref } from 'vue';

export function useOnboarding() {
  const onboardingStore = useOnboardingStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);


  const handleCompleteUserInfo = (updatedInfo: UserInfoType) => {
    onboardingStore.updateUserInfo(updatedInfo);
  };

  const handleCompleteCompanyInfo = (updatedInfo: CompanyInfoType) => {
    onboardingStore.updateCompanyInfo(updatedInfo);
  };

  const nextStep = () => {
    onboardingStore.nextStep();
  };

  const previousStep = () => {
    onboardingStore.previousStep();
  };

  const isStepDisabled = (index: number) => {
    if (index === 0) {
      return !onboardingStore.isUserInfoComplete;
    } else if (index === 1) {
      return !onboardingStore.isCompanyInfoComplete;
    }
    return false;
  };

  const submitCompanyInfo = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      onboardingStore.propertyListingData.wizardStep = 6;
      const response = await ApiService.put('/company/onboarding', onboardingStore.propertyListingData);
      const responseData = response as OnboardingResponse;
      // Aquí puedes manejar la lógica después de enviar los datos, como redirigir a otra página o mostrar un mensaje de éxito.
      const  user = useCookie('userData').value;
      const userData = user as unknown as User;
      if (userData) {
        userData.wizardStep = responseData.metadata.wizardStep;
        useCookie('userData').value = JSON.stringify(userData);
      } else {
        console.error('Error updating user data');
      }

      // Redirigir a la página de inicio
      window.location.href = '/';

    } catch (err) {
      console.error('Error updating company info:', err);
      error.value = 'Error updating company info';
    } finally {
      isLoading.value = false;
    }
  };
  // Computed property para que sea reactivo al valor del store
  const currentStep = computed(() => onboardingStore.currentStep);

  return {
    onboardingStore,
    handleCompleteUserInfo,
    handleCompleteCompanyInfo,
    nextStep,
    previousStep,
    isStepDisabled,
    submitCompanyInfo,
    isLoading,
    error,
    currentStep,
  };
}
