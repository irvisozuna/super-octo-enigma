/**
 * Client Composable
 *
 * Reusable composition function for client operations
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClientStore } from '../stores/clientStore'
import { ClientDomain } from '../../domain/entities/ClientEntity'
import type { ClientEntity } from '../../domain/entities/ClientEntity'

export function useClient() {
  const { t } = useI18n()
  const clientStore = useClientStore()
  const loading = ref(false)

  /**
   * Get client by ID
   */
  async function getClient(id: string): Promise<ClientEntity | null> {
    loading.value = true

    try {
      await clientStore.fetchById(id)

      return clientStore.currentItem
    }
    catch (error) {
      console.error('Error loading client:', error)

      return null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get status color
   */
  function getStatusColor(status: string) {
    return ClientDomain.getStatusColor(status as any)
  }

  /**
   * Get status icon
   */
  function getStatusIcon(status: string) {
    return ClientDomain.getStatusIcon(status as any)
  }

  /**
   * Get status label
   */
  function getStatusLabel(status: string) {
    return t(`client.status.${status}`)
  }

  /**
   * Get business type label
   */
  function getBusinessTypeLabel(type: string) {
    return t(`client.business_types.${type}`)
  }

  /**
   * Get payment terms label
   */
  function getPaymentTermsLabel(terms: string) {
    return ClientDomain.getPaymentTermsLabel(terms as any)
  }

  /**
   * Format client display name
   */
  function getDisplayName(client: ClientEntity) {
    return ClientDomain.getDisplayName(client)
  }

  /**
   * Validate RFC
   */
  function validateRFC(rfc: string) {
    return ClientDomain.validateRFC(rfc)
  }

  /**
   * Check if client can be deleted
   */
  function canDeleteClient(client: ClientEntity) {
    return ClientDomain.canDelete(client)
  }

  /**
   * Check if client can be suspended
   */
  function canSuspendClient(client: ClientEntity) {
    return ClientDomain.canSuspend(client)
  }

  /**
   * Check if client can be activated
   */
  function canActivateClient(client: ClientEntity) {
    return ClientDomain.canActivate(client)
  }

  /**
   * Check if client has exceeded credit limit
   */
  function hasExceededCreditLimit(client: ClientEntity, currentBalance: number) {
    return ClientDomain.hasExceededCreditLimit(client, currentBalance)
  }

  /**
   * Format date
   */
  function formatDate(date?: string) {
    if (!date)
      return '-'

    return new Date(date).toLocaleDateString()
  }

  /**
   * Format phone number
   */
  function formatPhone(phone?: string) {
    if (!phone)
      return '-'

    // Format: (XXX) XXX-XXXX for 10-digit numbers
    if (phone.length === 10)
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`

    return phone
  }

  /**
   * Format currency
   */
  function formatCurrency(amount?: number, currency = 'MXN') {
    if (amount === undefined || amount === null)
      return '-'

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  /**
   * Get client initials
   */
  function getInitials(client: ClientEntity) {
    const name = getDisplayName(client)
    const parts = name.split(' ')
    if (parts.length >= 2)
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()

    return name.substring(0, 2).toUpperCase()
  }

  /**
   * Check if client is active
   */
  function isActive(client: ClientEntity) {
    return client.status === 'active'
  }

  /**
   * Check if client is company
   */
  function isCompany(client: ClientEntity) {
    return client.business_type === 'company'
  }

  /**
   * Check if client is individual
   */
  function isIndividual(client: ClientEntity) {
    return client.business_type === 'individual'
  }

  /**
   * Get tax regime label
   */
  function getTaxRegimeLabel(regime?: string) {
    if (!regime)
      return '-'

    // Map of common Mexican tax regimes
    const regimes: Record<string, string> = {
      601: 'General de Ley Personas Morales',
      603: 'Personas Morales con Fines no Lucrativos',
      605: 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
      606: 'Arrendamiento',
      608: 'Demás ingresos',
      610: 'Residentes en el Extranjero sin Establecimiento Permanente en México',
      611: 'Ingresos por Dividendos (socios y accionistas)',
      612: 'Personas Físicas con Actividades Empresariales y Profesionales',
      614: 'Ingresos por intereses',
      616: 'Sin obligaciones fiscales',
      620: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
      621: 'Incorporación Fiscal',
      622: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
      623: 'Opcional para Grupos de Sociedades',
      624: 'Coordinados',
      625: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
      626: 'Régimen Simplificado de Confianza',
    }

    return regimes[regime] || regime
  }

  /**
   * Get CFDI use label
   */
  function getCFDIUseLabel(use?: string) {
    if (!use)
      return '-'

    const uses: Record<string, string> = {
      G01: 'Adquisición de mercancías',
      G02: 'Devoluciones, descuentos o bonificaciones',
      G03: 'Gastos en general',
      P01: 'Por definir',
    }

    return uses[use] || use
  }

  return {
    // State
    loading,

    // Store
    clientStore,

    // Methods
    getClient,
    getStatusColor,
    getStatusIcon,
    getStatusLabel,
    getBusinessTypeLabel,
    getPaymentTermsLabel,
    getDisplayName,
    validateRFC,
    canDeleteClient,
    canSuspendClient,
    canActivateClient,
    hasExceededCreditLimit,
    formatDate,
    formatPhone,
    formatCurrency,
    getInitials,
    isActive,
    isCompany,
    isIndividual,
    getTaxRegimeLabel,
    getCFDIUseLabel,
  }
}
