/**
 * Date Utilities
 *
 * Utility functions for date formatting and manipulation
 */

import { differenceInDays, differenceInHours, differenceInMinutes, format, isValid, parseISO } from 'date-fns'
import { enUS, es } from 'date-fns/locale'

// Locale configuration
const locales = {
  es,
  en: enUS,
}

// Date formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  ISO: 'yyyy-MM-dd',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm',
  DATETIME_LONG: 'dd MMMM yyyy HH:mm',
} as const

// Time formats
export const TIME_FORMATS = {
  SHORT: 'HH:mm',
  LONG: 'HH:mm:ss',
  AM_PM: 'h:mm a',
} as const

/**
 * Format a date string or Date object
 */
export const formatDate = (
  date: string | Date | null | undefined,
  formatStr: string = DATE_FORMATS.SHORT,
  locale: keyof typeof locales = 'es',
): string => {
  if (!date)
    return ''

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return ''

    return format(dateObj, formatStr, { locale: locales[locale] })
  }
  catch (error) {
    console.error('Error formatting date:', error)

    return ''
  }
}

/**
 * Format a date and time string or Date object
 */
export const formatDateTime = (
  date: string | Date | null | undefined,
  formatStr: string = DATE_FORMATS.DATETIME,
  locale: keyof typeof locales = 'es',
): string => {
  if (!date)
    return ''

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return ''

    return format(dateObj, formatStr, { locale: locales[locale] })
  }
  catch (error) {
    console.error('Error formatting datetime:', error)

    return ''
  }
}

/**
 * Format a time string or Date object
 */
export const formatTime = (
  time: string | Date | null | undefined,
  formatStr: string = TIME_FORMATS.SHORT,
  locale: keyof typeof locales = 'es',
): string => {
  if (!time)
    return ''

  try {
    const timeObj = typeof time === 'string' ? parseISO(time) : time
    if (!isValid(timeObj))
      return ''

    return format(timeObj, formatStr, { locale: locales[locale] })
  }
  catch (error) {
    console.error('Error formatting time:', error)

    return ''
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export const getRelativeTime = (
  date: string | Date | null | undefined,
  locale: keyof typeof locales = 'es',
): string => {
  if (!date)
    return ''

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return ''

    const now = new Date()
    const days = differenceInDays(now, dateObj)
    const hours = differenceInHours(now, dateObj)
    const minutes = differenceInMinutes(now, dateObj)

    if (days > 0)
      return `${days} día${days > 1 ? 's' : ''} atrás`
    else if (hours > 0)
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`
    else if (minutes > 0)
      return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`
    else
      return 'Ahora'
  }
  catch (error) {
    console.error('Error getting relative time:', error)

    return ''
  }
}

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date | null | undefined): boolean => {
  if (!date)
    return false

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return false

    const today = new Date()

    return format(dateObj, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  }
  catch (error) {
    console.error('Error checking if date is today:', error)

    return false
  }
}

/**
 * Check if a date is yesterday
 */
export const isYesterday = (date: string | Date | null | undefined): boolean => {
  if (!date)
    return false

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return false

    const yesterday = new Date()

    yesterday.setDate(yesterday.getDate() - 1)

    return format(dateObj, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')
  }
  catch (error) {
    console.error('Error checking if date is yesterday:', error)

    return false
  }
}

/**
 * Check if a date is in the future
 */
export const isFuture = (date: string | Date | null | undefined): boolean => {
  if (!date)
    return false

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return false

    return dateObj > new Date()
  }
  catch (error) {
    console.error('Error checking if date is future:', error)

    return false
  }
}

/**
 * Check if a date is in the past
 */
export const isPast = (date: string | Date | null | undefined): boolean => {
  if (!date)
    return false

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return false

    return dateObj < new Date()
  }
  catch (error) {
    console.error('Error checking if date is past:', error)

    return false
  }
}

/**
 * Get the start of day for a date
 */
export const getStartOfDay = (date: string | Date | null | undefined): Date | null => {
  if (!date)
    return null

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return null

    const startOfDay = new Date(dateObj)

    startOfDay.setHours(0, 0, 0, 0)

    return startOfDay
  }
  catch (error) {
    console.error('Error getting start of day:', error)

    return null
  }
}

/**
 * Get the end of day for a date
 */
export const getEndOfDay = (date: string | Date | null | undefined): Date | null => {
  if (!date)
    return null

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return null

    const endOfDay = new Date(dateObj)

    endOfDay.setHours(23, 59, 59, 999)

    return endOfDay
  }
  catch (error) {
    console.error('Error getting end of day:', error)

    return null
  }
}

/**
 * Parse a date string to Date object
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString)
    return null

  try {
    const date = parseISO(dateString)

    return isValid(date) ? date : null
  }
  catch (error) {
    console.error('Error parsing date:', error)

    return null
  }
}

/**
 * Convert Date object to ISO string
 */
export const toISOString = (date: Date | null | undefined): string => {
  if (!date)
    return ''

  try {
    return date.toISOString()
  }
  catch (error) {
    console.error('Error converting date to ISO string:', error)

    return ''
  }
}

/**
 * Get current date in ISO format
 */
export const getCurrentDateISO = (): string => {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get current datetime in ISO format
 */
export const getCurrentDateTimeISO = (): string => {
  return new Date().toISOString()
}

/**
 * Add days to a date
 */
export const addDays = (date: string | Date | null | undefined, days: number): Date | null => {
  if (!date)
    return null

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return null

    const newDate = new Date(dateObj)

    newDate.setDate(newDate.getDate() + days)

    return newDate
  }
  catch (error) {
    console.error('Error adding days to date:', error)

    return null
  }
}

/**
 * Subtract days from a date
 */
export const subtractDays = (date: string | Date | null | undefined, days: number): Date | null => {
  if (!date)
    return null

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj))
      return null

    const newDate = new Date(dateObj)

    newDate.setDate(newDate.getDate() - days)

    return newDate
  }
  catch (error) {
    console.error('Error subtracting days from date:', error)

    return null
  }
}

/**
 * Get date range for a period
 */
export const getDateRange = (period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'): { start: Date; end: Date } | null => {
  const now = new Date()

  try {
    switch (period) {
      case 'today':
        return {
          start: getStartOfDay(now) || now,
          end: getEndOfDay(now) || now,
      }

      case 'yesterday':
        const yesterday = subtractDays(now, 1)
        return {
          start: getStartOfDay(yesterday) || now,
          end: getEndOfDay(yesterday) || now,
      }

      case 'thisWeek':
        const startOfWeek = new Date(now)

        startOfWeek.setDate(now.getDate() - now.getDay())
        return {
          start: getStartOfDay(startOfWeek) || now,
          end: getEndOfDay(now) || now,
      }

      case 'lastWeek':
        const lastWeekStart = new Date(now)

        lastWeekStart.setDate(now.getDate() - now.getDay() - 7)

        const lastWeekEnd = new Date(now)

        lastWeekEnd.setDate(now.getDate() - now.getDay() - 1)
        return {
          start: getStartOfDay(lastWeekStart) || now,
          end: getEndOfDay(lastWeekEnd) || now,
      }

      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return {
          start: getStartOfDay(startOfMonth) || now,
          end: getEndOfDay(now) || now,
      }

      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          start: getStartOfDay(lastMonthStart) || now,
          end: getEndOfDay(lastMonthEnd) || now,
      }

      default:
        return null
    }
  }
  catch (error) {
    console.error('Error getting date range:', error)

    return null
  }
}
