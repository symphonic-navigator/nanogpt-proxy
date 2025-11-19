export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'USER';
}
