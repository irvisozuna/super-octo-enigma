// src/modules/users/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: 'active' | 'inactive' | 'pending'
  avatar?: string
  createdAt?: string
  updatedAt?: string
}
