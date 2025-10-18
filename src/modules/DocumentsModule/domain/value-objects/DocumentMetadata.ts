/**
 * Document Metadata Value Object
 *
 * Encapsulates document metadata with validation and business rules
 */

export class DocumentMetadata {
  private readonly metadata: Record<string, any>

  constructor(metadata: Record<string, any> = {}) {
    this.metadata = { ...metadata }
    this.validate()
  }

  /**
   * Get metadata value by key
   */
  get(key: string): any {
    return this.metadata[key]
  }

  /**
   * Set metadata value
   */
  set(key: string, value: any): DocumentMetadata {
    const newMetadata = { ...this.metadata, [key]: value }

    return new DocumentMetadata(newMetadata)
  }

  /**
   * Remove metadata key
   */
  remove(key: string): DocumentMetadata {
    const newMetadata = { ...this.metadata }

    delete newMetadata[key]

    return new DocumentMetadata(newMetadata)
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return key in this.metadata
  }

  /**
   * Get all metadata
   */
  toObject(): Record<string, any> {
    return { ...this.metadata }
  }

  /**
   * Check if metadata is empty
   */
  isEmpty(): boolean {
    return Object.keys(this.metadata).length === 0
  }

  /**
   * Get metadata keys
   */
  keys(): string[] {
    return Object.keys(this.metadata)
  }

  /**
   * Validate metadata structure
   */
  private validate(): void {
    // Validate that all values are serializable
    try {
      JSON.stringify(this.metadata)
    }
    catch (error) {
      throw new Error('Metadata contains non-serializable values')
    }

    // Validate key names (no special characters)
    for (const key of Object.keys(this.metadata)) {
      if (!/^[a-z_]\w*$/i.test(key))
        throw new Error(`Invalid metadata key: ${key}. Keys must start with letter or underscore and contain only letters, numbers, and underscores.`)
    }
  }

  /**
   * Validate specific metadata for document type
   */
  static validateForDocumentType(metadata: Record<string, any>, documentType: string, resourceType: string, resourceSubtype?: string): string[] {
    const errors: string[] = []

    // Validate based on document type and resource type
    if (resourceType === 'employee' && resourceSubtype === 'identification')
      errors.push(...DocumentMetadata.validateIdentificationMetadata(metadata))
    else if (resourceType === 'project' && resourceSubtype === 'contract')
      errors.push(...DocumentMetadata.validateContractMetadata(metadata))
    else if (resourceType === 'drilling_report' && resourceSubtype === 'daily_report')
      errors.push(...DocumentMetadata.validateDrillingReportMetadata(metadata))

    return errors
  }

  /**
   * Validate identification document metadata
   */
  private static validateIdentificationMetadata(metadata: Record<string, any>): string[] {
    const errors: string[] = []

    if (!metadata.id_type)
      errors.push('ID type is required for identification documents')

    if (!metadata.id_number)
      errors.push('ID number is required for identification documents')

    if (!metadata.issue_date)
      errors.push('Issue date is required for identification documents')

    if (!metadata.issuing_authority)
      errors.push('Issuing authority is required for identification documents')

    // Validate date formats
    if (metadata.issue_date && !DocumentMetadata.isValidDate(metadata.issue_date))
      errors.push('Issue date must be in YYYY-MM-DD format')

    if (metadata.expiry_date && !DocumentMetadata.isValidDate(metadata.expiry_date))
      errors.push('Expiry date must be in YYYY-MM-DD format')

    return errors
  }

  /**
   * Validate contract document metadata
   */
  private static validateContractMetadata(metadata: Record<string, any>): string[] {
    const errors: string[] = []

    if (!metadata.contract_number)
      errors.push('Contract number is required for contract documents')

    if (!metadata.contract_type)
      errors.push('Contract type is required for contract documents')

    if (!metadata.start_date)
      errors.push('Start date is required for contract documents')

    if (!metadata.parties)
      errors.push('Contract parties are required for contract documents')

    // Validate date formats
    if (metadata.start_date && !DocumentMetadata.isValidDate(metadata.start_date))
      errors.push('Start date must be in YYYY-MM-DD format')

    if (metadata.end_date && !DocumentMetadata.isValidDate(metadata.end_date))
      errors.push('End date must be in YYYY-MM-DD format')

    return errors
  }

  /**
   * Validate drilling report metadata
   */
  private static validateDrillingReportMetadata(metadata: Record<string, any>): string[] {
    const errors: string[] = []

    if (!metadata.report_date)
      errors.push('Report date is required for drilling reports')

    if (!metadata.report_number)
      errors.push('Report number is required for drilling reports')

    if (!metadata.well_name)
      errors.push('Well name is required for drilling reports')

    if (!metadata.shift)
      errors.push('Shift is required for drilling reports')

    if (!metadata.crew_chief)
      errors.push('Crew chief is required for drilling reports')

    // Validate date format
    if (metadata.report_date && !DocumentMetadata.isValidDate(metadata.report_date))
      errors.push('Report date must be in YYYY-MM-DD format')

    return errors
  }

  /**
   * Check if date string is valid YYYY-MM-DD format
   */
  private static isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateString))
      return false

    const date = new Date(dateString)

    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * Get metadata template for resource type
   */
  static getTemplateForResourceType(resourceType: string, resourceSubtype?: string): Record<string, any> {
    const templates: Record<string, Record<string, any>> = {
      'employee.identification': {
        id_type: '',
        id_number: '',
        issue_date: '',
        expiry_date: '',
        issuing_authority: '',
        issuing_country: '',
        issuing_state: '',
        holder_name: '',
        holder_birthdate: '',
        verification_status: 'pending',
        verification_date: null,
        verification_notes: null,
      },
      'project.contract': {
        contract_number: '',
        contract_type: '',
        contract_value: null,
        currency: '',
        start_date: '',
        end_date: null,
        renewal_date: null,
        auto_renewal: false,
        parties: {
          primary: '',
          secondary: '',
          witnesses: [],
        },
        payment_terms: '',
        termination_clause: '',
        signatures_required: null,
        signatures_collected: null,
        signed_date: null,
        status: 'draft',
      },
      'drilling_report.daily_report': {
        report_date: '',
        report_number: '',
        well_name: '',
        well_depth_start: null,
        well_depth_end: null,
        meters_drilled: null,
        shift: '',
        crew_chief: '',
        crew_size: null,
        hours_worked: null,
        equipment_used: [],
        consumables_used: {},
        incidents: false,
        incident_details: null,
        weather_conditions: '',
        temperature_celsius: null,
        next_shift_plan: '',
        supervisor_name: '',
        supervisor_signature: false,
        qc_check: null,
        hse_compliance: null,
      },
    }

    const key = resourceSubtype ? `${resourceType}.${resourceSubtype}` : resourceType

    return templates[key] || {}
  }

  /**
   * Merge metadata with template
   */
  static mergeWithTemplate(metadata: Record<string, any>, resourceType: string, resourceSubtype?: string): Record<string, any> {
    const template = DocumentMetadata.getTemplateForResourceType(resourceType, resourceSubtype)

    return { ...template, ...metadata }
  }

  /**
   * Check if metadata matches template structure
   */
  static matchesTemplate(metadata: Record<string, any>, resourceType: string, resourceSubtype?: string): boolean {
    const template = DocumentMetadata.getTemplateForResourceType(resourceType, resourceSubtype)
    const templateKeys = Object.keys(template)
    const metadataKeys = Object.keys(metadata)

    // Check if all template keys are present in metadata
    return templateKeys.every(key => metadataKeys.includes(key))
  }

  /**
   * Get missing required fields
   */
  static getMissingRequiredFields(metadata: Record<string, any>, resourceType: string, resourceSubtype?: string): string[] {
    const template = DocumentMetadata.getTemplateForResourceType(resourceType, resourceSubtype)
    const missing: string[] = []

    for (const [key, defaultValue] of Object.entries(template)) {
      if (defaultValue !== null && defaultValue !== '' && !(key in metadata))
        missing.push(key)
    }

    return missing
  }

  /**
   * Format metadata for display
   */
  static formatForDisplay(metadata: Record<string, any>): Array<{ key: string; value: any; formatted: string }> {
    return Object.entries(metadata).map(([key, value]) => ({
      key,
      value,
      formatted: DocumentMetadata.formatValue(value),
    }))
  }

  /**
   * Format individual value for display
   */
  private static formatValue(value: any): string {
    if (value === null || value === undefined)
      return 'N/A'
    if (typeof value === 'boolean')
      return value ? 'Sí' : 'No'
    if (typeof value === 'object')
      return JSON.stringify(value, null, 2)
    if (typeof value === 'string' && DocumentMetadata.isValidDate(value))
      return new Date(value).toLocaleDateString('es-ES')

    return String(value)
  }

  /**
   * Check if metadata has expired fields
   */
  static hasExpiredFields(metadata: Record<string, any>): Array<{ field: string; expiryDate: string }> {
    const expired: Array<{ field: string; expiryDate: string }> = []
    const today = new Date()

    for (const [key, value] of Object.entries(metadata)) {
      if (key.includes('expiry') || key.includes('expiration') || key.includes('expires')) {
        if (typeof value === 'string' && DocumentMetadata.isValidDate(value)) {
          const expiryDate = new Date(value)
          if (expiryDate < today)
            expired.push({ field: key, expiryDate: value })
        }
      }
    }

    return expired
  }

  /**
   * Check if metadata has fields expiring soon
   */
  static hasExpiringFields(metadata: Record<string, any>, daysAhead = 30): Array<{ field: string; expiryDate: string; daysUntil: number }> {
    const expiring: Array<{ field: string; expiryDate: string; daysUntil: number }> = []
    const today = new Date()
    const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000))

    for (const [key, value] of Object.entries(metadata)) {
      if (key.includes('expiry') || key.includes('expiration') || key.includes('expires')) {
        if (typeof value === 'string' && DocumentMetadata.isValidDate(value)) {
          const expiryDate = new Date(value)
          if (expiryDate > today && expiryDate <= futureDate) {
            const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            expiring.push({ field: key, expiryDate: value, daysUntil })
          }
        }
      }
    }

    return expiring
  }
}
