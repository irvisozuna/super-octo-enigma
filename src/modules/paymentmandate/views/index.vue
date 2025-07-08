<script setup lang="ts">
import { ref } from 'vue'
import PaymentmandateList from './PaymentmandateList.vue'

const widgets = ref([])
</script>

<template>
  <ApiDataSource
    api-path="paymentmandate/get_data_widget"
    @loaded="(response) => widgets = response"
  >
    <template #default="{ loading }">
      <WidgetCard
        v-if="widgets.length > 0"
        :widget-data="widgets"
      />
    </template>
  </ApiDataSource>
  <PaymentmandateList
    :title="$t('paymentmandates_list')"
    :description="$t('paymentmandates_list_description')"
  />
</template>
