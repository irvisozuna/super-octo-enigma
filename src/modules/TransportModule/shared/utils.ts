/**
 * Shared Utilities for Transport Module
 */

import type { ValidationError } from './types'
import { DATE_FORMATS, VALIDATION_RULES } from './constants'

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format = DATE_FORMATS.DISPLAY): string {
  if (!date)
    return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime()))
    return ''

  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: format.includes('HH') ? '2-digit' : undefined,
    minute: format.includes('mm') ? '2-digit' : undefined,
  })
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Validate plate number
 */
export function validatePlateNumber(plateNumber: string): boolean {
  if (!plateNumber)
    return false

  const { MIN_LENGTH, MAX_LENGTH, PATTERN } = VALIDATION_RULES.PLATE_NUMBER

  return plateNumber.length >= MIN_LENGTH
         && plateNumber.length <= MAX_LENGTH
         && PATTERN.test(plateNumber)
}

/**
 * Validate VIN number
 */
export function validateVIN(vin: string): boolean {
  if (!vin)
    return false

  const { LENGTH, PATTERN } = VALIDATION_RULES.VIN

  return vin.length === LENGTH && PATTERN.test(vin)
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  if (!email)
    return false

  return VALIDATION_RULES.EMAIL.PATTERN.test(email)
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): boolean {
  if (!phone)
    return false

  const { MIN_LENGTH, MAX_LENGTH, PATTERN } = VALIDATION_RULES.PHONE
  const cleanPhone = phone.replace(/\s/g, '')

  return cleanPhone.length >= MIN_LENGTH
         && cleanPhone.length <= MAX_LENGTH
         && PATTERN.test(phone)
}

/**
 * Calculate vehicle age
 */
export function calculateVehicleAge(year: number): number {
  const currentYear = new Date().getFullYear()

  return currentYear - year
}

/**
 * Calculate days until date
 */
export function calculateDaysUntil(date: string | Date): number {
  if (!date)
    return 0

  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = targetDate.getTime() - now.getTime()

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  if (!date)
    return false

  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()

  return targetDate < now
}

/**
 * Check if date is expiring soon (within days)
 */
export function isExpiringSoon(date: string | Date, days = 30): boolean {
  const daysUntil = calculateDaysUntil(date)

  return daysUntil <= days && daysUntil >= 0
}

/**
 * Generate random ID for temporary use
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object')
    return obj
  if (obj instanceof Date)
    return new Date(obj.getTime()) as unknown as T
  if (Array.isArray(obj))
    return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any }
    for (const key in obj) {
      if (obj.hasOwnProperty(key))
        clonedObj[key] = deepClone(obj[key])
    }

    return clonedObj as T
  }

  return obj
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * Extract error message from API error
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string')
    return error

  if (error?.response?.data?.message)
    return error.response.data.message
  if (error?.message)
    return error.message
  if (error?.data?.message)
    return error.data.message

  return 'Ha ocurrido un error inesperado'
}

/**
 * Extract validation errors from API response
 */
export function extractValidationErrors(error: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (error?.response?.data?.errors) {
    const apiErrors = error.response.data.errors

    if (Array.isArray(apiErrors)) {
      errors.push(...apiErrors)
    }
    else if (typeof apiErrors === 'object') {
      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach(message => {
            errors.push({ field, message, rule: 'validation' })
          })
        }
        else if (typeof messages === 'string') {
          errors.push({ field, message: messages, rule: 'validation' })
        }
      })
    }
  }

  return errors
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value))
        value.forEach(item => searchParams.append(key, String(item)))
      else
        searchParams.append(key, String(value))
    }
  })

  return searchParams.toString()
}

/**
 * Parse query string to object
 */
export function parseQueryString(queryString: string): Record<string, any> {
  const params: Record<string, any> = {}
  const searchParams = new URLSearchParams(queryString)

  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key]))
        params[key].push(value)
      else
        params[key] = [params[key], value]
    }
    else {
      params[key] = value
    }
  })

  return params
}

/**
 * Sanitize filename for downloads
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Convert bytes to base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')

  return btoa(binary)
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate a code from a pattern with tokens.
 * Supported tokens:
 * - {YYYY} full year, {YY} two-digit year
 * - {MM} month 01-12, {DD} day 01-31
 * - {HH} hours 00-23, {mm} minutes 00-59, {ss} seconds 00-59
 * - {TS} full timestamp (milliseconds since epoch)
 * - {TS6} last 6 digits of timestamp
 * - {RNDn} random alphanumeric of length n (e.g., {RND6})
 */
export function generateCodeFromPattern(pattern: string, now: Date = new Date()): string {
  const year = now.getFullYear()
  const shortYear = String(year).slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timestamp = String(now.getTime())

  let result = pattern
    .replace(/\{YYYY\}/g, String(year))
    .replace(/\{YY\}/g, shortYear)
    .replace(/\{MM\}/g, month)
    .replace(/\{DD\}/g, day)
    .replace(/\{HH\}/g, hours)
    .replace(/\{mm\}/g, minutes)
    .replace(/\{ss\}/g, seconds)
    .replace(/\{TS\}/g, timestamp)
    .replace(/\{TS6\}/g, timestamp.slice(-6))

  // Replace {RNDn}
  result = result.replace(/\{RND(\d+)\}/g, (_m, lenStr: string) => {
    const length = Math.max(1, Math.min(64, Number(lenStr)))
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let rnd = ''
    for (let i = 0; i < length; i++)
      rnd += chars.charAt(Math.floor(Math.random() * chars.length))

    return rnd
  })

  return result
}
