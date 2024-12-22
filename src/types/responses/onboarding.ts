export interface OnboardingResponse {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  id: string;
  name: string;
  timezone: string;
  language: string;
  currency: string;
  decimal_places: number;
  website_url: string | null;
  appointment_url: string | null;
  metadata: {
    wizardStep: number;
    address: string;
    activity: string;
    location: {
      lat: number;
      lng: number;
    };
  };
}
