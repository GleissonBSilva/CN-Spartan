export type ProfileRole = 'admin' | 'client';
export type ProfileStatus = 'ativo' | 'suspenso' | 'vencido';

export interface Profile {
  id: string;
  email: string;
  whatsapp?: string;
  role: ProfileRole;
  status: ProfileStatus;
  plan_name: string;
  expires_at: string;
  max_screens: number;
  created_at: string;
}

export interface ProfileUpdateInput {
  status?: ProfileStatus;
  role?: ProfileRole;
  whatsapp?: string;
  plan_name?: string;
  expires_at?: string;
  max_screens?: number;
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
          role?: ProfileRole;
          status?: ProfileStatus;
          plan_name?: string;
          expires_at?: string;
          max_screens?: number;
          created_at?: string;
        };
        Update: Partial<{
          email: string;
          role: ProfileRole;
          status: ProfileStatus;
          plan_name: string;
          expires_at: string;
          max_screens: number;
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
