/**
 * Full Name Value Object
 *
 * Encapsulates name validation and formatting
 */

export class FullName {
  private readonly _firstName: string
  private readonly _lastName: string

  private constructor(firstName: string, lastName: string) {
    this._firstName = firstName
    this._lastName = lastName
  }

  static create(firstName: string, lastName: string): FullName {
    const cleanedFirst = FullName.clean(firstName)
    const cleanedLast = FullName.clean(lastName)

    if (!FullName.isValid(cleanedFirst))
      throw new Error('Nombre inválido')

    if (!FullName.isValid(cleanedLast))
      throw new Error('Apellido inválido')

    return new FullName(cleanedFirst, cleanedLast)
  }

  static isValid(name: string): boolean {
    if (!name || name.trim() === '')
      return false

    if (name.length < 2 || name.length > 100)
      return false

    // Only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/

    return nameRegex.test(name)
  }

  static clean(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  get firstName(): string {
    return this._firstName
  }

  get lastName(): string {
    return this._lastName
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`
  }

  get initials(): string {
    return `${this._firstName.charAt(0)}${this._lastName.charAt(0)}`.toUpperCase()
  }

  equals(other: FullName): boolean {
    return this._firstName === other._firstName && this._lastName === other._lastName
  }

  toString(): string {
    return this.fullName
  }
}
