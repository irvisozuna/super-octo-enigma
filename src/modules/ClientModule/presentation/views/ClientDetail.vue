<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { useClientStore } from '../stores/clientStore'
import { ClientDomain } from '../../domain/entities/ClientEntity'
import ActionConfirmationDialog from '@/components/shared/ActionConfirmationDialog.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const clientStore = useClientStore()

const loading = ref(false)
const client = computed(() => clientStore.currentItem)

const tabs = ref('contacts')

// Action confirmation dialog state
const showActivateDialog = ref(false)
const showSuspendDialog = ref(false)
const showDeactivateDialog = ref(false)
const showBlacklistDialog = ref(false)
const actionLoading = ref(false)

// Contact management state
const showContactDialog = ref(false)
const showDeleteContactDialog = ref(false)
const editingContact = ref<any | null>(null)
const deletingContactId = ref<string | null>(null)

// Contact form validation schema
const contactSchema = yup.object({
  full_name: yup
    .string()
    .required('El nombre completo es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  position: yup
    .string()
    .required('El puesto es requerido')
    .min(2, 'El puesto debe tener al menos 2 caracteres')
    .max(100, 'El puesto no puede exceder 100 caracteres'),
  department: yup
    .string()
    .notRequired()
    .max(100, 'El departamento no puede exceder 100 caracteres'),
  email: yup
    .string()
    .required('El correo electrónico es requerido')
    .email('Formato de email inválido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  primary_phone: yup
    .string()
    .required('El teléfono principal es requerido')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  secondary_phone: yup
    .string()
    .notRequired()
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  is_primary: yup.boolean(),
  can_approve_projects: yup.boolean(),
  can_sign_documents: yup.boolean(),
  notes: yup
    .string()
    .notRequired()
    .max(500, 'Las notas no pueden exceder 500 caracteres'),
})

// Contact form setup
const { handleSubmit: handleContactSubmit, errors: contactErrors, meta: contactMeta, resetForm: resetContactForm } = useForm({
  validationSchema: contactSchema,
  initialValues: {
    full_name: '',
    position: '',
    department: '',
    primary_phone: '',
    secondary_phone: '',
    email: '',
    is_primary: false,
    can_approve_projects: false,
    can_sign_documents: false,
    notes: '',
  },
})

// Contact form fields
const { value: contactFullName } = useField<string>('full_name')
const { value: contactPosition } = useField<string>('position')
const { value: contactDepartment } = useField<string>('department')
const { value: contactEmail } = useField<string>('email')
const { value: contactPrimaryPhone } = useField<string>('primary_phone')
const { value: contactSecondaryPhone } = useField<string>('secondary_phone')
const { value: contactIsPrimary } = useField<boolean>('is_primary')
const { value: contactCanApproveProjects } = useField<boolean>('can_approve_projects')
const { value: contactCanSignDocuments } = useField<boolean>('can_sign_documents')
const { value: contactNotes } = useField<string>('notes')

// Métodos
async function loadClient() {
  const id = route.params.id as string

  loading.value = true

  try {
    await clientStore.fetchById(id)
  }
  catch (error) {
    console.error('Error loading client:', error)
    router.push({ name: 'clients-list' })
  }
  finally {
    loading.value = false
  }
}

function navigateToEdit() {
  router.push({ name: 'clients-edit', params: { id: route.params.id } })
}

function openActivateDialog() {
  console.log('🔍 ClientDetail - openActivateDialog called')
  showActivateDialog.value = true
}

function openSuspendDialog() {
  console.log('🔍 ClientDetail - openSuspendDialog called')
  showSuspendDialog.value = true
}

function openDeactivateDialog() {
  console.log('🔍 ClientDetail - openDeactivateDialog called')
  showDeactivateDialog.value = true
}

function openBlacklistDialog() {
  console.log('🔍 ClientDetail - openBlacklistDialog called')
  showBlacklistDialog.value = true
}

async function handleActivateConfirm(data: { reason?: string; notes?: string; effective_date?: string }) {
  if (!client.value)
    return

  console.log('🔍 ClientDetail - handleActivateConfirm called with:', data)

  actionLoading.value = true

  try {
    await clientStore.activateClient(client.value.id, data.reason, data.notes, data.effective_date)
    showActivateDialog.value = false
    await loadClient()
  }
  catch (error) {
    console.error('Error activating client:', error)
  }
  finally {
    actionLoading.value = false
  }
}

async function handleSuspendConfirm(data: { reason?: string; notes?: string; effective_date?: string }) {
  if (!client.value)
    return

  console.log('🔍 ClientDetail - handleSuspendConfirm called with:', data)

  actionLoading.value = true

  try {
    await clientStore.suspendClient(client.value.id, data.reason, data.notes, data.effective_date)
    showSuspendDialog.value = false
    await loadClient()
  }
  catch (error) {
    console.error('Error suspending client:', error)
  }
  finally {
    actionLoading.value = false
  }
}

async function handleDeactivateConfirm(data: { reason?: string; notes?: string; effective_date?: string }) {
  if (!client.value)
    return

  console.log('🔍 ClientDetail - handleDeactivateConfirm called with:', data)

  actionLoading.value = true

  try {
    await clientStore.deactivateClient(client.value.id, data.reason, data.notes, data.effective_date)
    showDeactivateDialog.value = false
    await loadClient()
  }
  catch (error) {
    console.error('Error deactivating client:', error)
  }
  finally {
    actionLoading.value = false
  }
}

async function handleBlacklistConfirm(data: { reason?: string; notes?: string; effective_date?: string }) {
  if (!client.value)
    return

  console.log('🔍 ClientDetail - handleBlacklistConfirm called with:', data)

  actionLoading.value = true

  try {
    await clientStore.blacklistClient(client.value.id, data.reason, data.notes, data.effective_date)
    showBlacklistDialog.value = false
    await loadClient()
  }
  catch (error) {
    console.error('Error blacklisting client:', error)
  }
  finally {
    actionLoading.value = false
  }
}

function getStatusColor(status: string) {
  return ClientDomain.getStatusColor(status as any)
}

function formatDate(date?: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

function getClientDisplayName(clientData: typeof client.value) {
  if (!clientData)
    return ''

  return ClientDomain.getDisplayName(clientData)
}

function getInitials(clientData: typeof client.value) {
  if (!clientData)
    return '?'

  const name = getClientDisplayName(clientData)

  return name.substring(0, 2).toUpperCase()
}

// Tax regime options
const taxRegimeOptions = [
  { value: '601', title: '601 - General de Ley Personas Morales' },
  { value: '603', title: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', title: '605 - Sueldos y Salarios e Ingresos Asimilados' },
  { value: '606', title: '606 - Arrendamiento' },
  { value: '608', title: '608 - Demás ingresos' },
  { value: '610', title: '610 - Residentes en el Extranjero' },
  { value: '611', title: '611 - Ingresos por Dividendos' },
  { value: '612', title: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '614', title: '614 - Ingresos por intereses' },
  { value: '616', title: '616 - Sin obligaciones fiscales' },
  { value: '620', title: '620 - Sociedades Cooperativas de Producción' },
  { value: '621', title: '621 - Incorporación Fiscal' },
  { value: '622', title: '622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { value: '623', title: '623 - Opcional para Grupos de Sociedades' },
  { value: '624', title: '624 - Coordinados' },
  { value: '625', title: '625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { value: '626', title: '626 - Régimen Simplificado de Confianza' },
]

const cfdiUseOptions = [
  { value: 'G01', title: 'G01 - Adquisición de mercancías' },
  { value: 'G02', title: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', title: 'G03 - Gastos en general' },
  { value: 'P01', title: 'P01 - Por definir' },
]

function getTaxRegimeLabel(code: string) {
  const option = taxRegimeOptions.find(opt => opt.value === code)

  return option?.title || code
}

function getCfdiUseLabel(code: string) {
  const option = cfdiUseOptions.find(opt => opt.value === code)

  return option?.title || code
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  check: 'Cheque',
  bank_transfer: 'Transferencia Bancaria',
  credit_card: 'Tarjeta de Crédito',
  financing: 'Financiamiento',
}

function getPaymentMethodLabel(method: string) {
  return paymentMethodLabels[method] || method
}

// Contact management methods
function openAddContactDialog() {
  editingContact.value = null
  resetContactForm({
    values: {
      full_name: '',
      position: '',
      department: '',
      primary_phone: '',
      secondary_phone: '',
      email: '',
      is_primary: false,
      can_approve_projects: false,
      can_sign_documents: false,
      notes: '',
    },
  })
  showContactDialog.value = true
}

function openEditContactDialog(contact: any) {
  editingContact.value = contact
  resetContactForm({
    values: {
      full_name: contact.full_name || '',
      position: contact.position || '',
      department: contact.department || '',
      primary_phone: contact.primary_phone || '',
      secondary_phone: contact.secondary_phone || '',
      email: contact.email || '',
      is_primary: contact.is_primary || false,
      can_approve_projects: contact.can_approve_projects || false,
      can_sign_documents: contact.can_sign_documents || false,
      notes: contact.notes || '',
    },
  })
  showContactDialog.value = true
}

const saveContact = handleContactSubmit(
  async values => {
    if (!client.value)
      return

    actionLoading.value = true

    try {
      if (editingContact.value)
        await clientStore.updateContact(client.value.id, editingContact.value.id, values)

      else
        await clientStore.addContact(client.value.id, values)

      showContactDialog.value = false
    }
    catch (error) {
      console.error('Error saving contact:', error)
    }
    finally {
      actionLoading.value = false
    }
  },
  ({ errors }) => {
    console.error('Validation errors:', errors)
  },
)

function openDeleteContactDialog(contactId: string) {
  deletingContactId.value = contactId
  showDeleteContactDialog.value = true
}

async function confirmDeleteContact() {
  if (!client.value || !deletingContactId.value)
    return

  actionLoading.value = true

  try {
    await clientStore.deleteContact(client.value.id, deletingContactId.value)
    showDeleteContactDialog.value = false
    deletingContactId.value = null
  }
  catch (error) {
    console.error('Error deleting contact:', error)
  }
  finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadClient()
})
</script>

<template>
  <div v-if="loading">
    <VProgressLinear indeterminate />
  </div>

  <div v-else-if="client">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-4">
            <VAvatar
              size="80"
              color="primary"
            >
              <span class="text-h4">{{ getInitials(client) }}</span>
            </VAvatar>

            <div>
              <h4 class="text-h4 mb-1">
                {{ getClientDisplayName(client) }}
              </h4>
              <div class="d-flex align-center gap-2 flex-wrap">
                <VChip
                  size="small"
                  variant="tonal"
                  :color="client.business_type === 'company' ? 'info' : 'secondary'"
                >
                  {{ t(`ClientModule.client.business_types.${client.business_type}`) }}
                </VChip>
                <VChip
                  size="small"
                  :color="getStatusColor(client.status)"
                  variant="tonal"
                >
                  {{ t(`ClientModule.client.status.${client.status}`) }}
                </VChip>
                <span class="text-body-2 text-disabled">
                  {{ client.client_code }}
                </span>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <VBtn
              variant="outlined"
              @click="router.back()"
            >
              <VIcon start>
                tabler-arrow-left
              </VIcon>
              {{ t('ClientModule.common.back') }}
            </VBtn>

            <VBtn
              v-if="client.status !== 'active'"
              color="success"
              @click="openActivateDialog"
            >
              {{ t('ClientModule.client.actions.activate') }}
            </VBtn>

            <VBtn
              v-if="client.status === 'active'"
              color="warning"
              @click="openSuspendDialog"
            >
              {{ t('ClientModule.client.actions.suspend') }}
            </VBtn>

            <VBtn
              v-if="client.status === 'active' || client.status === 'suspended'"
              color="secondary"
              @click="openDeactivateDialog"
            >
              {{ t('ClientModule.client.actions.deactivate') }}
            </VBtn>

            <VBtn
              v-if="client.status !== 'blacklisted'"
              color="error"
              @click="openBlacklistDialog"
            >
              {{ t('ClientModule.client.actions.blacklist') }}
            </VBtn>

            <VBtn
              color="primary"
              @click="navigateToEdit"
            >
              <VIcon start>
                tabler-pencil
              </VIcon>
              {{ t('ClientModule.common.edit') }}
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Datos Generales -->
    <VCard class="mb-4">
      <VCardTitle>Datos generales</VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <div class="text-caption text-disabled">
              Número de identificación
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ client.tax_id }}
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div class="text-caption text-disabled">
              Ciudad
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ client.city }}
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div class="text-caption text-disabled">
              Dirección
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ client.address_line_1 }}
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Información de contacto -->
    <VCard class="mb-4">
      <VCardTitle>Información de contacto</VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-disabled">
              Correo electrónico
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ client.primary_email || '-' }}
            </div>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-disabled">
              Celular
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ client.secondary_phone || '-' }}
            </div>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-disabled">
              Teléfono
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ client.primary_phone }}
            </div>
          </VCol>

          <VCol
            v-if="client.website"
            cols="12"
            md="4"
          >
            <div class="text-caption text-disabled">
              Sitio Web
            </div>
            <div class="text-body-1 font-weight-medium">
              <a
                :href="client.website"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ client.website }}
              </a>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Información comercial -->
    <VCard class="mb-4">
      <VCardTitle>Información comercial</VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="3"
          >
            <div class="text-caption text-disabled">
              Plazo de pago
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ client.payment_terms ? t(`ClientModule.client.payment_terms.${client.payment_terms}`) : 'De contado' }}
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div class="text-caption text-disabled">
              Régimen Fiscal
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ getTaxRegimeLabel(client.tax_regime) }}
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div class="text-caption text-disabled">
              Uso de CFDI
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ getCfdiUseLabel(client.cfdi_use) }}
            </div>
          </VCol>

          <VCol
            v-if="client.credit_limit"
            cols="12"
            md="3"
          >
            <div class="text-caption text-disabled">
              Límite de crédito
            </div>
            <div class="text-body-1 font-weight-medium">
              {{ `$${client.credit_limit.toLocaleString()} ${client.credit_limit_currency || 'MXN'}` }}
            </div>
          </VCol>

          <VCol
            v-if="client.payment_methods && client.payment_methods.length > 0"
            cols="12"
          >
            <div class="text-caption text-disabled mb-2">
              Métodos de Pago
            </div>
            <VChip
              v-for="method in client.payment_methods"
              :key="method"
              size="small"
              variant="tonal"
              class="mr-1"
            >
              {{ getPaymentMethodLabel(method) }}
            </VChip>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Tabs para Contactos e Historial -->
    <VCard>
      <VTabs v-model="tabs">
        <VTab value="contacts">
          <VIcon start>
            tabler-users
          </VIcon>
          Contactos
          <VChip
            v-if="client.contacts && client.contacts.length > 0"
            size="x-small"
            color="primary"
            class="ml-2"
          >
            {{ client.contacts.length }}
          </VChip>
        </VTab>
        <VTab value="history">
          <VIcon start>
            tabler-history
          </VIcon>
          Historial
        </VTab>
      </VTabs>

      <VCardText>
        <VWindow v-model="tabs">
          <!-- Contacts Tab -->
          <VWindowItem value="contacts">
            <div class="d-flex justify-end mb-4">
              <VBtn
                color="primary"
                @click="openAddContactDialog"
              >
                <VIcon start>
                  tabler-plus
                </VIcon>
                Agregar Contacto
              </VBtn>
            </div>

            <div v-if="!client.contacts || client.contacts.length === 0">
              <VAlert
                type="info"
                variant="tonal"
              >
                No hay contactos registrados
              </VAlert>
            </div>

            <div v-else>
              <VRow>
                <VCol
                  v-for="contact in client.contacts"
                  :key="contact.id"
                  cols="12"
                  md="6"
                >
                  <VCard variant="outlined">
                    <VCardText>
                      <div class="d-flex align-center justify-space-between mb-2">
                        <h6 class="text-h6">
                          {{ contact.full_name }}
                        </h6>
                        <div class="d-flex gap-2 align-center">
                          <VChip
                            v-if="contact.is_primary"
                            size="x-small"
                            color="primary"
                          >
                            Principal
                          </VChip>
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            @click="openEditContactDialog(contact)"
                          >
                            <VIcon size="18">
                              tabler-pencil
                            </VIcon>
                          </VBtn>
                          <VBtn
                            icon
                            size="x-small"
                            variant="text"
                            color="error"
                            @click="openDeleteContactDialog(contact.id)"
                          >
                            <VIcon size="18">
                              tabler-trash
                            </VIcon>
                          </VBtn>
                        </div>
                      </div>
                      <div
                        v-if="contact.position"
                        class="text-body-2 mb-2"
                      >
                        {{ contact.position }}
                        <span v-if="contact.department"> - {{ contact.department }}</span>
                      </div>
                      <div
                        v-if="contact.email"
                        class="text-body-2 mb-1"
                      >
                        <VIcon
                          size="16"
                          class="me-1"
                        >
                          tabler-mail
                        </VIcon>
                        {{ contact.email }}
                      </div>
                      <div
                        v-if="contact.primary_phone"
                        class="text-body-2 mb-1"
                      >
                        <VIcon
                          size="16"
                          class="me-1"
                        >
                          tabler-phone
                        </VIcon>
                        {{ contact.primary_phone }}
                      </div>
                      <div
                        v-if="contact.secondary_phone"
                        class="text-body-2 mb-1"
                      >
                        <VIcon
                          size="16"
                          class="me-1"
                        >
                          tabler-device-mobile
                        </VIcon>
                        {{ contact.secondary_phone }}
                      </div>
                      <div
                        v-if="contact.can_approve_projects || contact.can_sign_documents"
                        class="mt-2"
                      >
                        <VChip
                          v-if="contact.can_approve_projects"
                          size="x-small"
                          variant="tonal"
                          color="success"
                          class="mr-1"
                        >
                          Puede Aprobar Proyectos
                        </VChip>
                        <VChip
                          v-if="contact.can_sign_documents"
                          size="x-small"
                          variant="tonal"
                          color="info"
                        >
                          Puede Firmar Documentos
                        </VChip>
                      </div>
                      <div
                        v-if="contact.notes"
                        class="text-caption text-disabled mt-2"
                      >
                        {{ contact.notes }}
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>
          </VWindowItem>

          <!-- History Tab -->
          <VWindowItem value="history">
            <div v-if="!client.status_history || client.status_history.length === 0">
              <VAlert
                type="info"
                variant="tonal"
              >
                No hay historial disponible
              </VAlert>
            </div>

            <VTimeline
              v-else
              side="end"
              align="start"
              truncate-line="both"
              density="compact"
            >
              <VTimelineItem
                v-for="(history, index) in client.status_history"
                :key="history.id"
                :dot-color="getStatusColor(history.new_status)"
                size="small"
              >
                <template #opposite>
                  <div class="text-caption text-disabled">
                    {{ formatDate(history.effective_date) }}
                  </div>
                </template>

                <VCard>
                  <VCardText>
                    <div class="d-flex align-center gap-2 mb-2">
                      <VChip
                        :color="getStatusColor(history.old_status)"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ t(`ClientModule.client.status.${history.old_status}`) }}
                      </VChip>
                      <VIcon size="16">
                        tabler-arrow-right
                      </VIcon>
                      <VChip
                        :color="getStatusColor(history.new_status)"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ t(`ClientModule.client.status.${history.new_status}`) }}
                      </VChip>
                    </div>
                    <div
                      v-if="history.reason"
                      class="text-body-2 mb-1"
                    >
                      <strong>Razón:</strong> {{ history.reason }}
                    </div>
                    <div
                      v-if="history.notes"
                      class="text-body-2 mb-1"
                    >
                      <strong>Notas:</strong> {{ history.notes }}
                    </div>
                    <div
                      v-if="history.changed_by_user"
                      class="text-caption text-disabled"
                    >
                      Cambiado por: {{ history.changed_by_user.name }}
                    </div>
                  </VCardText>
                </VCard>
              </VTimelineItem>
            </VTimeline>
          </VWindowItem>
        </VWindow>
      </VCardText>
    </VCard>
  </div>

  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      {{ t('ClientModule.client.not_found') }}
    </VAlert>
  </div>

  <!-- Action Confirmation Dialogs -->
  <ActionConfirmationDialog
    v-if="client"
    :visible="showActivateDialog"
    title="Activar Cliente"
    action-type="activate"
    entity-name="Cliente"
    :entity-info="getClientDisplayName(client)"
    :loading="actionLoading"
    @close="showActivateDialog = false"
    @confirm="handleActivateConfirm"
  />

  <ActionConfirmationDialog
    v-if="client"
    :visible="showSuspendDialog"
    title="Suspender Cliente"
    action-type="suspend"
    entity-name="Cliente"
    :entity-info="getClientDisplayName(client)"
    :loading="actionLoading"
    @close="showSuspendDialog = false"
    @confirm="handleSuspendConfirm"
  />

  <ActionConfirmationDialog
    v-if="client"
    :visible="showDeactivateDialog"
    title="Desactivar Cliente"
    action-type="deactivate"
    entity-name="Cliente"
    :entity-info="getClientDisplayName(client)"
    :loading="actionLoading"
    @close="showDeactivateDialog = false"
    @confirm="handleDeactivateConfirm"
  />

  <ActionConfirmationDialog
    v-if="client"
    :visible="showBlacklistDialog"
    title="Agregar a Lista Negra"
    action-type="blacklist"
    entity-name="Cliente"
    :entity-info="getClientDisplayName(client)"
    :loading="actionLoading"
    @close="showBlacklistDialog = false"
    @confirm="handleBlacklistConfirm"
  />

  <!-- Delete Contact Confirmation Dialog -->
  <VDialog
    v-model="showDeleteContactDialog"
    max-width="500"
  >
    <VCard>
      <VCardTitle>
        <span class="text-h5">Eliminar Contacto</span>
      </VCardTitle>
      <VCardText>
        <VAlert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          ¿Está seguro de que desea eliminar este contacto? Esta acción no se puede deshacer.
        </VAlert>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="outlined"
          @click="showDeleteContactDialog = false"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="error"
          :loading="actionLoading"
          @click="confirmDeleteContact"
        >
          Eliminar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Contact Dialog -->
  <VDialog
    v-model="showContactDialog"
    max-width="800"
  >
    <VCard>
      <VCardTitle>
        <span class="text-h5">{{ editingContact ? 'Editar Contacto' : 'Agregar Contacto' }}</span>
      </VCardTitle>
      <VCardText>
        <VForm @submit.prevent="saveContact">
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="contactFullName"
                label="Nombre Completo *"
                variant="outlined"
                :error-messages="contactErrors.full_name"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="contactPosition"
                label="Puesto *"
                variant="outlined"
                :error-messages="contactErrors.position"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="contactDepartment"
                label="Departamento"
                variant="outlined"
                :error-messages="contactErrors.department"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="contactEmail"
                label="Email *"
                type="email"
                variant="outlined"
                :error-messages="contactErrors.email"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="contactPrimaryPhone"
                label="Teléfono Principal *"
                variant="outlined"
                :error-messages="contactErrors.primary_phone"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="contactSecondaryPhone"
                label="Teléfono Secundario"
                variant="outlined"
                :error-messages="contactErrors.secondary_phone"
              />
            </VCol>
            <VCol cols="12">
              <VCheckbox
                v-model="contactIsPrimary"
                label="Contacto Principal"
              />
            </VCol>
            <VCol cols="12">
              <VCheckbox
                v-model="contactCanApproveProjects"
                label="Puede Aprobar Proyectos"
              />
            </VCol>
            <VCol cols="12">
              <VCheckbox
                v-model="contactCanSignDocuments"
                label="Puede Firmar Documentos"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="contactNotes"
                label="Notas"
                variant="outlined"
                rows="3"
                :error-messages="contactErrors.notes"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="outlined"
          @click="showContactDialog = false"
        >
          Cancelar
        </VBtn>
        <VBtn
          type="submit"
          color="primary"
          :loading="actionLoading"
          :disabled="!contactMeta.valid"
          @click="saveContact"
        >
          Guardar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
