export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'currency';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
}

export type EntityRecord = Record<string, string | number> & { id: number };

export interface PromoteConfig {
  field: string;
  from: string;
  to: string;
  label: string;
  revertLabel: string;
}

export interface EntityDef {
  key: string;
  label: string;
  singular: string;
  icon: string;
  group: string;
  view?: 'cards' | 'table';
  fields: FieldDef[];
  columns?: string[];
  seed: EntityRecord[];
  promote?: PromoteConfig;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface Quote {
  text: string;
  author: string;
}

export interface ActivityItem {
  user: string;
  action: string;
  time: string;
}

export interface MessageItem {
  from: string;
  preview: string;
  time: string;
  unread: boolean;
}

export interface AuthUser {
  loggedIn: boolean;
  email: string;
  name: string;
  role: 'instructor' | 'student' | 'admin';
}
