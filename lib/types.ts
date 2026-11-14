export type Role = "ADMIN" | "USER";

export interface DevUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface BillingConfig {
  id: string;
  userId: string;
  enabled: boolean;
  rateKobo: number;
  windowStart: number | null;
  windowEnd: number | null;
  timezone: string;
}

export interface Me {
  id: string;
  email: string;
  name: string;
  role: Role;
  balanceKobo: number;
  billingConfig: BillingConfig | null;
}

export type TransactionType = "TOPUP" | "DEBIT" | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  type: TransactionType;
  amountKobo: number;
  balanceAfterKobo: number;
  description?: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  balanceKobo: number;
  billingConfig: BillingConfig | null;
  online: boolean;
}

export interface FeedItem {
  id: string;
  kind: TransactionType;
  userId: string;
  name: string;
  amountKobo: number;
  balanceAfterKobo: number;
  at: string;
}

export interface BillingPatch {
  enabled?: boolean;
  rateKobo?: number;
  windowStart?: number | null;
  windowEnd?: number | null;
  timezone?: string;
}
