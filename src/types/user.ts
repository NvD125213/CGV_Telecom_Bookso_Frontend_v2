export interface IUser {
  sub: string; // username
  exp: number; // expiration timestamp
  role: number; // user role (1 for admin, etc)
  iat: number; // issued at timestamp
}
