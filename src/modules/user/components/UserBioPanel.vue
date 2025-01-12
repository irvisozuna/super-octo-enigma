<template>
  <VCard>
    <VCardText class="text-center pt-12">
      <!-- Avatar -->
      <VAvatar rounded :size="100" :color="!itemData.profile.avatar_url ? 'primary' : undefined"
        :variant="!itemData.profile.avatar_url ? 'tonal' : undefined">
        <VImg v-if="itemData.profile.avatar_url" :src="itemData.profile.avatar_url" />
        <span v-else class="text-5xl font-weight-medium">

          {{ avatarText(itemData.profile.first_name, itemData.profile.last_name) }}
        </span>
      </VAvatar>

      <!-- Name -->
      <h5 class="text-h5 mt-4">{{ itemData.profile.first_name }} {{ itemData.profile.last_name }}</h5>

      <!-- role -->
      <h6 class="text-subtitle-2 mt-1">({{ itemData.roles.map(role => role.name).join(', ') }})</h6>

      <!-- Bio -->
      <p class="mt-4">{{ itemData.profile.bio }}</p>

      <!-- Role -->
      <VChip v-if="itemData.preferences && itemData.preferences.theme_preference" label
        :color="resolveUserRoleVariant(itemData.preferences.theme_preference).color" size="small" class="mt-4">
        {{ t('theme_preference', { theme: itemData.preferences.theme_preference }) }}
      </VChip>
      <!-- 👉 Details -->
      <h5 class="text-h5">
        Details
      </h5>

      <VDivider class="my-4" />

      <!-- 👉 User Details list -->
      <VList class="card-list mt-2">

        <VListItem>
          <VListItemTitle>
            <span class="text-h6">
              Email:
            </span>
            <span class="text-body-1">
              {{ itemData.email }}
            </span>
          </VListItemTitle>
        </VListItem>

        <!-- <VListItem>
          <VListItemTitle>
            <h6 class="text-h6">
              Status:
              <div class="d-inline-block text-body-1 text-capitalize">
                {{ props.userData.status }}
              </div>
            </h6>
          </VListItemTitle>
        </VListItem> -->



        <VListItem>
          <VListItemTitle>
            <h6 class="text-h6">
              {{ $t('tax_id') }}:
              <div class="d-inline-block text-body-1">
                {{ itemData.profile.taxId || 'N/A' }}
              </div>
            </h6>
          </VListItemTitle>
        </VListItem>

        <VListItem>
          <VListItemTitle>
            <h6 class="text-h6">
              Contact:
              <div class="d-inline-block text-body-1">
                <!-- {{ props.userData.contact }} -->
              </div>
            </h6>
          </VListItemTitle>
        </VListItem>

        <VListItem>
          <VListItemTitle>
            <h6 class="text-h6">
              Language:
              <div class="d-inline-block text-body-1">
                <!-- {{ props.userData.language }} -->
              </div>
            </h6>
          </VListItemTitle>
        </VListItem>

        <VListItem>
          <VListItemTitle>
            <h6 class="text-h6">
              Country:
              <div class="d-inline-block text-body-1">
                <!-- {{ props.userData.country }} -->
              </div>
            </h6>
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { Role } from '@/types/types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  itemData: {
    profile: {
      id: string;
      first_name: string;
      last_name: string;
      nickname: string;
      bio: string;
      avatar_url?: string;
      secondary_email: string;
      phone: string;
      address_line: string;
      city: string;
      state: string;
      country: string;
      preferences: {
        theme_preference: string;
      };
      social_links: {
        website_url?: string;
        facebook_url?: string;
        linkedin_url?: string;
        github_username?: string;
      };
    },
    roles: Role[];
  };
}

const props = defineProps<Props>();

const resolveUserRoleVariant = (theme: string) => {
  const themes: Record<string, { color: string }> = {
    dark: { color: 'secondary' },
    light: { color: 'primary' },
  };

  return themes[theme] || { color: 'default' };
};

const avatarText = (firstName: string, lastName: string) => {
  const firstInitial = firstName.charAt(0).toUpperCase();
  const secondInitial = lastName ? lastName.charAt(0).toUpperCase() : firstName.charAt(1).toUpperCase();
  return `${firstInitial}${secondInitial}`;
};
</script>
