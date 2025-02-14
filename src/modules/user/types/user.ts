// src/modules/User/types/User.ts
export interface User {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role?: string | string[] | null;
  createdAt?: string;
  updatedAt?: string;
}
