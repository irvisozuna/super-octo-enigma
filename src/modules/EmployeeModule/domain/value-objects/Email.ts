/**
 * Email Value Object
 *
 * Encapsulates email validation and business rules
 */

export class Email {
  private readonly _value: string

  private constructor(value: string) {
    this._value = value
  }

  static create(value: string): Email {
    if (!Email.isValid(value))
      throw new Error('Email inválido')

    return new Email(value.toLowerCase().trim())
  }

  static createOptional(value?: string): Email | undefined {
    if (!value || value.trim() === '')
      return undefined

    return Email.create(value)
  }

  static isValid(email: string): boolean {
    if (!email || email.trim() === '')
      return false

    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

    return emailRegex.test(email)
  }

  get value(): string {
    return this._value
  }

  equals(other: Email): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
