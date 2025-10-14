<script setup lang="ts">
import type { ClientContactDto } from '../../../application/dtos/ClientDtos'

interface Props {
  contacts: ClientContactDto[]
  clientId: string
  editable?: boolean
  loading?: boolean
}

interface ContactFormData {
  name: string
  position?: string
  email?: string
  phone?: string
  mobile?: string
  is_primary: boolean
  notes?: string
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  loading: false,
})

const emit = defineEmits<{
  add: [contact: ContactFormData]
  update: [contactId: string, contact: ContactFormData]
  delete: [contactId: string]
  setPrimary: [contactId: string]
}>()

const { t } = useI18n()

// Dialog state
const isDialogOpen = ref(false)
const isEditing = ref(false)
const editingContactId = ref<string | null>(null)
const formData = ref<ContactFormData>({
  name: '',
  position: '',
  email: '',
  phone: '',
  mobile: '',
  is_primary: false,
  notes: '',
})

// Confirmation dialog state
const isDeleteDialogOpen = ref(false)
const contactToDelete = ref<ClientContactDto | null>(null)

/**
 * Open dialog for adding new contact
 */
function openAddDialog() {
  isEditing.value = false
  editingContactId.value = null
  formData.value = {
    name: '',
    position: '',
    email: '',
    phone: '',
    mobile: '',
    is_primary: false,
    notes: '',
  }
  isDialogOpen.value = true
}

/**
 * Open dialog for editing contact
 */
function openEditDialog(contact: ClientContactDto) {
  isEditing.value = true
  editingContactId.value = contact.id
  formData.value = {
    name: contact.name,
    position: contact.position || '',
    email: contact.email || '',
    phone: contact.phone || '',
    mobile: contact.mobile || '',
    is_primary: contact.is_primary,
    notes: contact.notes || '',
  }
  isDialogOpen.value = true
}

/**
 * Save contact (add or update)
 */
function saveContact() {
  if (isEditing.value && editingContactId.value) {
    emit('update', editingContactId.value, formData.value)
  }
  else {
    emit('add', formData.value)
  }
  isDialogOpen.value = false
}

/**
 * Open delete confirmation dialog
 */
function openDeleteDialog(contact: ClientContactDto) {
  contactToDelete.value = contact
  isDeleteDialogOpen.value = true
}

/**
 * Confirm delete contact
 */
function confirmDelete() {
  if (contactToDelete.value) {
    emit('delete', contactToDelete.value.id)
  }
  isDeleteDialogOpen.value = false
  contactToDelete.value = null
}

/**
 * Set contact as primary
 */
function setPrimary(contactId: string) {
  emit('setPrimary', contactId)
}

/**
 * Format date
 */
function formatDate(date?: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h6 class="text-h6 mb-1">
          {{ t('client.contacts.title') }}
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ t('client.contacts.description') }}
        </p>
      </div>
      <VBtn
        v-if="editable"
        color="primary"
        prepend-icon="tabler-user-plus"
        @click="openAddDialog"
      >
        {{ t('client.contacts.add') }}
      </VBtn>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center pa-8"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <!-- Contacts Grid -->
    <VRow v-else-if="contacts.length > 0">
      <VCol
        v-for="contact in contacts"
        :key="contact.id"
        cols="12"
        md="6"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center gap-2">
                <VAvatar
                  color="primary"
                  size="40"
                  variant="tonal"
                >
                  <VIcon icon="tabler-user" />
                </VAvatar>
                <div>
                  <h6 class="text-subtitle-1 font-weight-medium">
                    {{ contact.name }}
                  </h6>
                  <p
                    v-if="contact.position"
                    class="text-caption text-medium-emphasis mb-0"
                  >
                    {{ contact.position }}
                  </p>
                </div>
              </div>
              <VChip
                v-if="contact.is_primary"
                color="success"
                size="small"
                variant="tonal"
              >
                {{ t('client.contacts.primary') }}
              </VChip>
            </div>

            <!-- Contact Information -->
            <VList
              density="compact"
              class="py-0"
            >
              <VListItem
                v-if="contact.email"
                class="px-0"
              >
                <template #prepend>
                  <VIcon
                    icon="tabler-mail"
                    size="20"
                  />
                </template>
                <VListItemTitle class="text-body-2">
                  {{ contact.email }}
                </VListItemTitle>
              </VListItem>

              <VListItem
                v-if="contact.phone"
                class="px-0"
              >
                <template #prepend>
                  <VIcon
                    icon="tabler-phone"
                    size="20"
                  />
                </template>
                <VListItemTitle class="text-body-2">
                  {{ contact.phone }}
                </VListItemTitle>
              </VListItem>

              <VListItem
                v-if="contact.mobile"
                class="px-0"
              >
                <template #prepend>
                  <VIcon
                    icon="tabler-device-mobile"
                    size="20"
                  />
                </template>
                <VListItemTitle class="text-body-2">
                  {{ contact.mobile }}
                </VListItemTitle>
              </VListItem>
            </VList>

            <!-- Action Buttons -->
            <div
              v-if="editable"
              class="d-flex gap-2 mt-4"
            >
              <VBtn
                v-if="!contact.is_primary"
                size="small"
                variant="tonal"
                color="success"
                prepend-icon="tabler-star"
                @click="setPrimary(contact.id)"
              >
                {{ t('client.contacts.set_primary') }}
              </VBtn>
              <VBtn
                size="small"
                variant="tonal"
                color="primary"
                icon="tabler-edit"
                @click="openEditDialog(contact)"
              />
              <VBtn
                v-if="!contact.is_primary"
                size="small"
                variant="tonal"
                color="error"
                icon="tabler-trash"
                @click="openDeleteDialog(contact)"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Empty State -->
    <VAlert
      v-else
      color="info"
      variant="tonal"
      icon="tabler-users"
    >
      <div class="text-body-2">
        {{ t('client.contacts.no_contacts') }}
      </div>
    </VAlert>

    <!-- Add/Edit Contact Dialog -->
    <VDialog
      v-model="isDialogOpen"
      max-width="600"
    >
      <VCard>
        <VCardTitle>
          <span class="text-h6">
            {{ isEditing ? t('client.contacts.edit') : t('client.contacts.add') }}
          </span>
        </VCardTitle>

        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="formData.name"
                :label="t('client.contacts.fields.name')"
                :rules="[v => !!v || t('client.validation.name_required')]"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="formData.position"
                :label="t('client.contacts.fields.position')"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="formData.email"
                :label="t('client.contacts.fields.email')"
                type="email"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.phone"
                :label="t('client.contacts.fields.phone')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.mobile"
                :label="t('client.contacts.fields.mobile')"
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="formData.notes"
                :label="t('client.contacts.fields.notes')"
                rows="3"
              />
            </VCol>

            <VCol cols="12">
              <VCheckbox
                v-model="formData.is_primary"
                :label="t('client.contacts.fields.is_primary')"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="isDialogOpen = false"
          >
            {{ t('common.cancel') }}
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            :disabled="!formData.name"
            @click="saveContact"
          >
            {{ t('common.save') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="isDeleteDialogOpen"
      max-width="500"
    >
      <VCard>
        <VCardTitle>
          <span class="text-h6">
            {{ t('client.contacts.confirm_delete_title') }}
          </span>
        </VCardTitle>

        <VCardText>
          <p>{{ t('client.contacts.confirm_delete_message', { name: contactToDelete?.name }) }}</p>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="isDeleteDialogOpen = false"
          >
            {{ t('common.cancel') }}
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            @click="confirmDelete"
          >
            {{ t('common.delete') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
