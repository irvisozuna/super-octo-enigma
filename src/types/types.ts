export interface location {
  lat: number
  lng: number
}
export interface UserInfoType {
  firstName: string
  lastName: string
  contact: string | null
  profileImage: string | null
}

export interface CompanyInfoType {
  companyName: string;
  activity: string;
  address: string;
  location: location;
}

export interface PropertyListingData {
  userInfo: UserInfoType,
  companyInfo: CompanyInfoType
}


export interface User {
  id: string
  email: string
  firstName: string
  role: string
  avatar: string
  lastName: string
  username: string
  wizardStep: number
}
