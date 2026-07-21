// Hand-written to match supabase/schema.sql. Once the project is linked to a
// real Supabase project, regenerate with:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
//
// NOTE: every row shape below is a `type` alias, not an `interface`. TS only
// treats plain object-literal types as satisfying supabase-js's
// `Record<string, unknown>` constraints — named `interface`s don't, and the
// whole Database generic silently collapses to `never` if you use one here.

export type AppRole = "admin" | "editor" | "viewer";
export type IuranType = "harian" | "bulanan";
export type WalletName = "dompet" | "bank";
export type WalletTransactionType =
  | "deposit"
  | "withdrawal"
  | "transfer_in"
  | "transfer_out";

type SettingsRow = {
  id: boolean;
  class_name: string;
  iuran_type: IuranType;
  iuran_amount: number;
  updated_at: string;
};

type DuesOverrideRow = {
  id: string;
  period: string;
  amount: number;
  note: string | null;
  created_at: string;
};

type MemberRow = {
  id: string;
  full_name: string;
  email: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  active: boolean;
  join_date: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  member_id: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  member_id: string;
  period: string;
  amount: number;
  paid_at: string;
  recorded_by: string | null;
  note: string | null;
};

type WalletTransactionRow = {
  id: string;
  wallet: WalletName;
  type: WalletTransactionType;
  amount: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

type WalletBalanceRow = {
  wallet: WalletName;
  balance: number;
};

export type Database = {
  public: {
    Tables: {
      settings: {
        Row: SettingsRow;
        Insert: Partial<SettingsRow>;
        Update: Partial<SettingsRow>;
        Relationships: [];
      };
      dues_overrides: {
        Row: DuesOverrideRow;
        Insert: Omit<DuesOverrideRow, "id" | "created_at"> &
          Partial<Pick<DuesOverrideRow, "id">>;
        Update: Partial<DuesOverrideRow>;
        Relationships: [];
      };
      members: {
        Row: MemberRow;
        Insert: Omit<MemberRow, "id" | "created_at" | "active" | "join_date"> &
          Partial<Pick<MemberRow, "id" | "active" | "join_date">>;
        Update: Partial<MemberRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Omit<PaymentRow, "id" | "paid_at"> &
          Partial<Pick<PaymentRow, "id" | "paid_at">>;
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
      wallet_transactions: {
        Row: WalletTransactionRow;
        Insert: Omit<WalletTransactionRow, "id" | "created_at"> &
          Partial<Pick<WalletTransactionRow, "id">>;
        Update: Partial<WalletTransactionRow>;
        Relationships: [];
      };
    };
    Views: {
      wallet_balances: {
        Row: WalletBalanceRow;
        Relationships: [];
      };
    };
    Functions: {
      record_payment: {
        Args: {
          p_member_id: string;
          p_period: string;
          p_amount: number;
          p_note?: string | null;
        };
        Returns: PaymentRow;
      };
      record_withdrawal: {
        Args: {
          p_wallet: WalletName;
          p_amount: number;
          p_reason: string;
        };
        Returns: WalletTransactionRow;
      };
      record_transfer: {
        Args: {
          p_from_wallet: WalletName;
          p_to_wallet: WalletName;
          p_amount: number;
          p_note?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRole;
      iuran_type: IuranType;
    };
  };
};
