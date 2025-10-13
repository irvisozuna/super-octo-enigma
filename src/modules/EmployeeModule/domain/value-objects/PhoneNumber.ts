/**
 * Phone Number Value Object
 *
 * Encapsulates phone number validation and formatting
 */

export class PhoneNumber {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  static create(value: string): PhoneNumber {
    const cleaned = PhoneNumber.clean(value)

    if (!PhoneNumber.isValid(cleaned))
      throw new Error('Número de teléfono inválido')

    return new PhoneNumber(cleaned)
  }

  static createOptional(value?: string): PhoneNumber | undefined {
    if (!value || value.trim() === '')
      return undefined

    return PhoneNumber.create(value)
  }

  static isValid(phone: string): boolean {
    if (!phone || phone.trim() === '')
      return false

    // Mexican phone numbers: 10 digits
    const phoneRegex = /^\d{10}$/

    return phoneRegex.test(phone)
  }

  static clean(phone: string): string {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '')
  }

  get value(): string {
    return this._value
  }

  /**
   * Format phone number for display (XXX) XXX-XXXX
   */
  get formatted(): string {
    if (this._value.length !== 10)
      return this._value

    const areaCode = this._value.substring(0, 3)
    const prefix = this._value.substring(3, 6)
    const line = this._value.substring(6)

    return `(${areaCode}) ${prefix}-${line}`
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
