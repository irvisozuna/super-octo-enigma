export interface ContractRegistry {
  id: number
  controlNumber: number
  contractNumber: number
  name: string
  cardNumber: string
  maxAmount: number
  expirationDate: string
  bank: string
  accountType: string
  registrationDate: string
  chargeFrequency: number
  phone: string
}

export interface ContractRegistryCreateRequest {
  controlNumber: number
  contractNumber: number
  name: string
  cardNumber: string
  maxAmount: number
  expirationDate: string
  bank: string
  accountType: string
  registrationDate: string
  chargeFrequency: number
  phone: string
}

export interface ContractRegistryUpdateRequest {
  controlNumber?: number
  contractNumber?: number
  name?: string
  cardNumber?: string
  maxAmount?: number
  expirationDate?: string
  bank?: string
  accountType?: string
  registrationDate?: string
  chargeFrequency?: number
  phone?: string
}

export interface ContractRegistryListResponse {
  data: ContractRegistry[]
  pagination: {
    limit: number
    offset: number
    count: number
    total: number
  }
}

export interface ContractCatalogItem {
  account: string
  nameuser: string
}
