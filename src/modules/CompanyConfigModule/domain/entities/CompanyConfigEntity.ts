/**
 * Company configuration entity for theme and branding settings
 */
export interface CompanyConfigEntity {
  id?: string
  companyId: string

  // Theme colors
  primaryColor: string
  primaryDarkenColor: string
  secondaryColor: string
  secondaryDarkenColor: string

  // Theme settings
  theme: 'light' | 'dark' | 'system'
  skin: 'default' | 'bordered'
  semiDarkMenu: boolean

  // Layout settings
  layout: 'vertical' | 'collapsed' | 'horizontal'
  contentWidth: 'boxed' | 'fluid'

  // Branding
  appTitle: string
  loginLogo?: string // Base64 o URL
  menuLogo?: string // Base64 o URL
  favicon?: string // Base64 o URL

  // Metadata
  updatedAt?: string
  updatedBy?: string
  version?: number // Para control de versiones del cache
}

export class CompanyConfig implements CompanyConfigEntity {
  id?: string
  companyId: string
  primaryColor: string
  primaryDarkenColor: string
  secondaryColor: string
  secondaryDarkenColor: string
  theme: 'light' | 'dark' | 'system'
  skin: 'default' | 'bordered'
  semiDarkMenu: boolean
  layout: 'vertical' | 'collapsed' | 'horizontal'
  contentWidth: 'boxed' | 'fluid'
  appTitle: string
  loginLogo?: string
  menuLogo?: string
  favicon?: string
  updatedAt?: string
  updatedBy?: string
  version?: number

  constructor(data: CompanyConfigEntity) {
    this.id = data.id
    this.companyId = data.companyId
    this.primaryColor = data.primaryColor
    this.primaryDarkenColor = data.primaryDarkenColor
    this.secondaryColor = data.secondaryColor
    this.secondaryDarkenColor = data.secondaryDarkenColor
    this.theme = data.theme
    this.skin = data.skin
    this.semiDarkMenu = data.semiDarkMenu
    this.layout = data.layout
    this.contentWidth = data.contentWidth
    this.appTitle = data.appTitle
    this.loginLogo = data.loginLogo
    this.menuLogo = data.menuLogo
    this.favicon = data.favicon
    this.updatedAt = data.updatedAt
    this.updatedBy = data.updatedBy
    this.version = data.version
  }

  static getDefaultConfig(): CompanyConfigEntity {
    return {
      companyId: '',
      primaryColor: '#7367F0',
      primaryDarkenColor: '#675DD8',
      secondaryColor: '#FF9F43',
      secondaryDarkenColor: '#E6892E',
      theme: 'light',
      skin: 'default',
      semiDarkMenu: false,
      layout: 'vertical',
      contentWidth: 'fluid',
      appTitle: 'My Application',
      version: 1,
    }
  }
}