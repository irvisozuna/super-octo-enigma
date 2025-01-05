<template>
  <VCard>
    <VCardText class="text-center pt-12">
      <!-- Avatar -->
      <VAvatar rounded :size="100" :color="!itemData.avatar_url ? 'primary' : undefined"
        :variant="!itemData.avatar_url ? 'tonal' : undefined">
        <VImg v-if="itemData.avatar_url" :src="itemData.avatar_url" />
        <span v-else class="text-5xl font-weight-medium">
          {{ avatarText(itemData.first_name, itemData.last_name) }}
        </span>
      </VAvatar>

      <!-- Name -->
      <h5 class="text-h5 mt-4">{{ itemData.first_name }} {{ itemData.last_name }}</h5>

      <!-- Nickname -->
      <h6 class="text-subtitle-2 mt-1">({{ itemData.nickname }})</h6>

      <!-- Bio -->
      <p class="mt-4">{{ itemData.bio }}</p>

      <!-- Role -->
      <VChip v-if="itemData.preferences && itemData.preferences.theme_preference" label
        :color="resolveUserRoleVariant(itemData.preferences.theme_preference).color" size="small" class="mt-4">
        {{ t('theme_preference', { theme: itemData.preferences.theme_preference }) }}
      </VChip>
    </VCardText>

    <VCardText>
      <!-- Additional Information -->
      <VList>
        <VListItem>
          <VListItemTitle>
            <strong>{{ t('email') }}:</strong> {{ itemData.secondary_email }}
          </VListItemTitle>
        </VListItem>
        <VListItem>
          <VListItemTitle>
            <strong>{{ t('phone') }}:</strong> {{ itemData.phone }}
          </VListItemTitle>
        </VListItem>
        <VListItem>
          <VListItemTitle>
            <strong>{{ t('address') }}:</strong> {{ itemData.address_line }}, {{ itemData.city }}, {{ itemData.state }},
            {{ itemData.country }}
          </VListItemTitle>
        </VListItem>
        <VListItem v-if="itemData.social_links">
          <VListItemTitle>
            <strong>{{ t('social_links') }}:</strong>
            <ul>
              <li v-if="itemData.social_links.website_url">
                <a :href="itemData.social_links.website_url" target="_blank">Website</a>
              </li>
              <li v-if="itemData.social_links.facebook_url">
                <a :href="itemData.social_links.facebook_url" target="_blank">Facebook</a>
              </li>
              <li v-if="itemData.social_links.linkedin_url">
                <a :href="itemData.social_links.linkedin_url" target="_blank">LinkedIn</a>
              </li>
              <li v-if="itemData.social_links.github_username">
                <a :href="`https://github.com/${itemData.social_links.github_username}`" target="_blank">GitHub</a>
              </li>
            </ul>
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
  return `Hola`.toUpperCase();
};
</script>
