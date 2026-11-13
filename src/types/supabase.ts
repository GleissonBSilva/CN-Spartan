export type ProfileRole = 'admin' | 'client';
export type ProfileStatus = 'ativo' | 'suspenso' | 'vencido';

export interface ActiveDeviceSession {
  deviceId: string;
  deviceName: string;
  lastPing: number;
  platform?: 'apk' | 'tvbox' | 'mobile-web' | 'web';
  appVersion?: string;
  currentPath?: string;
  ip?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  whatsapp?: string;
  role: ProfileRole;
  status: ProfileStatus;
  plan_name: string;
  is_trial?: boolean;
  trial_used?: boolean;
  expires_at: string;
  max_screens: number;
  active_devices?: ActiveDeviceSession[];
  last_platform?: string;
  last_ip?: string;
  last_seen_at?: string;
  created_at: string;
  admin_updated_at?: string;
}

export interface UsedTrial {
  id: string;
  email: string;
  whatsapp?: string;
  claimed_at: string;
  trial_days: number;
  notes?: string;
}

export interface ProfileUpdateInput {
  status?: ProfileStatus;
  role?: ProfileRole;
  full_name?: string;
  whatsapp?: string;
  plan_name?: string;
  is_trial?: boolean;
  trial_used?: boolean;
  expires_at?: string;
  max_screens?: number;
  active_devices?: ActiveDeviceSession[];
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          whatsapp?: string;
          role?: ProfileRole;
          status?: ProfileStatus;
          plan_name?: string;
          is_trial?: boolean;
          trial_used?: boolean;
          expires_at?: string;
          max_screens?: number;
          active_devices?: ActiveDeviceSession[];
          created_at?: string;
          admin_updated_at?: string;
        };
        Update: Partial<{
          email: string;
          full_name: string;
          whatsapp: string;
          role: ProfileRole;
          status: ProfileStatus;
          plan_name: string;
          is_trial: boolean;
          trial_used: boolean;
          expires_at: string;
          max_screens: number;
          active_devices: ActiveDeviceSession[];
          admin_updated_at: string;
        }>;
      };
      used_trials: {
        Row: UsedTrial;
        Insert: {
          id?: string;
          email: string;
          whatsapp?: string;
          claimed_at?: string;
          trial_days?: number;
          notes?: string;
        };
        Update: Partial<UsedTrial>;
      };
      system_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: Partial<{
          key: string;
          value: Json;
          updated_at: string;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
  };
}
