export interface JwtPayload {
  sub: string; // Email address
  r: string[]; // roles list, ex: ['admin']
}
