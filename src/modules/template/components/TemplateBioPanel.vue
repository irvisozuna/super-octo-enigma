<template>
  <VCard>
    <VCardText class="text-center pt-12">
      <!-- Avatar -->
      <VAvatar
        rounded
        :size="100"
        :color="!itemData.avatar ? 'primary' : undefined"
        :variant="!itemData.avatar ? 'tonal' : undefined"
      >
        <VImg
          v-if="itemData.avatar"
          :src="itemData.avatar"
        />
        <span v-else class="text-5xl font-weight-medium">
          {{ avatarText(itemData.name) }}
        </span>
      </VAvatar>

      <!-- Name -->
      <h5 class="text-h5 mt-4">{{ itemData.name }}</h5>

      <!-- Role -->
      <VChip
        label
        :color="resolveUserRoleVariant(itemData.role).color"
        size="small"
        class="text-capitalize mt-4"
      >
        {{ t('role', { role: itemData.role }) }}
      </VChip>
    </VCardText>

    <VCardText>
      <!-- Información adicional -->
      <VList>
        <VListItem>
          <VListItemTitle>
            <strong>{{ t('email') }}:</strong> {{ itemData.email }}
          </VListItemTitle>
        </VListItem>
        <VListItem>
          <VListItemTitle>
            <strong>{{ t('status') }}:</strong> {{ t(itemData.status) }}
          </VListItemTitle>
        </VListItem>
        <VListItem>
          <VListItemTitle>
            <strong>{{ t('country') }}:</strong> {{ itemData.country }}
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
    id: number;
    name: string;
    avatar?: string;
    email: string;
    role: string;
    status: string;
    country: string;
  };
}

const props = defineProps<Props>();

const resolveUserRoleVariant = (role: string) => {
  const roles: Record<string, { color: string }> = {
    admin: { color: 'secondary' },
    user: { color: 'primary' },
    guest: { color: 'info' },
  };

  return roles[role] || { color: 'default' };
};

const avatarText = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase();
</script>
