<template>
  <api-data-source api-path="template/get_data_widget" @loaded="(response) => widgets = response">
    <template v-slot="{ loading }">
      <WidgetCard :widgetData="widgets" v-if="widgets.length > 0" />
    </template>
  </api-data-source>
  <TemplateList :title="$t('template.templates_list')" :description="$t('template.templates_list_description')" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TemplateList from './TemplateList.vue';

const widgets = ref([]);
</script>
