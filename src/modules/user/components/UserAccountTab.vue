<template>
  <VCard>
    <VCardText>
      <h5>{{ t('user.details') }}</h5>
      <VList>
        <VListItem>
          <VListItemTitle>
            <strong>{{ t('email') }}:</strong> {{ itemData.email }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  itemData: {
    email: string;
  };
}

const props = defineProps<Props>();
</script>
