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
