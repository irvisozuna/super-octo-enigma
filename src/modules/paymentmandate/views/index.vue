<template>
  <api-data-source api-path="paymentmandate/get_data_widget" @loaded="(response) => widgets = response">
    <template v-slot="{ loading }">
      <WidgetCard :widgetData="widgets" v-if="widgets.length > 0" />
    </template>
  </api-data-source>
  <PaymentmandateList :title="$t('paymentmandates_list')" :description="$t('paymentmandates_list_description')" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PaymentmandateList from './PaymentmandateList.vue';

const widgets = ref([]);
</script>
