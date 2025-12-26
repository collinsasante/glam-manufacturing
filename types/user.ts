export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  VIEWER = 'viewer',
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  permissions?: string[]; // Optional permission overrides
}

export interface AuthUser {
  uid: string;
  email: string | null;
  role?: UserRole;
}
