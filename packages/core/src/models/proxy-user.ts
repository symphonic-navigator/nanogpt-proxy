export interface ProxyUser {
  id?: string;
  email: string;
  apiKeyEncrypted: string;
  role?: 'USER' | 'ADMIN';
}
