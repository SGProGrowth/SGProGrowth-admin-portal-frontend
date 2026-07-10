export type EntityRecord = Record<string, string | number> & { id: number };

export type DataMap = Record<string, EntityRecord[]>;

export interface AuthUser {
  email: string;
  name: string;
  role: 'admin' | 'instructor' | 'student';
}

export interface ActivityItem {
  user: string;
  action: string;
  time: string;
}

export interface MessageItem {
  id?: number;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
}

export interface JwtClaims {
  sub: string;
  email: string;
  name: string;
  role: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}
