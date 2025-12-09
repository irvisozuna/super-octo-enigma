/**
 * Client Mapper
 *
 * Maps between DTOs and Domain Entities
 */

import type {
  ClientContactEntity,
  ClientEntity,
  ClientStatusHistoryEntity,
  CreateClientRequest,
  UpdateClientRequest,
} from '../../domain/entities/ClientEntity'

import type {
  ClientCreateDto,
  ClientListDto,
  ClientStatusHistoryDto,
  ClientUpdateDto,
} from '../dtos/ClientDtos'

export class ClientMapper {
  /**
   * Map API list response to domain entity
   */
  static apiListToDomain(dto: ClientListDto): ClientEntity {
    return {
      id: dto.id,
      client_code: dto.client_code,
      business_type: dto.business_type,
      status: dto.status,
      business_name: dto.business_name,
      trade_name: dto.trade_name,
      industry: dto.industry,
      primary_email: dto.primary_email,
      primary_phone: dto.primary_phone,
      city: dto.city,
      state: dto.state,
      tax_id: dto.tax_id,
      credit_limit: dto.credit_limit,
      payment_terms: dto.payment_terms,
      created_at: dto.created_at,
      updated_at: dto.updated_at,

      // Required fields that are not in list DTO - set defaults
      address_line_1: '',
      postal_code: '',
    }
  }

  /**
   * Map API detail response to domain entity
   */
  static apiDetailToDomain(dto: any): ClientEntity {
    // Handle nested structure from backend
    const businessInfo = dto.business_info || {}
    const contactInfo = dto.contact_info || {}
    const address = contactInfo.address || {}
    const billingInfo = dto.billing_info || {}
    const billingAddress = billingInfo.billing_address || {}

    return {
      id: dto.id,
      client_code: dto.client_code,
      business_type: businessInfo.business_type || dto.business_type,
      status: dto.status,
      business_name: businessInfo.business_name || dto.business_name,
      trade_name: businessInfo.trade_name || dto.trade_name,
      industry: businessInfo.industry || dto.industry,
      website: businessInfo.website || dto.website,
      logo_url: businessInfo.logo_url || dto.logo_url,
      primary_email: contactInfo.primary_email || dto.primary_email,
      secondary_email: contactInfo.secondary_email || dto.secondary_email,
      primary_phone: contactInfo.primary_phone || dto.primary_phone,
      secondary_phone: contactInfo.secondary_phone || dto.secondary_phone,
      address_line_1: address.address_line_1 || dto.address_line_1 || '',
      address_line_2: address.address_line_2 || dto.address_line_2,
      city: address.city || dto.city || '',
      state: address.state || dto.state || '',
      postal_code: address.postal_code || dto.postal_code || '',
      country: address.country || dto.country,
      billing_address_line_1: billingAddress.address_line_1 || dto.billing_address_line_1,
      billing_address_line_2: billingAddress.address_line_2 || dto.billing_address_line_2,
      billing_city: billingAddress.city || dto.billing_city,
      billing_state: billingAddress.state || dto.billing_state,
      billing_postal_code: billingAddress.postal_code || dto.billing_postal_code,
      billing_country: billingAddress.country || dto.billing_country,
      tax_id: businessInfo.tax_id || dto.tax_id || '',
      tax_regime: billingInfo.tax_regime || dto.tax_regime || '',
      cfdi_use: billingInfo.cfdi_use || dto.cfdi_use || '',
      payment_terms: billingInfo.payment_terms || dto.payment_terms,
      payment_methods: billingInfo.payment_methods || dto.payment_methods,
      credit_limit: billingInfo.credit_limit || dto.credit_limit,
      credit_limit_currency: billingInfo.credit_limit_currency || dto.credit_limit_currency,
      notes: dto.notes,
      tags: dto.tags,
      contacts: dto.contacts ? dto.contacts.map((c: any) => this.apiContactToDomain(c)) : [],
      status_history: dto.status_history ? dto.status_history.map((h: any) => this.apiStatusHistoryToDomain(h)) : [],
      created_at: dto.created_at,
      updated_at: dto.updated_at,
    }
  }

  /**
   * Map domain create request to API DTO
   */
  static domainCreateToApi(request: CreateClientRequest): ClientCreateDto {
    return {
      business_type: request.business_type,
      business_name: request.business_name,
      trade_name: request.trade_name,
      industry: request.industry,
      website: request.website,
      logo_url: request.logo_url,
      primary_email: request.primary_email,
      secondary_email: request.secondary_email,
      primary_phone: request.primary_phone,
      secondary_phone: request.secondary_phone,
      address_line_1: request.address_line_1,
      address_line_2: request.address_line_2,
      city: request.city,
      state: request.state,
      postal_code: request.postal_code,
      country: request.country,
      billing_address_line_1: request.billing_address_line_1,
      billing_address_line_2: request.billing_address_line_2,
      billing_city: request.billing_city,
      billing_state: request.billing_state,
      billing_postal_code: request.billing_postal_code,
      billing_country: request.billing_country,
      tax_id: request.tax_id,
      tax_regime: request.tax_regime,
      cfdi_use: request.cfdi_use,
      payment_terms: request.payment_terms,
      payment_methods: request.payment_methods,
      credit_limit: request.credit_limit,
      credit_limit_currency: request.credit_limit_currency,
      notes: request.notes,
      tags: request.tags,
    }
  }

  /**
   * Map domain update request to API DTO
   */
  static domainUpdateToApi(request: UpdateClientRequest): ClientUpdateDto {
    const dto: ClientUpdateDto = {}

    if (request.business_type !== undefined)
      dto.business_type = request.business_type
    if (request.business_name !== undefined)
      dto.business_name = request.business_name
    if (request.trade_name !== undefined)
      dto.trade_name = request.trade_name
    if (request.industry !== undefined)
      dto.industry = request.industry
    if (request.website !== undefined)
      dto.website = request.website
    if (request.logo_url !== undefined)
      dto.logo_url = request.logo_url
    if (request.primary_email !== undefined)
      dto.primary_email = request.primary_email
    if (request.secondary_email !== undefined)
      dto.secondary_email = request.secondary_email
    if (request.primary_phone !== undefined)
      dto.primary_phone = request.primary_phone
    if (request.secondary_phone !== undefined)
      dto.secondary_phone = request.secondary_phone
    if (request.address_line_1 !== undefined)
      dto.address_line_1 = request.address_line_1
    if (request.address_line_2 !== undefined)
      dto.address_line_2 = request.address_line_2
    if (request.city !== undefined)
      dto.city = request.city
    if (request.state !== undefined)
      dto.state = request.state
    if (request.postal_code !== undefined)
      dto.postal_code = request.postal_code
    if (request.country !== undefined)
      dto.country = request.country
    if (request.billing_address_line_1 !== undefined)
      dto.billing_address_line_1 = request.billing_address_line_1
    if (request.billing_address_line_2 !== undefined)
      dto.billing_address_line_2 = request.billing_address_line_2
    if (request.billing_city !== undefined)
      dto.billing_city = request.billing_city
    if (request.billing_state !== undefined)
      dto.billing_state = request.billing_state
    if (request.billing_postal_code !== undefined)
      dto.billing_postal_code = request.billing_postal_code
    if (request.billing_country !== undefined)
      dto.billing_country = request.billing_country
    if (request.tax_id !== undefined)
      dto.tax_id = request.tax_id
    if (request.tax_regime !== undefined)
      dto.tax_regime = request.tax_regime
    if (request.cfdi_use !== undefined)
      dto.cfdi_use = request.cfdi_use
    if (request.payment_terms !== undefined)
      dto.payment_terms = request.payment_terms
    if (request.payment_methods !== undefined)
      dto.payment_methods = request.payment_methods
    if (request.credit_limit !== undefined)
      dto.credit_limit = request.credit_limit
    if (request.credit_limit_currency !== undefined)
      dto.credit_limit_currency = request.credit_limit_currency
    if (request.notes !== undefined)
      dto.notes = request.notes
    if (request.tags !== undefined)
      dto.tags = request.tags
    if (request.status !== undefined)
      dto.status = request.status

    return dto
  }

  /**
   * Map API contact to domain entity
   */
  static apiContactToDomain(dto: any): ClientContactEntity {
    return {
      id: dto.id,
      client_id: dto.client_id,
      company_id: dto.company_id,
      full_name: dto.full_name || dto.fullName || dto.name || '',
      position: dto.position || '',
      department: dto.department,
      primary_phone: dto.primary_phone || dto.primaryPhone || dto.phone || '',
      secondary_phone: dto.secondary_phone || dto.secondaryPhone || dto.mobile,
      email: dto.email || '',
      is_primary: dto.is_primary || dto.isPrimary || false,
      can_approve_projects: dto.can_approve_projects || dto.canApproveProjects || false,
      can_sign_documents: dto.can_sign_documents || dto.canSignDocuments || false,
      notes: dto.notes,
      created_at: dto.created_at || dto.createdAt,
      updated_at: dto.updated_at || dto.updatedAt,
    }
  }

  /**
   * Map API status history to domain entity
   */
  static apiStatusHistoryToDomain(dto: ClientStatusHistoryDto): ClientStatusHistoryEntity {
    return {
      id: dto.id,
      client_id: dto.client_id,
      old_status: dto.old_status,
      new_status: dto.new_status,
      reason: dto.reason,
      notes: dto.notes,
      changed_by_user_id: dto.changed_by_user_id,
      changed_by_user: dto.changed_by_user,
      effective_date: dto.effective_date,
      created_at: dto.created_at,
    }
  }
}
