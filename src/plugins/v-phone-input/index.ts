import 'flag-icons/css/flag-icons.min.css';
import { createVPhoneInput } from 'v-phone-input';
import 'v-phone-input/dist/v-phone-input.css';
import { App } from 'vue';
import { VAutocomplete } from 'vuetify/components';
import { countries } from './countries/countries';

const vPhoneInput = createVPhoneInput({
  countryIconMode: 'svg',
  enableSearchingCountry: true,
  displayFormat: 'international',
  allCountries: countries,
});

export default function (app: App) {
  app.component('VAutocomplete', VAutocomplete);
  app.use(vPhoneInput);
}
